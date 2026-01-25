"""
Selenium-based Race Results Scraper for Paddy Power Virtual Racing
Uses Firefox for better video codec support

This script:
1. Opens the Paddy Power virtuals page in Firefox
2. Takes screenshots at intervals
3. Uses OCR (pytesseract) to extract race results text
4. Saves results to a CSV file

Requirements:
    pip install selenium webdriver-manager pytesseract pillow
    # Firefox and geckodriver are auto-managed by webdriver-manager
"""

import os
import time
import csv
import requests
from datetime import datetime
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.firefox import GeckoDriverManager
import pytesseract
from PIL import Image
import re
import platform

BACKEND_URL = "http://localhost:5000"   # change if deployed

def save_results_to_api(results, race_time, video_race_time=""):
    """
    Send OCR results to backend API (Postgres insert).
    results = list from parse_race_results()
    race_time = timestamp string (your screenshot time)
    video_race_time = extracted UK time from OCR
    """
    try:
        payload = {
            "race_time_capture": race_time,
            "video_race_time_uk": video_race_time,
            "scraped_at": datetime.now().isoformat(),
            "results": []
        }

        for r in results:
            # horse_number might not always be valid
            horse_num = r.get("horse_number", "")
            try:
                horse_num = int(str(horse_num).strip())
            except:
                horse_num = None

            payload["results"].append({
                "position": int(r.get("position", 0)),
                "horse_number": horse_num,
                "raw_text": r.get("raw_text", ""),
                "full_line": r.get("full_line", "")
            })

        res = requests.post(f"{BACKEND_URL}/api/results", json=payload, timeout=15)

        if res.status_code in (200, 201):
            print(f"✅ Results inserted into DB successfully (video time: {video_race_time})")
        else:
            print(f"❌ Failed to insert results | Status: {res.status_code} | {res.text}")

    except Exception as e:
        print(f"❌ Error sending results to API: {e}")


# Windows: Set tesseract path if not in PATH
if platform.system() == 'Windows':
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path


# Configuration
SCREENSHOT_DIR = Path(__file__).parent / "screenshots"
RESULTS_CSV = Path(__file__).parent / "race_results.csv"

# How often to take a screenshot (seconds)
SCREENSHOT_INTERVAL = 10

# Window size for better OCR
WINDOW_WIDTH = 1400
WINDOW_HEIGHT = 900


def setup_directories():
    """Create necessary directories."""
    SCREENSHOT_DIR.mkdir(exist_ok=True)


def take_screenshot(driver, filename):
    """Take a screenshot."""
    screenshot_path = SCREENSHOT_DIR / filename
    driver.save_screenshot(str(screenshot_path))
    return screenshot_path


def extract_text_from_image(image_path):
    """
    Use OCR to extract text from a screenshot.
    Returns the extracted text.
    """
    try:
        image = Image.open(image_path)
        
        # Convert to grayscale for better OCR
        image = image.convert('L')
        
        # Use pytesseract to extract text
        text = pytesseract.image_to_string(image)
        
        return text.strip()
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""


