"""
Paddy Power Virtual Racing Scraper - Selenium Firefox Version

This script:
1. Opens Firefox browser
2. Navigates to Paddy Power Virtual Horse Racing
3. Continuously scrapes race data (runners, jockeys, odds)
4. Saves to CSV with one race per row

Requirements:
    pip install selenium webdriver-manager
"""

import time
import csv
import requests
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.firefox import GeckoDriverManager


CSV_FILE = "races.csv"

BACKEND_URL = "http://localhost:5000"   # change if deployed

def save_to_api(race_data):
    """
    Send race runners data to backend API (Postgres insert).
    race_data format is same as your scraper.
    """
    try:
        race_time_ist = race_data["race_time"]
        race_time_uk = convert_ist_to_uk(race_time_ist)

        payload = {
            "race_time": race_time_ist,
            "race_time_uk": race_time_uk,
            "runner_count": len(race_data["runners"]),
            "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "runners": []
        }

        for runner in race_data["runners"]:
            # runner number might come as string -> convert safely
            try:
                number = int(str(runner.get("number", "")).strip())
            except:
                continue

            payload["runners"].append({
                "number": number,
                "name": runner.get("name", "N/A"),
                "jockey": runner.get("jockey", "N/A"),
                "odds": runner.get("odds", "N/A")
            })

        res = requests.post(f"{BACKEND_URL}/api/races", json=payload, timeout=15)

        if res.status_code in (200, 201):
            print("✅ Race inserted into DB successfully")
        else:
            print(f"❌ Failed to insert race | Status: {res.status_code} | {res.text}")

    except Exception as e:
        print(f"❌ Error sending race to API: {e}")

def convert_ist_to_uk(time_str):
    """
    Convert IST time (HH:MM) to UK time.
    UK is 5:30 hours behind IST.
    """
    try:
        # Parse time (assuming HH:MM format)
        parts = time_str.strip().split(':')
        if len(parts) != 2:
            return time_str
        
        hours = int(parts[0])
        minutes = int(parts[1])
        
        # Convert to total minutes, subtract 5:30 (330 minutes)
        total_minutes = hours * 60 + minutes - 330
        
        # Handle day wraparound
        if total_minutes < 0:
            total_minutes += 24 * 60
        
        uk_hours = total_minutes // 60
        uk_minutes = total_minutes % 60
        
        return f"{uk_hours:02d}:{uk_minutes:02d}"
    except:
        return time_str


def save_to_csv(race_data):
    """
    Save race data to CSV with one race per row.
    Columns are based on runner number: name_1, jockey_1, odds_1, name_2, etc.
    Includes both IST race_time and UK race_time_uk for result matching.
    """
    file_exists = os.path.isfile(CSV_FILE)
    
    # Convert race time from IST to UK
    race_time_ist = race_data["race_time"]
    race_time_uk = convert_ist_to_uk(race_time_ist)
    
    # Build the row data using runner numbers as identifiers
    row = {
        "race_time": race_time_ist,
        "race_time_uk": race_time_uk,
        "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "runner_count": len(race_data["runners"])
    }
    
    # Add each runner's data with their number as the column identifier
    for runner in race_data["runners"]:
        num = runner["number"]
        row[f"name_{num}"] = runner["name"]
        row[f"jockey_{num}"] = runner["jockey"]
        row[f"odds_{num}"] = runner["odds"]
    
    # Read existing file to get all column names (runners can vary from 9-16)
    existing_columns = set()
    if file_exists:
        with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            existing_columns = set(reader.fieldnames or [])
    
    # Merge existing columns with new columns
    all_columns = existing_columns.union(set(row.keys()))
    
    # Sort columns: race_time first, then runner columns by number (name, jockey, odds order)
    base_cols = ["race_time", "race_time_uk", "runner_count", "scraped_at"]
    
    # Custom sort: first by runner number, then by field type (name first, then jockey, then odds)
    field_order = {'name': 0, 'jockey': 1, 'odds': 2}
    runner_cols = sorted(
        [c for c in all_columns if c not in base_cols],
        key=lambda x: (
            int(x.split('_')[-1]) if x.split('_')[-1].isdigit() else 999,
            field_order.get(x.rsplit('_', 1)[0], 999)
        )
    )
    fieldnames = base_cols + runner_cols
    
    # Read existing data
    existing_rows = []
    if file_exists:
        with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            existing_rows = list(reader)
    
    # Write all data back with updated columns
    with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        
        # Write existing rows
        for existing_row in existing_rows:
            writer.writerow(existing_row)
        
        # Write new row
        writer.writerow(row)
    
    print(f"Data saved to {CSV_FILE} (1 row with {len(race_data['runners'])} runners)")

# Configuration for auto-restart
RESTART_TIMEOUT = 240  # 4 minutes - restart if no new data for this long


