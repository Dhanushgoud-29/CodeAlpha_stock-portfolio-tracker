"""
Unit Test Suite for Stock Portfolio Tracker
CodeAlpha Python Programming Internship - Task 2
"""

import os
import tempfile
import unittest

from portfolio_tracker import (
    PortfolioTracker,
    Stock,
    StockNotFoundError,
    ValidationError,
)


class TestStockModel(unittest.TestCase):
    """Test suite for individual Stock model invariants and formulas."""

    def test_stock_creation_and_investment_formula(self):
        # Investment = Price x Quantity
        stock = Stock(symbol="AAPL", name="Apple Inc.", price=180.0, quantity=10.0)
        self.assertEqual(stock.symbol, "AAPL")
        self.assertEqual(stock.name, "Apple Inc.")
        self.assertEqual(stock.investment, 1800.0)
        self.assertEqual(stock.cost_basis, 1800.0)
        self.assertEqual(stock.unrealized_pnl, 0.0)
        self.assertEqual(stock.return_percentage, 0.0)

    def test_profit_and_loss_calculation(self):
        # Bought at $150, now at $180, 10 shares
        stock = Stock(symbol="AAPL", name="Apple Inc.", price=180.0, quantity=10.0, buy_price=150.0)
        self.assertEqual(stock.cost_basis, 1500.0)
        self.assertEqual(stock.investment, 1800.0)
        self.assertEqual(stock.unrealized_pnl, 300.0)
        self.assertEqual(stock.return_percentage, 20.0)

    def test_negative_loss_calculation(self):
        # Bought at $250, now at $200, 5 shares
        stock = Stock(symbol="TSLA", name="Tesla Inc.", price=200.0, quantity=5.0, buy_price=250.0)
        self.assertEqual(stock.cost_basis, 1250.0)
        self.assertEqual(stock.investment, 1000.0)
        self.assertEqual(stock.unrealized_pnl, -250.0)
        self.assertEqual(stock.return_percentage, -20.0)

    def test_invalid_symbol_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            Stock(symbol="INVALID$$SYMBOL*", name="Bad Corp", price=100.0, quantity=1.0)

    def test_non_positive_price_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            Stock(symbol="MSFT", name="Microsoft", price=-10.0, quantity=5.0)

    def test_non_positive_quantity_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            Stock(symbol="MSFT", name="Microsoft", price=400.0, quantity=0.0)

    def test_serialization_roundtrip(self):
        stock = Stock(symbol="GOOGL", name="Alphabet Inc.", price=140.0, quantity=15.0, buy_price=130.0)
        data = stock.to_dict()
        reconstructed = Stock.from_dict(data)
        self.assertEqual(stock.symbol, reconstructed.symbol)
        self.assertEqual(stock.investment, reconstructed.investment)
        self.assertEqual(stock.unrealized_pnl, reconstructed.unrealized_pnl)


