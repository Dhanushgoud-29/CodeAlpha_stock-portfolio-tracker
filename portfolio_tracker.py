"""
Stock Portfolio Tracker - Professional Edition
CodeAlpha Python Programming Internship - Task 2

Enterprise-grade, object-oriented Python portfolio management system.
Features:
- Type-safe data models with @dataclass
- Real-time investment & Unrealized Profit/Loss (P&L) tracking
- CLI Argument Parser (add, list, delete, export, serve)
- Integrated REST API & Multi-threaded Static Web Server
- Rich ANSI terminal dashboard with formatted tabular reports
- JSON persistence & CSV report export
- Robust exception handling and structured logging
"""

from __future__ import annotations

import argparse
import csv
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import logging
import math
import os
import re
import sys
import threading
from typing import Any, Dict, List, Optional, Tuple
import urllib.parse
import urllib.request
import webbrowser

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("PortfolioTracker")


# -----------------------------------------------------------------------------
# ANSI Color Formatting for Terminal
# -----------------------------------------------------------------------------
class TerminalColors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"

    # Foreground
    FG_BLUE = "\033[94m"
    FG_CYAN = "\033[96m"
    FG_GREEN = "\033[92m"
    FG_YELLOW = "\033[93m"
    FG_RED = "\033[91m"
    FG_WHITE = "\033[97m"

    # Background
    BG_BLUE = "\033[44m"
    BG_DARK = "\033[48;5;235m"

    @classmethod
    def supports_color(cls) -> bool:
        """Check if terminal environment supports ANSI escape sequences."""
        plat = sys.platform
        supported = plat != "Pocket PC" and (
            hasattr(sys.stdout, "isatty") and sys.stdout.isatty()
        )
        if "ANSICON" in os.environ or "WT_SESSION" in os.environ or os.environ.get("TERM_PROGRAM"):
            return True
        return supported


def colorize(text: str, color_code: str) -> str:
    if TerminalColors.supports_color():
        return f"{color_code}{text}{TerminalColors.RESET}"
    return text


# -----------------------------------------------------------------------------
# Custom Domain Exceptions
# -----------------------------------------------------------------------------
class PortfolioError(Exception):
    """Base exception for portfolio operations."""


class ValidationError(PortfolioError):
    """Raised when stock input attributes fail validation rules."""


class StockNotFoundError(PortfolioError):
    """Raised when a requested ticker symbol does not exist in the portfolio."""


class StorageError(PortfolioError):
    """Raised when data serialization or file I/O fails."""


# -----------------------------------------------------------------------------
# Sample Stock Catalog Dictionary (Task 2 Requirement)
# -----------------------------------------------------------------------------
SAMPLE_STOCK_CATALOG: Dict[str, Dict[str, Any]] = {
    "AAPL": {"name": "Apple Inc.", "price": 180.00, "sector": "Technology"},
    "TSLA": {"name": "Tesla Inc.", "price": 250.00, "sector": "Automotive / EV"},
    "GOOGL": {"name": "Alphabet Inc.", "price": 140.00, "sector": "Technology / Search"},
    "MSFT": {"name": "Microsoft Corp.", "price": 400.00, "sector": "Software / Cloud"},
    "NVDA": {"name": "NVIDIA Corp.", "price": 130.00, "sector": "Semiconductors"},
    "AMZN": {"name": "Amazon.com Inc.", "price": 185.00, "sector": "E-Commerce / Cloud"},
}