def run_scraper_session():
    """
    Run a single scraper session.
    Returns True if should restart, False if user cancelled.
    """
    last_race_time = None
    last_data_time = time.time()  # Track when we last got new data
    
    # Setup Firefox options
    firefox_options = Options()
    firefox_options.add_argument("--width=1400")
    firefox_options.add_argument("--height=900")
    
    # Initialize Firefox driver
    print("Starting Firefox browser...")
    service = Service(GeckoDriverManager().install())
    driver = webdriver.Firefox(service=service, options=firefox_options)
    driver.set_window_size(1400, 900)
    
    target_url = "https://www.paddypower.com/horse-racing?tab=virtuals"
    
    try:
        # Navigate to home page first to initialize session
        print("Navigating to home page first to initialize session...")
        driver.get("https://www.paddypower.com/")
        time.sleep(5)
        
        # Handle cookie consent if it appears
        try:
            accept_button = driver.find_element(By.ID, "onetrust-accept-btn-handler")
            if accept_button.is_displayed():
                print("Accepting cookies...")
                accept_button.click()
                time.sleep(2)
        except:
            print("Cookie handling skipped")
        
        # Navigate to target URL with retries
        max_retries = 3
        for attempt in range(max_retries):
            print(f"Navigating to target: {target_url} (attempt {attempt + 1}/{max_retries})...")
            driver.get(target_url)
            time.sleep(5)
            
            current_url = driver.current_url
            print(f"Current URL: {current_url}")
            
            if "virtuals" in current_url:
                print("Successfully navigated to virtuals page!")
                break
            
            if current_url.endswith("/bet") or current_url == "https://www.paddypower.com/":
                print("Redirected to bet/home page, retrying...")
            else:
                print(f"On unexpected page: {current_url}")
                time.sleep(2)
        
        # Wait a bit more for page to fully load
        time.sleep(5)
        
        print(f"\n⚠️ Auto-refresh if no new data for {RESTART_TIMEOUT // 60} minutes")
        print(f"   Browser restart after 2 consecutive refreshes without data")
        
        refresh_count = 0  # Track consecutive refreshes without new data
        MAX_REFRESHES = 2  # Restart browser after this many refreshes without data
        
        # Main scraping loop
        while True:
            # Check if we need to refresh (no new data for too long)
            time_since_data = time.time() - last_data_time
            if time_since_data > RESTART_TIMEOUT:
                refresh_count += 1
                print(f"\n⚠️ No new data for {RESTART_TIMEOUT // 60} minutes. Refresh attempt {refresh_count}/{MAX_REFRESHES}...")
                
                if refresh_count >= MAX_REFRESHES:
                    print(f"❌ Still no data after {MAX_REFRESHES} refreshes. Restarting browser...")
                    return True  # Signal to restart browser
                
                try:
                    # First try to navigate to the target URL
                    driver.get(target_url)
                    time.sleep(5)
                    
                    # Verify we're on the right page
                    current_url = driver.current_url
                    if "virtuals" not in current_url:
                        print(f"Not on virtuals page ({current_url}). Navigating...")
                        driver.get(target_url)
                        time.sleep(5)
                    
                    print("✅ Page refreshed, continuing...")
                    last_data_time = time.time()  # Reset timeout for next refresh check
                except Exception as e:
                    print(f"❌ Refresh failed: {e}. Restarting browser...")
                    return True  # Signal to restart browser
            
            try:
                print("\nChecking for latest race...")
                
                # Wait for tabs to be visible
                wait = WebDriverWait(driver, 30)
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".virtuals-sport__tabs")))
                
                # Get all tabs
                tabs = driver.find_elements(By.CSS_SELECTOR, ".virtuals-sport__tabs .abc-tab")
                
                if len(tabs) > 0:
                    # Click the last tab to get the latest race
                    last_tab = tabs[-1]
                    race_time_elem = last_tab.find_element(By.CSS_SELECTOR, ".tab__title")
                    race_time = race_time_elem.text.strip()
                    
                    if race_time == last_race_time:
                        print(f"Race at {race_time} already scraped. Waiting for new race...")
                    else:
                        print(f"Found new race at: {race_time}")
                        last_tab.click()
                        time.sleep(3)
                        
                        # Wait for runners to appear
                        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".racing-runner")))
                        time.sleep(2)
                        
                        race_data = {"race_time": race_time, "runners": []}
                        
                        runners = driver.find_elements(By.CSS_SELECTOR, ".racing-runner")
                        print(f"Found {len(runners)} runners.")
                        
                        for runner in runners:
                            try:
                                name = runner.find_element(By.CSS_SELECTOR, ".racing-runner__selection-name").text
                            except:
                                try:
                                    name = runner.find_element(By.CSS_SELECTOR, ".racing-runner__title").text
                                except:
                                    name = "N/A"
                            try:
                                number = runner.find_element(By.CSS_SELECTOR, ".racing-runner__number").text
                            except:
                                number = "N/A"
                            try:
                                jockey = runner.find_element(By.CSS_SELECTOR, ".racing-runner__item .label-value__value").text
                            except:
                                jockey = "N/A"
                            try:
                                odds = runner.find_element(By.CSS_SELECTOR, ".btn-odds__label").text
                            except:
                                odds = "N/A"
                            
                            race_data["runners"].append({
                                "number": number,
                                "name": name,
                                "jockey": jockey,
                                "odds": odds
                            })

                        # Save to API
                        save_to_api(race_data)
                        last_race_time = race_time
                        last_data_time = time.time()  # Reset timeout counter
                        refresh_count = 0  # Reset refresh counter on new data
                else:
                    print("No race tabs found.")
                    
            except Exception as e:
                print(f"Error during loop: {e}")
                try:
                    print("Reloading page...")
                    driver.refresh()
                    time.sleep(5)
                except:
                    pass
            
            # Wait before next check
            print("Sleeping for 60 seconds...")
            time.sleep(60)
            
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


def scrape_continuous():
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
    scrape_continuous()