class TestPortfolioTrackerService(unittest.TestCase):
    """Test suite for PortfolioTracker CRUD, aggregations, and search."""

    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
        self.temp_file.close()
        # Initialize empty tracker
        self.tracker = PortfolioTracker(storage_path=self.temp_file.name)
        self.tracker.clear()

    def tearDown(self):
        if os.path.exists(self.temp_file.name):
            os.remove(self.temp_file.name)

    def test_add_stock_and_total_investment(self):
        self.tracker.add_or_update_stock("AAPL", price=180.0, quantity=10.0, name="Apple Inc.")
        self.tracker.add_or_update_stock("MSFT", price=400.0, quantity=5.0, name="Microsoft Corp.")

        # Total Investment = (180 * 10) + (400 * 5) = 1800 + 2000 = 3800
        self.assertEqual(self.tracker.get_total_investment(), 3800.0)
        self.assertEqual(self.tracker.get_total_stocks(), 2)
        self.assertEqual(self.tracker.get_total_shares(), 15.0)

    def test_add_existing_stock_accumulates_position(self):
        self.tracker.add_or_update_stock("AAPL", price=180.0, quantity=10.0)
        # Add 5 more shares at $190
        self.tracker.add_or_update_stock("AAPL", price=190.0, quantity=5.0)

        self.assertEqual(self.tracker.get_total_stocks(), 1)
        self.assertEqual(self.tracker.stocks["AAPL"].quantity, 15.0)
        self.assertEqual(self.tracker.stocks["AAPL"].price, 190.0)
        self.assertEqual(self.tracker.stocks["AAPL"].investment, 2850.0)

    def test_edit_stock(self):
        self.tracker.add_or_update_stock("TSLA", price=250.0, quantity=5.0)
        self.tracker.edit_stock("TSLA", price=300.0, quantity=10.0)

        self.assertEqual(self.tracker.stocks["TSLA"].price, 300.0)
        self.assertEqual(self.tracker.stocks["TSLA"].quantity, 10.0)
        self.assertEqual(self.tracker.stocks["TSLA"].investment, 3000.0)

    def test_delete_stock(self):
        self.tracker.add_or_update_stock("AAPL", price=180.0, quantity=10.0)
        self.assertEqual(self.tracker.get_total_stocks(), 1)

        self.tracker.delete_stock("AAPL")
        self.assertEqual(self.tracker.get_total_stocks(), 0)
        self.assertEqual(self.tracker.get_total_investment(), 0.0)

    def test_delete_nonexistent_stock_raises_error(self):
        with self.assertRaises(StockNotFoundError):
            self.tracker.delete_stock("NONEXISTENT")

    def test_search_by_symbol_and_name(self):
        self.tracker.add_or_update_stock("AAPL", price=180.0, quantity=10.0, name="Apple Inc.")
        self.tracker.add_or_update_stock("GOOGL", price=140.0, quantity=15.0, name="Alphabet Inc.")

        # Search ticker
        results = self.tracker.search("AAPL")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].symbol, "AAPL")

        # Search company name
        results2 = self.tracker.search("alpha")
        self.assertEqual(len(results2), 1)
        self.assertEqual(results2[0].symbol, "GOOGL")

    def test_asset_allocation_percentages(self):
        self.tracker.add_or_update_stock("AAPL", price=100.0, quantity=10.0)  # $1,000 (25%)
        self.tracker.add_or_update_stock("MSFT", price=300.0, quantity=10.0)  # $3,000 (75%)

        alloc = self.tracker.get_asset_allocation()
        self.assertEqual(alloc["AAPL"], 25.0)
        self.assertEqual(alloc["MSFT"], 75.0)

    def test_sample_stocks_loading(self):
        self.tracker.load_samples()
        self.assertEqual(self.tracker.get_total_stocks(), 4)
        symbols = set(self.tracker.stocks.keys())
        self.assertTrue({"AAPL", "MSFT", "TSLA", "GOOGL"}.issubset(symbols))

    def test_export_txt_file(self):
        self.tracker.add_or_update_stock("AAPL", price=180.0, quantity=10.0)
        txt_path = self.tracker.export_txt(self.temp_file.name + ".txt")
        self.assertTrue(os.path.exists(txt_path))
        with open(txt_path, "r", encoding="utf-8") as f:
            content = f.read()
            self.assertIn("AAPL", content)
            self.assertIn("TOTAL INVESTMENT", content)
        if os.path.exists(txt_path):
            os.remove(txt_path)

    def test_dividend_and_passive_income_calculation(self):
        stock = Stock(symbol="AAPL", name="Apple Inc.", price=180.0, quantity=10.0, dividend=3.0)
        self.assertEqual(stock.dividend, 3.0)
        self.assertEqual(stock.annual_dividend, 30.0)

        self.tracker.clear()
        self.tracker.add_or_update_stock("AAPL", 180.0, 10.0, dividend=3.0)
        self.tracker.add_or_update_stock("MSFT", 400.0, 5.0, dividend=4.0)

        # Total inv: (180*10) + (400*5) = 1800 + 2000 = 3800
        # Total div: (3*10) + (4*5) = 30 + 20 = 50
        # Yield: (50 / 3800) * 100 = 1.32%
        self.assertEqual(self.tracker.get_total_dividend_income(), 50.0)
        self.assertEqual(self.tracker.get_portfolio_yield_percentage(), 1.32)


class TestMainTask2Simplified(unittest.TestCase):
    """Test suite for the exact CodeAlpha Task 2 simplified module (main.py)."""

    def test_hardcoded_stock_prices_dictionary(self):
        import main
        self.assertIsInstance(main.STOCK_PRICES, dict)
        self.assertEqual(main.STOCK_PRICES["AAPL"], 180.0)
        self.assertEqual(main.STOCK_PRICES["TSLA"], 250.0)
        self.assertIn("GOOGL", main.STOCK_PRICES)
        self.assertIn("MSFT", main.STOCK_PRICES)

    def test_main_save_to_txt_and_csv(self):
        import main
        portfolio = [
            {"symbol": "AAPL", "price": 180.0, "quantity": 10.0, "investment": 1800.0},
            {"symbol": "TSLA", "price": 250.0, "quantity": 5.0, "investment": 1250.0}
        ]
        total = 3050.0

        txt_file = "test_main_summary.txt"
        csv_file = "test_main_summary.csv"

        try:
            main.save_to_txt_file(portfolio, total, txt_file)
            self.assertTrue(os.path.exists(txt_file))
            with open(txt_file, "r", encoding="utf-8") as f:
                content = f.read()
                self.assertIn("AAPL", content)
                self.assertIn("3050.00", content)

            main.save_to_csv_file(portfolio, total, csv_file)
            self.assertTrue(os.path.exists(csv_file))
            with open(csv_file, "r", encoding="utf-8") as f:
                content = f.read()
                self.assertIn("AAPL", content)
                self.assertIn("3050.00", content)
        finally:
            if os.path.exists(txt_file):
                os.remove(txt_file)
            if os.path.exists(csv_file):
                os.remove(csv_file)


if __name__ == "__main__":
    unittest.main()
