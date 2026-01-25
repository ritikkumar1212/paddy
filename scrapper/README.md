# Paddy Power Virtual Horse Racing Scraper

Scrapes virtual horse racing data and results from Paddy Power using OCR.

## Dependencies

**System:**

```bash
# macOS
brew install tesseract
# Firefox: Download from https://www.mozilla.org/firefox/
```

**Windows:**

1. Download Firefox: https://www.mozilla.org/firefox/
2. Download Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
   - Install to default path: `C:\Program Files\Tesseract-OCR\`

**Python:**

```bash
pip install selenium webdriver-manager pytesseract pillow openpyxl watchdog
```

## Usage

⚠️ **UK VPN required**

Run in 3 separate terminals:

```bash
python scraper.py          # Scrapes race data → races.csv
python selenium_scraper.py # OCR results → race_results.csv
python pattern_matcher.py  # Matches & generates → race_analysis.xlsx
```

## Scripts

| Script                | Output               | Description                    |
| --------------------- | -------------------- | ------------------------------ |
| `scraper.py`          | `races.csv`          | Pre-race runner data           |
| `selenium_scraper.py` | `race_results.csv`   | OCR-extracted results          |
| `pattern_matcher.py`  | `race_analysis.xlsx` | Excel with highlighted winners |
