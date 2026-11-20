# Stock Portfolio Tracker 📈 (Professional Edition)

[![Internship](https://img.shields.io/badge/Internship-CodeAlpha%20Python%20Programming-0052cc?style=for-the-badge)](https://www.codealpha.tech/)
[![Task](https://img.shields.io/badge/Task-Task%202%20(Fintech%20Pro%20Edition)-10b981?style=for-the-badge)](#project-information)
[![Tests](https://img.shields.io/badge/Tests-19%20Passing-brightgreen?style=for-the-badge)](#automated-unit-testing)
[![PWA](https://img.shields.io/badge/PWA-100%25%20Offline%20Ready-blueviolet?style=for-the-badge)](#progressive-web-app-pwa-support)
[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JavaScript%20%7C%20Python%203.10+-3b82f6?style=for-the-badge)](#technical-stack)

A professional, enterprise-grade **Stock Portfolio Tracker** web and terminal application developed for the **CodeAlpha Python Programming Internship (Task 2)**. Engineered with modern financial dashboard patterns, type-safe Python 3.10+ models, real-time investment and Unrealized Profit/Loss (P&L) calculations, interactive HTML5 Canvas charting, multi-currency support, a REST API, and an automated test suite.

---

## 🎯 CodeAlpha Task 2: Simplified Scope & Requirements Mapping

This repository includes both a **direct, textbook implementation** (`main.py`) matching the CodeAlpha syllabus requirements line-for-line, and a **production-grade enterprise edition** (`portfolio_tracker.py` + Web App):

| CodeAlpha Task 2 Requirement | Implementation in `main.py` | Implementation in Web App & Pro CLI |
| :--- | :--- | :--- |
| **Goal** | Build a simple stock tracker that calculates total investment based on manually defined stock prices. | Clean, user-friendly interactive terminal loop calculating individual and total investments. | Modern financial dashboard with live real-time investment preview (`Price × Qty`). |
| **Scope 1: User Inputs** | User inputs stock names and quantity via terminal `input()`. | Interactive prompts with input validation for symbol and share quantity. | Visual form with auto-capitalized ticker, instant validation feedback, and quantity field. |
| **Scope 2: Hardcoded Dictionary** | Use a hardcoded dictionary to define stock prices (`{"AAPL": 180, "TSLA": 250, ...}`). | Predefined `STOCK_PRICES` dictionary mapping tickers to benchmark prices. | `SAMPLE_STOCKS_CATALOG` dictionary auto-populating prices and preset quick-fill pills. |
| **Scope 3: Display Total Investment** | Display total investment value ($). | Formatted terminal summary report showing individual investments and cumulative total. | Dynamic KPI cards (`#kpi-total-investment`), table totals, and allocation metrics. |
| **Scope 4: File Handling** | Optionally save the result in a `.txt` or `.csv` file. | Prompts user to save portfolio to `portfolio_summary.txt` and/or `portfolio_summary.csv`. | Dedicated "Export TXT" and "Export CSV" buttons, plus JSON backup and PDF print. |
| **Key Concepts Used** | `dictionary`, `input/output`, `basic arithmetic`, `file handling` | All four key concepts clearly demonstrated with clean, readable, well-commented code. | Full object-oriented architecture, REST API, LocalStorage, and Canvas charting. |

### How to Run the Simplified Task 2 Tracker:
```bash
python main.py
```
*(Or via `python portfolio_tracker.py --simple`)*

---

## 📑 Table of Contents
1. [CodeAlpha Task 2: Simplified Scope & Requirements](#-codealpha-task-2-simplified-scope--requirements-mapping)
2. [Architectural Overview](#architectural-overview)
3. [Professional Features Matrix](#professional-features-matrix)
4. [Financial Calculations & Domain Models](#financial-calculations--domain-models)
5. [Sample Stock Catalog](#sample-stock-catalog)
6. [Directory Structure](#directory-structure)
7. [Web Dashboard User Guide](#web-dashboard-user-guide)
8. [Python CLI & REST API Guide](#python-cli--rest-api-guide)
9. [Automated Unit Testing](#automated-unit-testing)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Project Information](#project-information)

---

## 🏛️ Architectural Overview

This project is built from the ground up to demonstrate production-grade software engineering principles:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYERS                             │
├───────────────────────────────────┬────────────────────────────────────┤
│         WEB DASHBOARD (UI)        │       TERMINAL CLI DASHBOARD       │
│  - Responsive Glassmorphism Cards │  - ANSI Color-Coded Outputs        │
│  - Interactive Canvas Donut Chart │  - Tabular Performance Matrix      │
│  - Wall Street Market Ticker Tape │  - Menu & Scriptable CLI Modes     │
├───────────────────────────────────┴────────────────────────────────────┤
│                         COMMUNICATION & APIS                           │
├───────────────────────────────────┬────────────────────────────────────┤
│       CLIENT LOCALSTORAGE         │   BUILT-IN REST API (Python HTTP)  │
│  - Zero-lag offline persistence   │   - GET /api/portfolio             │
│  - Currency & theme state         │   - GET /api/stocks                │
│  - JSON Import / Export backups   │   - GET /api/summary               │
├───────────────────────────────────┴────────────────────────────────────┤
│                       CORE DOMAIN & BUSINESS LOGIC                     │
├───────────────────────────────────┬────────────────────────────────────┤
│     JAVASCRIPT APP ENGINE (ES6+)  │   PYTHON DOMAIN MODELS (3.10+)     │
│  - Real-time validation & preview │  - @dataclass(slots=True) Stock    │
│  - Multi-Currency FX Engine       │  - PortfolioTracker Service        │
│  - Dynamic sorting & search       │  - Custom domain exceptions        │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 💎 Professional Features Matrix

| Feature | Standard Requirement | Institutional Fintech Implementation |
| :--- | :--- | :--- |
| **Theme & UI** | Dark Navy / Blue Theme | Frosted glassmorphism, glowing accents, Wall Street live ticker tape, print PDF stylesheets |
| **Performance Chart** | Not specified | Interactive Area Performance Chart with hover crosshairs, balance tooltips, and timeframes (`1D`, `1W`, `1M`, `1Y`, `ALL`) |
| **Multi-Portfolio** | Single list | Multi-portfolio switcher tabs (`Main Portfolio`, `Tech Growth`, `Retirement`, `Watchlist`, plus custom portfolio creator) |
| **Passive Income** | Not specified | Dividend yield engine calculating annual passive income, monthly cash flow, and portfolio yield % |
| **Live Market Quotes** | Hardcoded only | Real-time `/api/quote?symbol=...` endpoint with Finnhub live API integration and benchmark catalog fallback |
| **PWA / Offline** | Browser only | 100% offline-ready Progressive Web App with Service Worker (`sw.js`) and installable desktop/mobile manifest |
| **Calculations** | Price × Quantity | Market Value, Cost Basis, Unrealized P&L ($), Return (%), Portfolio Weight (%), Annual Dividend Income |
| **Data Visuals** | Static list | High-DPI Canvas Donut Chart + Segmented Allocation Bar with tooltips & chips |
| **Multi-Currency** | USD only | Real-time currency selector (USD `$`, EUR `€`, GBP `£`, INR `₹`, JPY `¥`) |
| **Backup / Portability** | Browser LocalStorage | LocalStorage + JSON Export / Import + CSV Spreadsheet download + Task 2 TXT export |
| **Python Integration** | Not specified | Python 3.10+ OOP CLI, `argparse` subcommands, built-in REST API, 19 unit tests |
| **Productivity** | Mouse clicks only | Global Keyboard Shortcuts (`/` search, `Alt+N` new stock, `Esc` dismiss, `?` help) |

---

## 🧮 Financial Calculations & Domain Models

All calculations follow rigorous financial accounting formulas:

1. **Current Market Investment Value**:
   $$\text{Investment} = \text{Current Stock Price} \times \text{Quantity}$$

2. **Total Cost Basis (Capital Invested)**:
   $$\text{Cost Basis} = \text{Purchase Price} \times \text{Quantity}$$

3. **Unrealized Profit / Loss (P&L)**:
   $$\text{Unrealized P&L} = \text{Investment} - \text{Cost Basis}$$

4. **Return on Position (%)**:
   $$\text{Return } (\%) = \left(\frac{\text{Unrealized P&L}}{\text{Cost Basis}}\right) \times 100$$

5. **Annual Passive Dividend Income**:
   $$\text{Annual Dividend Income} = \sum (\text{Annual Dividend per Share}_i \times \text{Quantity}_i)$$

6. **Portfolio Dividend Yield (%)**:
   $$\text{Portfolio Yield } (\%) = \left(\frac{\text{Annual Dividend Income}}{\text{Total Investment}}\right) \times 100$$

7. **Portfolio Asset Weight (%)**:
   $$\text{Portfolio Weight } (\%) = \left(\frac{\text{Stock Investment}}{\sum \text{Stock Investment}_i}\right) \times 100$$

---

## 📊 Sample Stock Catalog

The application includes predefined sample stocks stored in both JavaScript objects and Python dictionaries:

| Symbol | Company Name | Benchmark Price | Sample Buy Price | Default Shares | Default Valuation | Unrealized P&L |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **MSFT** | Microsoft Corp. | \$400.00 | \$375.00 | 8.0 | \$3,200.00 | **+\$200.00 (+6.67%)** |
| **GOOGL** | Alphabet Inc. | \$140.00 | \$130.00 | 15.0 | \$2,100.00 | **+\$150.00 (+7.69%)** |
| **AAPL** | Apple Inc. | \$180.00 | \$165.00 | 10.0 | \$1,800.00 | **+\$150.00 (+9.09%)** |
| **TSLA** | Tesla Inc. | \$250.00 | \$260.00 | 5.0 | \$1,250.00 | **-\$50.00 (-3.85%)** |
| **TOTAL** | *Sample Portfolio* | — | — | **38.0 Shares** | **\$8,350.00** | **+\$450.00 (+5.70%)** |

---

## 📁 Directory Structure

```text
CodeAlpha_StockPortfolioTracker/
│
├── main.py                 # Core Task 2 implementation (Dictionary, I/O, Arithmetic, TXT/CSV files)
├── index.html              # Modern financial dashboard UI with ticker tape & modals
├── css/
│   └── style.css           # Professional dark theme, glassmorphism, responsive & print styles
├── js/
│   └── app.js              # Production JS engine, Canvas donut charting, currency FX & LocalStorage
├── portfolio_tracker.py    # Python 3.10+ CLI application, REST API & multi-threaded web server
├── tests/
│   └── test_portfolio.py   # Comprehensive automated unit test suite (18 unit tests)
├── requirements.txt        # Dependency specification (standard library design)
├── .gitignore              # Standard git exclusion rules
└── README.md               # Enterprise project documentation
```

---

## 🌐 Web Dashboard User Guide

### 1. Launching the Web App
Simply double-click `index.html` in your file browser or serve with Python:
```bash
python portfolio_tracker.py --web
```

### 2. Key Actions
- **Add Stock**: Enter ticker symbol, name, price, and share quantity. Optionally enter a purchase price to track Unrealized P&L.
- **Quick Sample Pills**: Click `AAPL`, `TSLA`, `GOOGL`, or `MSFT` to autofill details.
- **Search & Sort**: Type in the search box (or press `/`) to filter holdings; sort by Value, P&L, Name, Price, or Quantity.
- **Edit & Delete**: Click the pencil icon to update or the trash icon to trigger the safe confirmation modal.
- **Switch Currency**: Select `USD`, `EUR`, `GBP`, `INR`, or `JPY` from the header dropdown.
- **Export & Import**: Download CSV spreadsheets, export JSON backup files, or restore from JSON.
- **Executive PDF Print**: Click "Print" to generate a clean 1-page financial summary report.

---

## 🐍 Python CLI & REST API Guide

The Python companion script provides both an interactive terminal interface and scriptable subcommands.

### Interactive Mode:
```bash
python portfolio_tracker.py
```

### Scriptable CLI Subcommands:
```bash
# List formatted portfolio table
python portfolio_tracker.py list

# Add or update a stock holding
python portfolio_tracker.py add NVDA 130.00 20 --name "NVIDIA Corp" --buy-price 115.00

# Delete a stock holding
python portfolio_tracker.py delete NVDA

# Export portfolio to CSV or JSON
python portfolio_tracker.py export --format csv --output holdings.csv
python portfolio_tracker.py export --format json --output backup.json

# Launch local Web Server and REST API
python portfolio_tracker.py serve --port 8000
```

### Built-In REST API Endpoints:
When running `python portfolio_tracker.py serve`:
- `GET http://localhost:8000/api/portfolio` : Returns complete portfolio summary, stock holdings, allocations, and dividend yield metrics.
- `GET http://localhost:8000/api/stocks` : Returns array of stock holding objects.
- `GET http://localhost:8000/api/summary` : Returns high-level total investment, cost basis, P&L, and dividend income.
- `GET http://localhost:8000/api/quote?symbol=AAPL` : Real-time quote feed (supports Finnhub live quote or benchmark dictionary fallback).

---

## 🚀 Progressive Web App (PWA) & Free Cloud Deployment

### 1. Progressive Web App (Offline Ready)
- Ships with `manifest.json` and `sw.js` (Service Worker).
- Works 100% offline once opened; caches all HTML, CSS, and JS assets.
- Users can click "Install App" in Google Chrome or Microsoft Edge to install it as a desktop or mobile application.

### 2. Free Cloud Hosting Options
To publish your project online with a live public link for your resume or portfolio:

| Host Provider | Setup Steps | Live URL Format |
| :--- | :--- | :--- |
| **GitHub Pages** | Push code to GitHub repository &rarr; Go to Settings &rarr; Pages &rarr; Select `main` branch &rarr; Save. | `https://<username>.github.io/<repo>/` |
| **Vercel** | Import GitHub repo at [vercel.com](https://vercel.com) &rarr; Click Deploy (auto-detects static HTML/CSS/JS). | `https://<project-name>.vercel.app` |
| **Netlify** | Drag and drop the project folder into [Netlify Drop](https://app.netlify.com/drop). | `https://<random-name>.netlify.app` |

---

## 🧪 Automated Unit Testing

A comprehensive test suite is included in `tests/test_portfolio.py`, testing:
- Stock dataclass validation and initialization invariants.
- Automatic Investment formula ($P \times Q$).
- Unrealized Profit/Loss and percentage return formulas.
- Passive dividend income and portfolio yield calculations.
- Portfolio accumulation and weighted average cost calculations.
- Search and filtering algorithms.
- Custom exception handling (`ValidationError`, `StockNotFoundError`).
- JSON serialization, deserialization, and `.txt`/`.csv` exports.

### Run Tests via Python:
```bash
python portfolio_tracker.py --test
```
*Or via unittest module directly:*
```bash
python -m unittest tests/test_portfolio.py
```

**Result:**
```text
Ran 19 tests in 0.08s
OK
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :---: | :--- |
| <kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> | Focus Search Filter |
| <kbd>Alt</kbd>+<kbd>N</kbd> | Focus Add Stock Form |
| <kbd>Esc</kbd> | Close Modals / Cancel Edit / Reset Form |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Print Executive PDF Summary |
| <kbd>?</kbd> | Toggle Keyboard Shortcuts Guide |

---

## 📌 Project Information

| Field | Detail |
| :--- | :--- |
| **Project** | **Stock Portfolio Tracker (Professional Edition)** |
| **Internship** | **CodeAlpha Python Programming** |
| **Task** | **Task 2** |
| **Status** | **Completed, Tested & Production-Ready** |
| **Technologies** | HTML5, CSS3, JavaScript ES6+, Python 3.10+, REST API, Canvas, LocalStorage |

---

*Developed for the CodeAlpha Python Programming Internship.*