def extract_race_time_from_ocr(text):
    """
    Extract race time from OCR text.
    Handles various OCR formats:
    - "14:00 GLENVIEW GARDENS" (normal)
    - "14 00 GLENVIEW GARDENS" (space instead of colon)
    - "14  02 GLENVIEW GARDENS" (double space)
    - "1400 GLENVIEW" (no separator)
    Returns the time in HH:MM format or empty string if not found.
    """
    import re
    
    # Patterns to match time before GLENVIEW (or variations)
    # Order from most specific to least specific
    patterns = [
        r'(\d{1,2})\s*:\s*(\d{2})\s*(?:GLENVIEW|GI\.?ENVIEW|GLEN)',  # 14:00 or 14 : 00
        r'(\d{1,2})\s+(\d{2})\s+(?:GLENVIEW|GI\.?ENVIEW|GLEN)',       # 14 00 or 14  02 (spaces)
        r'(\d{2})(\d{2})\s*(?:GLENVIEW|GI\.?ENVIEW|GLEN)',            # 1400 (no separator)
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            hours = int(match.group(1))
            minutes = int(match.group(2))
            if 0 <= hours <= 23 and 0 <= minutes <= 59:
                return f"{hours:02d}:{minutes:02d}"
    
    return ""


def parse_race_results(text):
    """
    Parse race results from OCR text.
    
    The OCR output format shows results as:
    - Lines with horse number, horse name (CAPS), jockey name (CAPS/mixed)
    - Example: "6 JONNYS STREET DECIAN BARK" or "/8 4 CHOPSTICKS BRIAN MYERS"
    
    Returns a list of result entries.
    """
    results = []
    lines = text.split('\n')
    
    # Pattern to match: optional prefix chars, number, then horse name (letters/spaces)
    # More flexible pattern to handle OCR variations
    horse_pattern = re.compile(r'[^A-Za-z0-9]*(\d+)\s+([A-Za-z][A-Za-z\s]+)')
    
    position = 0  # Track position (1st, 2nd, 3rd, 4th based on order)
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Skip lines that are clearly not results (race info, headers, etc.)
        skip_patterns = ['FORECAST', 'TRICAST', 'FORM', 'RUNNERS', 'EWTERMS', 'ODDS', 'RAN', 'LIVE', 'GARDENS', 'FWTERMS', 'TERMS']
        if any(skip in line.upper() for skip in skip_patterns):
            continue
        
        # Skip lines that look like race time/name (e.g., "11:50 GLENVIEW...")
        if re.match(r'^\s*=?\s*\d{1,2}\s*:?\s*\d{2}', line):
            continue
        
        # Skip very short lines or lines that are just symbols
        if len(line) < 5:
            continue
        
        # Clean up OCR noise: replace common OCR artifacts with spaces
        clean_line = line
        for char in ['°', '|', '\\', '/', '[', ']', '{', '}', '«', '»', '~', '`']:
            clean_line = clean_line.replace(char, ' ')
        
        # Normalize multiple spaces to single space
        clean_line = ' '.join(clean_line.split())
        
        # More flexible pattern: find any digit followed by uppercase word
        # Pattern: any non-digit/letter chars, then digit(s), then space(s), then name
        horse_pattern = re.compile(r'[^A-Za-z0-9]*(\d{1,2})\s+([A-Za-z][A-Za-z\s]+)')
        
        # Look for horse entries
        match = horse_pattern.search(clean_line)
        if match:
            horse_number = match.group(1)
            horse_info = match.group(2).strip()
            
            # Need at least 2 words (horse name + jockey)
            words = horse_info.split()
            if len(words) >= 2:
                # Validate: horse name must have at least 2 consecutive uppercase letters
                # (reduced from 3 since some names are short like "JAKE")
                first_word = words[0]
                uppercase_count = sum(1 for c in first_word if c.isupper())
                
                # Horse name should be mostly uppercase (at least 2 uppercase letters)
                if uppercase_count >= 2 and len(first_word) >= 2:
                    position += 1
                    results.append({
                        'position': position,
                        'horse_number': horse_number,
                        'raw_text': horse_info,
                        'full_line': line
                    })
                    
                    # Only get top 4 results
                    if position >= 4:
                        break
    
    return results


def save_results_to_csv(results, race_time, video_race_time=""):
    """Save parsed results to CSV file with video_race_time for matching."""
    file_exists = RESULTS_CSV.exists()
    
    with open(RESULTS_CSV, 'a', newline='', encoding='utf-8') as f:
        fieldnames = ['race_time', 'video_race_time', 'position', 'horse_number', 'raw_text', 'full_line', 'scraped_at']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        scraped_at = datetime.now().isoformat()
        for result in results:
            row = {
                'race_time': race_time,
                'video_race_time': video_race_time,  # The UK time from video OCR
                'position': result['position'],
                'horse_number': result.get('horse_number', ''),
                'raw_text': result['raw_text'],
                'full_line': result['full_line'],
                'scraped_at': scraped_at
            }
            writer.writerow(row)
    
    print(f"Saved {len(results)} results to {RESULTS_CSV} (video time: {video_race_time})")


def is_results_screen(text):
    """
    Detect if the current screen shows race results.
    Look for FORECAST/TRICAST (betting payouts) which indicate results.
    """
    # Strong indicators of results screen (betting payouts)
    strong_indicators = ['forecast', 'tricast']
    # Also check for position indicators
    position_indicators = ['1st', '2nd', '3rd', 'winner']
    
    text_lower = text.lower()
    
    # Check for strong indicators first
    for indicator in strong_indicators:
        if indicator in text_lower:
            return True
    
    # Check for position indicators
    for indicator in position_indicators:
        if indicator in text_lower:
            return True
    
    return False


# Configuration for auto-restart
RESTART_TIMEOUT = 240  # 4 minutes - restart if no results for this long


def run_scraper_session():
    """
    Run a single scraper session.
    Returns True if should restart, False if user cancelled.
    """
    setup_directories()
    
    print("Starting Selenium Firefox Race Results Scraper...")
    print(f"Screenshots will be saved to: {SCREENSHOT_DIR}")
    print(f"Results will be saved to: {RESULTS_CSV}")
    
    # Setup Firefox options
    firefox_options = Options()
    firefox_options.add_argument("--width={}".format(WINDOW_WIDTH))
    firefox_options.add_argument("--height={}".format(WINDOW_HEIGHT))
    
    # Initialize Firefox driver
    print("Starting Firefox browser...")
    service = Service(GeckoDriverManager().install())
    driver = webdriver.Firefox(service=service, options=firefox_options)
    
    screenshot_count = 0
    last_results_text = ""
    last_video_race_time = ""
    last_result_time = time.time()  # Track when we last found a result
    
    try:
        driver.set_window_size(WINDOW_WIDTH, WINDOW_HEIGHT)
        
        STREAMAMG_URL = "https://paddypower.streamamg.com/horsesflats.html"
        print(f"Navigating to: {STREAMAMG_URL}")
        driver.get(STREAMAMG_URL)
        
        print("Waiting 5 seconds for video to load...")
        time.sleep(5)
        
        print("✅ Starting OCR capture immediately!")
        print(f"Taking screenshots every {SCREENSHOT_INTERVAL} seconds")
        print(f"⚠️ Auto-restart if no results for {RESTART_TIMEOUT // 60} minutes")
        print("Press Ctrl+C to stop\n")
        
        while True:
            # Check if we need to restart (no results for too long)
            time_since_result = time.time() - last_result_time
            if time_since_result > RESTART_TIMEOUT:
                print(f"\n⚠️ No results for {RESTART_TIMEOUT // 60} minutes. Restarting...")
                return True  # Signal to restart
            
            # Take a screenshot
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screenshot_{timestamp}.png"
            screenshot_path = take_screenshot(driver, filename)
            screenshot_count += 1
            
            # Extract text using OCR
            text = extract_text_from_image(screenshot_path)
            
            print(f"\n--- Screenshot {screenshot_count} ({timestamp}) ---")
            
            if text:
                print(f"Extracted text preview:\n{text[:500]}")
                
                # Check if this is a results screen
                if is_results_screen(text) and text != last_results_text:
                    print("\n🏇 RACE RESULTS DETECTED!")
                    
                    # Extract video race time from OCR (UK time)
                    video_race_time = extract_race_time_from_ocr(text)
                    
                    if video_race_time:
                        print(f"📍 Video race time (UK): {video_race_time}")
                        last_video_race_time = video_race_time
                    elif last_video_race_time:
                        try:
                            parts = last_video_race_time.split(':')
                            prev_minutes = int(parts[0]) * 60 + int(parts[1])
                            new_minutes = prev_minutes + 2
                            new_hours = new_minutes // 60
                            new_mins = new_minutes % 60
                            video_race_time = f"{new_hours:02d}:{new_mins:02d}"
                            last_video_race_time = video_race_time
                            print(f"📍 Video race time (estimated): {video_race_time} (prev + 2min)")
                        except:
                            pass
                    
                    # Parse and save results
                    results = parse_race_results(text)
                    if results:
                        race_time = timestamp
                        save_results_to_api(results, race_time, video_race_time)
                        print(f"Found {len(results)} results")
                        
                        # Delete screenshot after saving results (save storage)
                        os.remove(screenshot_path)
                        print(f"🗑️ Screenshot deleted (results saved to API)")

                        # Reset the timeout counter
                        last_result_time = time.time()
                        
                        # Wait longer after finding results to avoid duplicate captures
                        print("⏳ Waiting 25 seconds before next screenshot (to avoid duplicates)...")
                        time.sleep(25)
                        continue
                    else:
                        os.remove(screenshot_path)
                        print(f"🗑️ Screenshot deleted (no parseable results)")
                    
                    last_results_text = text
                else:
                    os.remove(screenshot_path)
                    print(f"🗑️ Screenshot deleted (no results)")
            else:
                print("No text detected in screenshot")
                os.remove(screenshot_path)
                print(f"🗑️ Screenshot deleted (no text)")
            
            # Wait before next screenshot (normal interval)
            time.sleep(SCREENSHOT_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\nStopping scraper...")
        return False  # Don't restart
    
    except Exception as e:
        print(f"\n❌ Error occurred: {e}")
        print("Will restart in 10 seconds...")
        time.sleep(10)
        return True  # Signal to restart
    
    finally:
        try:
            driver.quit()
        except:
            pass
        print(f"\nTotal screenshots taken: {screenshot_count}")
        print(f"Results saved to: {RESULTS_CSV}")
        print(f"Check {SCREENSHOT_DIR} for saved screenshots")


def main():
    """Main function with auto-restart on errors or timeout."""
    restart_count = 0
    
    while True:
        if restart_count > 0:
            print(f"\n{'='*60}")
            print(f"🔄 RESTART #{restart_count}")
            print(f"{'='*60}\n")
        
        should_restart = run_scraper_session()
        
        if not should_restart:
            break  # User cancelled
        
        restart_count += 1
        print(f"\nRestarting scraper (attempt #{restart_count + 1})...")
    
    print("Scraper stopped.")


if __name__ == "__main__":
    main()