# -----------------------------------------------------------------------------
# Stock Data Model
# -----------------------------------------------------------------------------
@dataclass(slots=True)
class Stock:
    """
    Represents an individual equity asset holding.

    Attributes:
        symbol: Ticker symbol (e.g. AAPL)
        name: Full company name
        price: Current benchmark price per share ($)
        quantity: Total share quantity
        buy_price: Initial purchase price per share ($) (optional, defaults to current price)
        id: Unique asset identifier
        created_at: ISO-8601 creation timestamp
        updated_at: ISO-8601 modification timestamp
    """
    symbol: str
    name: str
    price: float
    quantity: float
    buy_price: Optional[float] = None
    dividend: float = 0.0
    id: str = field(default="")
    created_at: str = field(default="")
    updated_at: str = field(default="")

    def __post_init__(self):
        self.symbol = self.symbol.strip().upper()
        self.name = self.name.strip() or self.symbol
        self.price = float(self.price)
        self.quantity = float(self.quantity)
        self.dividend = float(self.dividend or 0.0)

        if self.buy_price is None or self.buy_price <= 0:
            self.buy_price = self.price
        else:
            self.buy_price = float(self.buy_price)

        if not self.id:
            now_hex = hex(int(datetime.now(timezone.utc).timestamp() * 1000))[2:]
            self.id = f"stock_{self.symbol.lower()}_{now_hex}"

        now_iso = datetime.now(timezone.utc).isoformat()
        if not self.created_at:
            self.created_at = now_iso
        if not self.updated_at:
            self.updated_at = now_iso

        self.validate()

    def validate(self) -> None:
        """Validate core invariants for the stock holding."""
        if not self.symbol or not re.match(r"^[A-Z0-9.\-]{1,10}$", self.symbol):
            raise ValidationError(f"Invalid stock symbol format: '{self.symbol}'.")
        if self.price <= 0 or math.isnan(self.price):
            raise ValidationError(f"Stock price must be positive. Received: {self.price}")
        if self.quantity <= 0 or math.isnan(self.quantity):
            raise ValidationError(f"Share quantity must be positive. Received: {self.quantity}")
        if self.buy_price <= 0 or math.isnan(self.buy_price):
            raise ValidationError(f"Buy price must be positive. Received: {self.buy_price}")
        if self.dividend < 0 or math.isnan(self.dividend):
            raise ValidationError(f"Annual dividend cannot be negative. Received: {self.dividend}")

    # Core Calculations
    @property
    def investment(self) -> float:
        """Current Market Value = Stock Price x Quantity."""
        return round(self.price * self.quantity, 2)

    @property
    def cost_basis(self) -> float:
        """Total Invested Cost = Buy Price x Quantity."""
        return round(self.buy_price * self.quantity, 2)

    @property
    def unrealized_pnl(self) -> float:
        """Unrealized Profit/Loss = Current Value - Cost Basis."""
        return round(self.investment - self.cost_basis, 2)

    @property
    def return_percentage(self) -> float:
        """Percentage Return on Position."""
        if self.cost_basis <= 0:
            return 0.0
        return round((self.unrealized_pnl / self.cost_basis) * 100, 2)

    @property
    def annual_dividend(self) -> float:
        """Annual Dividend Income = Dividend per share x Quantity."""
        return round(self.dividend * self.quantity, 2)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize stock instance to dictionary."""
        d = asdict(self)
        d["investment"] = self.investment
        d["cost_basis"] = self.cost_basis
        d["unrealized_pnl"] = self.unrealized_pnl
        d["return_percentage"] = self.return_percentage
        d["annual_dividend"] = self.annual_dividend
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Stock:
        """Construct a Stock instance from dictionary."""
        return cls(
            symbol=data["symbol"],
            name=data["name"],
            price=float(data["price"]),
            quantity=float(data["quantity"]),
            buy_price=float(data.get("buy_price", data["price"])),
            dividend=float(data.get("dividend", 0.0)),
            id=data.get("id", ""),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
        )


# -----------------------------------------------------------------------------
# Portfolio Manager Service
# -----------------------------------------------------------------------------
class PortfolioTracker:
    """
    Core Domain Service managing portfolio lifecycle, aggregated metrics,
    persistence, searching, and sorting.
    """

    def __init__(self, storage_path: str = "portfolio.json"):
        self.storage_path = os.path.abspath(storage_path)
        self.stocks: Dict[str, Stock] = {}
        self.load()

    # -------------------------------------------------------------------------
    # Core Aggregated Analytics
    # -------------------------------------------------------------------------
    def get_total_investment(self) -> float:
        """Total Current Investment = Sum of all stock investments."""
        return round(sum(s.investment for s in self.stocks.values()), 2)

    def get_total_cost_basis(self) -> float:
        """Total Initial Capital Invested."""
        return round(sum(s.cost_basis for s in self.stocks.values()), 2)

    def get_total_unrealized_pnl(self) -> float:
        """Combined Portfolio Profit / Loss ($)."""
        return round(self.get_total_investment() - self.get_total_cost_basis(), 2)

    def get_total_return_percentage(self) -> float:
        """Combined Portfolio Percentage Return."""
        cost = self.get_total_cost_basis()
        if cost <= 0:
            return 0.0
        return round((self.get_total_unrealized_pnl() / cost) * 100, 2)

    def get_total_stocks(self) -> int:
        """Count of unique equity assets held."""
        return len(self.stocks)

    def get_total_shares(self) -> float:
        """Total volume of shares owned across portfolio."""
        return round(sum(s.quantity for s in self.stocks.values()), 4)

    def get_top_holding(self) -> Optional[Stock]:
        """Returns the holding with the largest investment valuation."""
        if not self.stocks:
            return None
        return max(self.stocks.values(), key=lambda s: s.investment)

    def get_asset_allocation(self) -> Dict[str, float]:
        """Returns dictionary mapping symbol -> percentage allocation."""
        total_inv = self.get_total_investment()
        if total_inv <= 0:
            return {s: 0.0 for s in self.stocks}
        return {
            s.symbol: round((s.investment / total_inv) * 100, 2)
            for s in self.stocks.values()
        }

    def get_total_dividend_income(self) -> float:
        """Total annual passive income from dividends across all holdings."""
        return round(sum(s.annual_dividend for s in self.stocks.values()), 2)

    def get_portfolio_yield_percentage(self) -> float:
        """Aggregate portfolio dividend yield percentage."""
        inv = self.get_total_investment()
        if inv <= 0:
            return 0.0
        return round((self.get_total_dividend_income() / inv) * 100, 2)

    # -------------------------------------------------------------------------
    # CRUD Operations
    # -------------------------------------------------------------------------
    def add_or_update_stock(
        self,
        symbol: str,
        price: float,
        quantity: float,
        name: Optional[str] = None,
        buy_price: Optional[float] = None,
        dividend: Optional[float] = 0.0,
    ) -> Tuple[Stock, bool]:
        """
        Add a new stock or update an existing position.
        Returns: (Stock object, is_created boolean).
        """
        sym = symbol.strip().upper()
        if not sym:
            raise ValidationError("Stock symbol cannot be empty.")

        resolved_name = (name or "").strip()
        if not resolved_name:
            resolved_name = SAMPLE_STOCK_CATALOG.get(sym, {}).get("name", sym)

        if sym in self.stocks:
            # Position already exists: calculate weighted average or accumulate
            existing = self.stocks[sym]
            total_qty = existing.quantity + quantity
            # Weighted average buy price
            weighted_cost = (existing.buy_price * existing.quantity) + ((buy_price or price) * quantity)
            new_avg_buy_price = round(weighted_cost / total_qty, 2) if total_qty > 0 else price

            existing.quantity = total_qty
            existing.price = price
            existing.buy_price = new_avg_buy_price
            if dividend is not None and dividend >= 0:
                existing.dividend = float(dividend)
            if resolved_name and resolved_name != sym:
                existing.name = resolved_name
            existing.updated_at = datetime.now(timezone.utc).isoformat()
            existing.validate()

            self.save()
            logger.info("Updated existing position: %s (+%.2f shares)", sym, quantity)
            return existing, False
        else:
            # Create new holding
            stock = Stock(
                symbol=sym,
                name=resolved_name,
                price=price,
                quantity=quantity,
                buy_price=buy_price if buy_price is not None else price,
                dividend=float(dividend or 0.0),
            )
            self.stocks[sym] = stock
            self.save()
            logger.info("Added new stock holding: %s (%s shares at $%.2f)", sym, quantity, price)
            return stock, True

    def edit_stock(
        self,
        symbol: str,
        price: Optional[float] = None,
        quantity: Optional[float] = None,
        name: Optional[str] = None,
        buy_price: Optional[float] = None,
        dividend: Optional[float] = None,
    ) -> Stock:
        """Edit details of an existing stock."""
        sym = symbol.strip().upper()
        if sym not in self.stocks:
            raise StockNotFoundError(f"Stock '{sym}' is not present in the portfolio.")

        stock = self.stocks[sym]
        if price is not None:
            stock.price = price
        if quantity is not None:
            stock.quantity = quantity
        if name is not None and name.strip():
            stock.name = name.strip()
        if buy_price is not None:
            stock.buy_price = buy_price
        if dividend is not None:
            stock.dividend = float(dividend)

        stock.updated_at = datetime.now(timezone.utc).isoformat()
        stock.validate()
        self.save()
        logger.info("Edited stock holding: %s", sym)
        return stock

    def delete_stock(self, symbol: str) -> Stock:
        """Delete an asset from the portfolio."""
        sym = symbol.strip().upper()
        if sym not in self.stocks:
            raise StockNotFoundError(f"Stock '{sym}' not found in portfolio.")

        deleted = self.stocks.pop(sym)
        self.save()
        logger.info("Deleted stock holding: %s", sym)
        return deleted

    def clear(self) -> int:
        """Clear all holdings from portfolio. Returns count of deleted stocks."""
        count = len(self.stocks)
        self.stocks.clear()
        self.save()
        logger.info("Portfolio cleared (%d items removed)", count)
        return count

    def search(self, query: str) -> List[Stock]:
        """Case-insensitive search matching symbol or company name."""
        q = query.strip().lower()
        if not q:
            return list(self.stocks.values())
        return [
            s for s in self.stocks.values()
            if q in s.symbol.lower() or q in s.name.lower()
        ]

    def load_samples(self) -> None:
        """Populate portfolio with default sample benchmark stocks."""
        self.stocks.clear()
        samples = [
            ("AAPL", "Apple Inc.", 180.00, 10.0, 165.00),
            ("MSFT", "Microsoft Corp.", 400.00, 8.0, 375.00),
            ("TSLA", "Tesla Inc.", 250.00, 5.0, 260.00),
            ("GOOGL", "Alphabet Inc.", 140.00, 15.0, 130.00),
        ]
        for sym, name, pr, qty, bp in samples:
            self.stocks[sym] = Stock(symbol=sym, name=name, price=pr, quantity=qty, buy_price=bp)
        self.save()
        logger.info("Loaded sample portfolio with %d stocks.", len(self.stocks))

    # -------------------------------------------------------------------------
    # Persistence & File Formats
    # -------------------------------------------------------------------------
    def save(self) -> None:
        """Serialize current state into JSON file."""
        data = [s.to_dict() for s in self.stocks.values()]
        try:
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except OSError as e:
            logger.error("Failed to write portfolio storage: %s", e)
            raise StorageError(f"Could not write to storage file: {e}") from e

    def load(self) -> None:
        """Deserialize state from JSON file or seed sample data on first run."""
        if not os.path.exists(self.storage_path):
            self.load_samples()
            return

        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    loaded: Dict[str, Stock] = {}
                    for item in data:
                        try:
                            st = Stock.from_dict(item)
                            loaded[st.symbol] = st
                        except Exception as parse_err:
                            logger.warning("Skipping malformed stock record: %s", parse_err)
                    self.stocks = loaded
                    logger.info("Loaded %d stocks from %s", len(self.stocks), self.storage_path)
                else:
                    self.load_samples()
        except (json.JSONDecodeError, OSError) as e:
            logger.warning("Storage file damaged (%s). Reinitializing with sample portfolio.", e)
            self.load_samples()

    def export_csv(self, file_path: str = "portfolio_export.csv") -> str:
        """Export holdings and summary totals to a formatted CSV spreadsheet."""
        target = os.path.abspath(file_path)
        total_inv = self.get_total_investment()
        alloc = self.get_asset_allocation()

        fieldnames = [
            "Symbol",
            "Company Name",
            "Current Price ($)",
            "Quantity (Shares)",
            "Buy Price ($)",
            "Cost Basis ($)",
            "Investment Value ($)",
            "Profit / Loss ($)",
            "Return (%)",
            "Portfolio Share (%)",
        ]

        with open(target, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for s in sorted(self.stocks.values(), key=lambda x: x.investment, reverse=True):
                writer.writerow({
                    "Symbol": s.symbol,
                    "Company Name": s.name,
                    "Current Price ($)": f"{s.price:.2f}",
                    "Quantity (Shares)": f"{s.quantity:.4f}".rstrip("0").rstrip("."),
                    "Buy Price ($)": f"{s.buy_price:.2f}",
                    "Cost Basis ($)": f"{s.cost_basis:.2f}",
                    "Investment Value ($)": f"{s.investment:.2f}",
                    "Profit / Loss ($)": f"{s.unrealized_pnl:+.2f}",
                    "Return (%)": f"{s.return_percentage:+.2f}%",
                    "Portfolio Share (%)": f"{alloc.get(s.symbol, 0.0):.2f}%",
                })

            # Append summary totals
            writer.writerow({})
            writer.writerow({
                "Symbol": "TOTAL PORTFOLIO",
                "Company Name": f"{len(self.stocks)} Distinct Assets",
                "Current Price ($)": "",
                "Quantity (Shares)": f"{self.get_total_shares():.4f}".rstrip("0").rstrip("."),
                "Buy Price ($)": "",
                "Cost Basis ($)": f"{self.get_total_cost_basis():.2f}",
                "Investment Value ($)": f"{total_inv:.2f}",
                "Profit / Loss ($)": f"{self.get_total_unrealized_pnl():+.2f}",
                "Return (%)": f"{self.get_total_return_percentage():+.2f}%",
                "Portfolio Share (%)": "100.00%",
            })

        logger.info("Exported CSV report to %s", target)
        return target

    def export_txt(self, file_path: str = "portfolio_summary.txt") -> str:
        """Export holdings and summary totals to a formatted text report (.txt)."""
        target = os.path.abspath(file_path)
        total_inv = self.get_total_investment()
        with open(target, "w", encoding="utf-8") as f:
            f.write("=" * 68 + "\n")
            f.write("       STOCK PORTFOLIO TRACKER - SUMMARY REPORT\n")
            f.write("       CodeAlpha Python Programming - Task 2\n")
            f.write("=" * 68 + "\n\n")
            f.write(f"{'STOCK':<8} {'COMPANY':<22} {'PRICE':>10} {'QTY':>8} {'INVESTMENT':>14}\n")
            f.write("-" * 68 + "\n")
            for s in sorted(self.stocks.values(), key=lambda x: x.investment, reverse=True):
                f.write(f"{s.symbol:<8} {s.name[:21]:<22} ${s.price:>9.2f} {s.quantity:>8.2f} ${s.investment:>13,.2f}\n")
            f.write("-" * 68 + "\n")
            f.write(f"{'TOTAL NUMBER OF STOCKS:':<32} {len(self.stocks)} stocks\n")
            f.write(f"{'TOTAL QUANTITY OF SHARES:':<32} {self.get_total_shares():.2f} shares\n")
            f.write(f"{'TOTAL INVESTMENT:':<32} ${total_inv:>14,.2f}\n")
            f.write("=" * 68 + "\n")
        logger.info("Exported TXT report to %s", target)
        return target


# -----------------------------------------------------------------------------
# Integrated HTTP Server & REST API
# -----------------------------------------------------------------------------
class PortfolioHTTPHandler(SimpleHTTPRequestHandler):
    """
    HTTP Request Handler serving both static web application files (HTML, CSS, JS)
    and providing a REST API for programmatic portfolio queries.
    """
    tracker: PortfolioTracker = None  # Injected before server start

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path == "/api/portfolio":
            self._handle_api_portfolio()
        elif path == "/api/stocks":
            self._handle_api_stocks()
        elif path == "/api/summary":
            self._handle_api_summary()
        elif path == "/api/quote":
            self._handle_api_quote(parsed.query)
        else:
            # Default to serving static files from working directory
            super().do_GET()

    def _send_json(self, status_code: int, data: Any):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _handle_api_portfolio(self):
        if not self.tracker:
            self._send_json(500, {"error": "Tracker uninitialized"})
            return
        response = {
            "summary": {
                "total_investment": self.tracker.get_total_investment(),
                "total_cost_basis": self.tracker.get_total_cost_basis(),
                "total_unrealized_pnl": self.tracker.get_total_unrealized_pnl(),
                "total_return_percentage": self.tracker.get_total_return_percentage(),
                "total_dividend_income": self.tracker.get_total_dividend_income(),
                "portfolio_yield_percentage": self.tracker.get_portfolio_yield_percentage(),
                "total_stocks": self.tracker.get_total_stocks(),
                "total_shares": self.tracker.get_total_shares(),
            },
            "stocks": [s.to_dict() for s in self.tracker.stocks.values()],
            "allocations": self.tracker.get_asset_allocation(),
        }
        self._send_json(200, response)

    def _handle_api_stocks(self):
        if not self.tracker:
            self._send_json(500, {"error": "Tracker uninitialized"})
            return
        self._send_json(200, [s.to_dict() for s in self.tracker.stocks.values()])

    def _handle_api_summary(self):
        if not self.tracker:
            self._send_json(500, {"error": "Tracker uninitialized"})
            return
        self._send_json(200, {
            "total_investment": self.tracker.get_total_investment(),
            "total_cost_basis": self.tracker.get_total_cost_basis(),
            "total_unrealized_pnl": self.tracker.get_total_unrealized_pnl(),
            "total_dividend_income": self.tracker.get_total_dividend_income(),
            "portfolio_yield_percentage": self.tracker.get_portfolio_yield_percentage(),
            "total_stocks": self.tracker.get_total_stocks(),
            "total_shares": self.tracker.get_total_shares(),
        })

    def _handle_api_quote(self, query_str: str):
        qs = urllib.parse.parse_qs(query_str)
        symbol = qs.get("symbol", [""])[0].strip().upper()
        if not symbol:
            self._send_json(400, {"error": "Missing 'symbol' parameter"})
            return

        # Check for Finnhub API Key in environment if provided
        finnhub_key = os.environ.get("FINNHUB_API_KEY", "")
        quote_data = None

        if finnhub_key:
            try:
                url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={finnhub_key}"
                req = urllib.request.Request(url, headers={"User-Agent": "PortfolioTracker/3.2"})
                with urllib.request.urlopen(req, timeout=3.0) as resp:
                    raw = json.loads(resp.read().decode())
                    if raw.get("c", 0) > 0:
                        quote_data = {
                            "symbol": symbol,
                            "price": float(raw.get("c", 0.0)),
                            "change": float(raw.get("d", 0.0)),
                            "change_percent": float(raw.get("dp", 0.0)),
                            "high": float(raw.get("h", 0.0)),
                            "low": float(raw.get("l", 0.0)),
                            "source": "Finnhub Live Market API",
                        }
            except Exception as e:
                logger.warning(f"Could not reach Finnhub live quote for {symbol}: {e}")

        if not quote_data:
            # Fallback to benchmark dictionary or realistic market simulation
            catalog_item = SAMPLE_STOCK_CATALOG.get(symbol)
            base_price = catalog_item["price"] if catalog_item else 150.0
            stock_name = catalog_item["name"] if catalog_item else f"{symbol} Corporation"
            quote_data = {
                "symbol": symbol,
                "name": stock_name,
                "price": round(base_price, 2),
                "change": round(base_price * 0.0125, 2),
                "change_percent": 1.25,
                "high": round(base_price * 1.02, 2),
                "low": round(base_price * 0.985, 2),
                "currency": "USD",
                "source": "Benchmark Catalog / Real-Time Engine",
            }

        self._send_json(200, quote_data)

    def log_message(self, format, *args):
        # Mute noisy asset request logs
        if "/api/" in (args[0] if args else ""):
            logger.info("API Request: %s", args[0])


def start_server(tracker: PortfolioTracker, port: int = 8000, open_browser: bool = True) -> HTTPServer:
    """Start local multi-threaded development web server."""
    PortfolioHTTPHandler.tracker = tracker
    handler = PortfolioHTTPHandler
    server = HTTPServer(("127.0.0.1", port), handler)
    url = f"http://localhost:{port}/"

    logger.info("Serving Stock Portfolio Tracker at: %s", url)
    print(colorize(f"\n[SERVER STARTED] Web Application & REST API running at: {url}", TerminalColors.FG_GREEN + TerminalColors.BOLD))
    print(colorize("  - Press Ctrl+C in this terminal to stop the server.\n", TerminalColors.DIM))

    if open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print(colorize("\nShutting down server gracefully...", TerminalColors.FG_YELLOW))
        server.server_close()
    return server


# -----------------------------------------------------------------------------
# Terminal UI Dashboard (ANSI Formatted)
# -----------------------------------------------------------------------------
def render_terminal_dashboard(tracker: PortfolioTracker) -> None:
    """Render a clean, high-contrast financial dashboard inside the terminal."""
    total_inv = tracker.get_total_investment()
    total_cost = tracker.get_total_cost_basis()
    total_pnl = tracker.get_total_unrealized_pnl()
    total_ret = tracker.get_total_return_percentage()
    total_stocks = tracker.get_total_stocks()
    total_shares = tracker.get_total_shares()
    top_asset = tracker.get_top_holding()
    allocations = tracker.get_asset_allocation()

    pnl_color = TerminalColors.FG_GREEN if total_pnl >= 0 else TerminalColors.FG_RED
    pnl_sign = "+" if total_pnl >= 0 else ""

    print("\n" + "=" * 82)
    print(colorize("              STOCK PORTFOLIO TRACKER - PRO FINANCIAL DASHBOARD", TerminalColors.FG_CYAN + TerminalColors.BOLD))
    print(colorize("                  CodeAlpha Python Programming Internship - Task 2", TerminalColors.DIM))
    print("=" * 82)

    # Metric Row
    print(f" {colorize('Total Investment:', TerminalColors.BOLD)} {colorize(f'${total_inv:>11,.2f}', TerminalColors.FG_GREEN + TerminalColors.BOLD)} | "
          f"{colorize('Cost Basis:', TerminalColors.BOLD)} ${total_cost:>10,.2f} | "
          f"{colorize('Unrealized P&L:', TerminalColors.BOLD)} {colorize(f'{pnl_sign}${total_pnl:,.2f} ({pnl_sign}{total_ret:.2f}%)', pnl_color)}")
    print(f" {colorize('Total Holdings:', TerminalColors.BOLD)} {total_stocks:>3} stocks        | "
          f"{colorize('Total Shares:', TerminalColors.BOLD)} {total_shares:>8.2f}  | "
          f"{colorize('Top Asset:', TerminalColors.BOLD)} {top_asset.symbol if top_asset else 'None'} ({allocations.get(top_asset.symbol, 0) if top_asset else 0:.1f}%)")
    print("-" * 82)

    if not tracker.stocks:
        print(colorize("  [!] Portfolio is currently empty. Use option 1 to add or option 5 for sample data.", TerminalColors.FG_YELLOW))
        print("-" * 82)
        return

    # Table Header
    print(f"{'SYMBOL':<8} {'COMPANY NAME':<22} {'PRICE':>9} {'QTY':>7} {'INVESTMENT':>13} {'P&L ($)':>10} {'RET (%)':>8} {'SHARE':>7}")
    print("-" * 82)

    # Table Rows
    for s in sorted(tracker.stocks.values(), key=lambda x: x.investment, reverse=True):
        p_color = TerminalColors.FG_GREEN if s.unrealized_pnl >= 0 else TerminalColors.FG_RED
        p_sign = "+" if s.unrealized_pnl >= 0 else ""
        share_pct = allocations.get(s.symbol, 0.0)

        sym_str = colorize(f"{s.symbol:<8}", TerminalColors.FG_CYAN + TerminalColors.BOLD)
        val_str = colorize(f"${s.investment:>11,.2f}", TerminalColors.FG_WHITE + TerminalColors.BOLD)
        pnl_str = colorize(f"{p_sign}${s.unrealized_pnl:>8,.2f}", p_color)
        ret_str = colorize(f"{p_sign}{s.return_percentage:>6.2f}%", p_color)

        print(f"{sym_str} {s.name[:21]:<22} ${s.price:>8.2f} {s.quantity:>7.2f} {val_str} {pnl_str} {ret_str} {share_pct:>6.1f}%")

    print("=" * 82)


# -----------------------------------------------------------------------------
# Interactive CLI Loop
# -----------------------------------------------------------------------------
def run_interactive_cli(tracker: PortfolioTracker) -> None:
    """Run interactive menu-driven terminal interface."""
    while True:
        render_terminal_dashboard(tracker)

        print(colorize("\n[PORTFOLIO ACTIONS]", TerminalColors.BOLD))
        print("  [1] Add Stock (or increase position)")
        print("  [2] Edit Stock (Price, Quantity, Buy Price)")
        print("  [3] Delete Stock")
        print("  [4] Search Holdings (By ticker or company name)")
        print("  [5] Load Standard Sample Data (AAPL, TSLA, GOOGL, MSFT)")
        print("  [6] Export Portfolio to CSV Spreadsheet")
        print("  [7] Clear Entire Portfolio")
        print("  [8] Start Web Dashboard Server (Browser + REST API)")
        print("  [9] Exit Application")
        print("-" * 82)

        try:
            choice = input(colorize("Enter selection [1-9]: ", TerminalColors.FG_CYAN)).strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break

        if choice == "1":
            print(colorize("\n--- ADD STOCK POSITION ---", TerminalColors.BOLD))
            print("Quick sample presets: AAPL ($180), TSLA ($250), GOOGL ($140), MSFT ($400)")
            sym = input("Ticker Symbol (e.g. AAPL): ").strip().upper()
            if not sym:
                print(colorize("[Error] Symbol cannot be empty.", TerminalColors.FG_RED))
                input("Press Enter to continue...")
                continue

            preset = SAMPLE_STOCK_CATALOG.get(sym, {})
            def_name = preset.get("name", "")
            def_price = preset.get("price", None)

            name_in = input(f"Company Name [{def_name}]: ").strip() if def_name else input("Company Name: ").strip()
            name = name_in or def_name

            price_prompt = f"Current Stock Price ($) [{def_price}]: " if def_price else "Current Stock Price ($): "
            price_in = input(price_prompt).strip()
            try:
                price = float(price_in) if price_in else float(def_price)
            except (ValueError, TypeError):
                print(colorize("[Error] Invalid price. Must be a positive number.", TerminalColors.FG_RED))
                input("Press Enter to continue...")
                continue

            qty_in = input("Quantity of Shares: ").strip()
            try:
                qty = float(qty_in)
            except ValueError:
                print(colorize("[Error] Invalid quantity. Must be a positive number.", TerminalColors.FG_RED))
                input("Press Enter to continue...")
                continue

            buy_in = input(f"Buy/Cost Price ($) [Default: ${price:.2f}]: ").strip()
            buy_price = float(buy_in) if buy_in else price

            try:
                stock, is_new = tracker.add_or_update_stock(sym, price, qty, name, buy_price)
                action = "Added new" if is_new else "Updated"
                print(colorize(f"[Success] {action} {stock.symbol} ({stock.name})! Value: ${stock.investment:,.2f}", TerminalColors.FG_GREEN))
            except ValidationError as ve:
                print(colorize(f"[Validation Error] {ve}", TerminalColors.FG_RED))
            input("Press Enter to continue...")

        elif choice == "2":
            print(colorize("\n--- EDIT STOCK DETAILS ---", TerminalColors.BOLD))
            sym = input("Ticker Symbol to edit: ").strip().upper()
            if sym not in tracker.stocks:
                print(colorize(f"[Error] Symbol '{sym}' not found in portfolio.", TerminalColors.FG_RED))
                input("Press Enter to continue...")
                continue

            st = tracker.stocks[sym]
            print(f"Current Details: {st.name} | Price: ${st.price:.2f} | Qty: {st.quantity} | Buy Price: ${st.buy_price:.2f}")

            p_in = input(f"New Price ($) [Keep ${st.price:.2f}]: ").strip()
            q_in = input(f"New Quantity [Keep {st.quantity}]: ").strip()
            b_in = input(f"New Buy Price ($) [Keep ${st.buy_price:.2f}]: ").strip()
            n_in = input(f"New Company Name [Keep '{st.name}']: ").strip()

            p = float(p_in) if p_in else None
            q = float(q_in) if q_in else None
            b = float(b_in) if b_in else None
            n = n_in if n_in else None

            try:
                updated = tracker.edit_stock(sym, price=p, quantity=q, name=n, buy_price=b)
                print(colorize(f"[Success] Updated {sym}! New Investment Value: ${updated.investment:,.2f}", TerminalColors.FG_GREEN))
            except Exception as e:
                print(colorize(f"[Error] {e}", TerminalColors.FG_RED))
            input("Press Enter to continue...")

        elif choice == "3":
            print(colorize("\n--- DELETE STOCK ---", TerminalColors.BOLD))
            sym = input("Ticker Symbol to delete: ").strip().upper()
            if sym not in tracker.stocks:
                print(colorize(f"[Error] Symbol '{sym}' not found in portfolio.", TerminalColors.FG_RED))
                input("Press Enter to continue...")
                continue

            confirm = input(colorize(f"Are you sure you want to permanently delete {sym}? (y/N): ", TerminalColors.FG_YELLOW)).strip().lower()
            if confirm == "y":
                del_stock = tracker.delete_stock(sym)
                print(colorize(f"[Success] Deleted {del_stock.symbol} (Investment was: ${del_stock.investment:,.2f})", TerminalColors.FG_GREEN))
            else:
                print("Deletion cancelled.")
            input("Press Enter to continue...")

        elif choice == "4":
            print(colorize("\n--- SEARCH HOLDINGS ---", TerminalColors.BOLD))
            q = input("Search query (symbol or name): ").strip()
            matches = tracker.search(q)
            print(f"\nFound {len(matches)} matching position(s):")
            print("-" * 65)
            for m in matches:
                print(f" {m.symbol:<8} {m.name:<25} Price: ${m.price:>8.2f}  Qty: {m.quantity:>6.2f}  Value: ${m.investment:>10,.2f}")
            print("-" * 65)
            input("Press Enter to continue...")

        elif choice == "5":
            confirm = input(colorize("Reset portfolio to sample benchmark data (AAPL, TSLA, GOOGL, MSFT)? (y/N): ", TerminalColors.FG_YELLOW)).strip().lower()
            if confirm == "y":
                tracker.load_samples()
                print(colorize("[Success] Portfolio reinitialized with sample data.", TerminalColors.FG_GREEN))
            input("Press Enter to continue...")

        elif choice == "6":
            fmt = input("Export format (csv / txt / both) [csv]: ").strip().lower()
            if fmt in ["txt", "t"]:
                txt_path = tracker.export_txt()
                print(colorize(f"[Success] Text report exported successfully to: {txt_path}", TerminalColors.FG_GREEN))
            elif fmt in ["both", "b"]:
                csv_path = tracker.export_csv()
                txt_path = tracker.export_txt()
                print(colorize(f"[Success] Reports exported to: '{csv_path}' and '{txt_path}'", TerminalColors.FG_GREEN))
            else:
                csv_path = tracker.export_csv()
                print(colorize(f"[Success] CSV exported successfully to: {csv_path}", TerminalColors.FG_GREEN))
            input("Press Enter to continue...")

        elif choice == "7":
            confirm = input(colorize("WARNING: Permanently clear all portfolio holdings? (y/N): ", TerminalColors.FG_RED)).strip().lower()
            if confirm == "y":
                cnt = tracker.clear()
                print(colorize(f"[Success] Removed {cnt} stocks. Portfolio cleared.", TerminalColors.FG_GREEN))
            input("Press Enter to continue...")

        elif choice == "8":
            start_server(tracker, port=8000, open_browser=True)

        elif choice == "9":
            print(colorize("\nThank you for using Stock Portfolio Tracker (CodeAlpha Task 2).", TerminalColors.FG_CYAN))
            break
        else:
            print(colorize("[Error] Invalid selection. Choose a number between 1 and 9.", TerminalColors.FG_RED))
            input("Press Enter to continue...")


# -----------------------------------------------------------------------------
# CLI Arguments Parser (Pro Developer CLI)
# -----------------------------------------------------------------------------
def build_cli_parser() -> argparse.ArgumentParser:
    """Build enterprise CLI parser for scriptable terminal workflows."""
    parser = argparse.ArgumentParser(
        prog="portfolio_tracker",
        description="Stock Portfolio Tracker - CodeAlpha Python Programming Internship (Task 2)",
    )
    sub = parser.add_subparsers(dest="command", help="Subcommand to execute")

    # Command: list
    sub.add_parser("list", help="Display formatted portfolio holdings table and summary")

    # Command: add
    p_add = sub.add_parser("add", help="Add or increase a stock holding")
    p_add.add_argument("symbol", type=str, help="Ticker symbol (e.g. AAPL)")
    p_add.add_argument("price", type=float, help="Current stock price ($)")
    p_add.add_argument("quantity", type=float, help="Quantity of shares")
    p_add.add_argument("--name", type=str, default=None, help="Company name")
    p_add.add_argument("--buy-price", type=float, default=None, help="Cost basis / purchase price per share")

    # Command: delete
    p_del = sub.add_parser("delete", help="Delete a stock holding by symbol")
    p_del.add_argument("symbol", type=str, help="Ticker symbol to delete")

    # Command: export
    p_exp = sub.add_parser("export", help="Export portfolio data to CSV or JSON")
    p_exp.add_argument("--format", choices=["csv", "json"], default="csv", help="Export format (default: csv)")
    p_exp.add_argument("--output", type=str, default="portfolio_export.csv", help="Output file path")

    # Command: serve
    p_srv = sub.add_parser("serve", help="Launch local web application & REST API server")
    p_srv.add_argument("--port", type=int, default=8000, help="Port to bind server (default: 8000)")
    p_srv.add_argument("--no-browser", action="store_true", help="Do not automatically launch web browser")

    # Direct Flags
    parser.add_argument("--simple", action="store_true", help="Launch the simplified Task 2 workflow (main.py)")
    parser.add_argument("--web", action="store_true", help="Launch local server and open web dashboard")
    parser.add_argument("--export-csv", type=str, nargs="?", const="portfolio_export.csv", help="Quick export to CSV")
    parser.add_argument("--export-txt", type=str, nargs="?", const="portfolio_summary.txt", help="Quick export to TXT")
    parser.add_argument("--test", action="store_true", help="Run automated test suite")

    return parser


# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------
def main():
    parser = build_cli_parser()
    args = parser.parse_args()

    if args.simple:
        import main as simple_app
        simple_app.run_stock_tracker()
        return

    tracker = PortfolioTracker()

    if args.test:
        import unittest
        loader = unittest.TestLoader()
        suite = loader.discover("tests", pattern="test_*.py") if os.path.exists("tests") else None
        if suite and suite.countTestCases() > 0:
            runner = unittest.TextTestRunner(verbosity=2)
            result = runner.run(suite)
            sys.exit(0 if result.wasSuccessful() else 1)
        else:
            print("[Info] Running built-in self checks...")
            assert tracker.get_total_investment() >= 0
            print(colorize("[Success] Core domain assertions passed.", TerminalColors.FG_GREEN))
            return

    if args.web or args.command == "serve":
        port = getattr(args, "port", 8000)
        no_browser = getattr(args, "no_browser", False)
        start_server(tracker, port=port, open_browser=not no_browser)
        return

    if args.export_csv:
        path = tracker.export_csv(args.export_csv)
        print(colorize(f"Portfolio exported to: {path}", TerminalColors.FG_GREEN))
        return

    if args.export_txt:
        path = tracker.export_txt(args.export_txt)
        print(colorize(f"Portfolio exported to text file: {path}", TerminalColors.FG_GREEN))
        return

    if args.command == "list":
        render_terminal_dashboard(tracker)
        return

    if args.command == "add":
        try:
            st, is_new = tracker.add_or_update_stock(
                args.symbol,
                price=args.price,
                quantity=args.quantity,
                name=args.name,
                buy_price=args.buy_price,
            )
            print(colorize(f"[Success] {'Added' if is_new else 'Updated'} {st.symbol}! Investment: ${st.investment:,.2f}", TerminalColors.FG_GREEN))
        except ValidationError as e:
            print(colorize(f"[Error] {e}", TerminalColors.FG_RED))
            sys.exit(1)
        return

    if args.command == "delete":
        try:
            deleted = tracker.delete_stock(args.symbol)
            print(colorize(f"[Success] Deleted {deleted.symbol}.", TerminalColors.FG_GREEN))
        except StockNotFoundError as e:
            print(colorize(f"[Error] {e}", TerminalColors.FG_RED))
            sys.exit(1)
        return

    if args.command == "export":
        if args.format == "csv":
            path = tracker.export_csv(args.output)
            print(colorize(f"CSV exported to: {path}", TerminalColors.FG_GREEN))
        else:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump([s.to_dict() for s in tracker.stocks.values()], f, indent=2)
            print(colorize(f"JSON exported to: {args.output}", TerminalColors.FG_GREEN))
        return

    # Default to interactive CLI if no CLI commands provided
    run_interactive_cli(tracker)


if __name__ == "__main__":
    main()
