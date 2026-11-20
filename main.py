"""
=============================================================================
CodeAlpha Python Programming Internship
Task 2: Stock Portfolio Tracker
=============================================================================

Project Objective:
Build a simple stock tracker that calculates total investment based on
manually defined stock prices.

Simplified Scope (as specified in Task 2):
1. User inputs stock names and quantity.
2. Use a hardcoded dictionary to define stock prices (e.g., {"AAPL": 180, "TSLA": 250}).
3. Display total investment value.
4. Optionally save the result in a .txt or .csv file.

Key Concepts Used:
- dictionary: Hardcoded stock prices mapping ticker to price
- input/output: Interactive terminal prompts and formatted summaries
- basic arithmetic: Investment = Price x Quantity; Total Investment = Sum of investments
- file handling: Saving results to portfolio_summary.txt and portfolio_summary.csv
=============================================================================
"""

import csv
import os
import sys

# ---------------------------------------------------------------------------
# 1. Hardcoded Dictionary of Stock Prices (Task 2 Requirement)
# ---------------------------------------------------------------------------
STOCK_PRICES = {
    "AAPL": 180.0,   # Apple Inc.
    "TSLA": 250.0,   # Tesla Inc.
    "GOOGL": 140.0,  # Alphabet Inc.
    "MSFT": 400.0,   # Microsoft Corp.
    "AMZN": 185.0,   # Amazon.com Inc.
    "NVDA": 130.0    # NVIDIA Corp.
}


# ---------------------------------------------------------------------------
# 2. Helper Functions
# ---------------------------------------------------------------------------
def display_header():
    """Prints the project banner and Task 2 details."""
    print("=" * 70)
    print("        CODEALPHA PYTHON PROGRAMMING INTERNSHIP - TASK 2")
    print("                    STOCK PORTFOLIO TRACKER")
    print("=" * 70)


def display_price_catalog():
    """Displays the predefined hardcoded stock prices from the dictionary."""
    print("\nPredefined Stock Prices (Hardcoded Dictionary):")
    print("-" * 45)
    for symbol, price in STOCK_PRICES.items():
        print(f"  • {symbol:<8} : ${price:>8.2f}")
    print("-" * 45)


def save_to_txt_file(portfolio, total_investment, filename="portfolio_summary.txt"):
    """
    Saves portfolio summary to a .txt file (File Handling).
    """
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write("=" * 60 + "\n")
            f.write("       STOCK PORTFOLIO TRACKER - SUMMARY REPORT\n")
            f.write("       CodeAlpha Python Programming - Task 2\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"{'STOCK':<10} {'PRICE':>12} {'QUANTITY':>12} {'INVESTMENT':>16}\n")
            f.write("-" * 60 + "\n")
            for item in portfolio:
                f.write(
                    f"{item['symbol']:<10} "
                    f"${item['price']:>11.2f} "
                    f"{item['quantity']:>12.2f} "
                    f"${item['investment']:>15.2f}\n"
                )
            f.write("-" * 60 + "\n")
            f.write(f"{'TOTAL INVESTMENT':<36} ${total_investment:>15.2f}\n")
            f.write("=" * 60 + "\n")
        print(f"\n[Success] Portfolio saved to text file: '{filename}'")
    except IOError as e:
        print(f"\n[Error] Could not save text file: {e}")


def save_to_csv_file(portfolio, total_investment, filename="portfolio_summary.csv"):
    """
    Saves portfolio summary to a .csv file (File Handling).
    """
    try:
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Stock Symbol", "Price ($)", "Quantity", "Investment Value ($)"])
            for item in portfolio:
                writer.writerow([
                    item["symbol"],
                    f"{item['price']:.2f}",
                    item["quantity"],
                    f"{item['investment']:.2f}"
                ])
            writer.writerow([])
            writer.writerow(["TOTAL", "", "", f"{total_investment:.2f}"])
        print(f"[Success] Portfolio saved to CSV file: '{filename}'")
    except IOError as e:
        print(f"\n[Error] Could not save CSV file: {e}")


# ---------------------------------------------------------------------------
# 3. Main Workflow
# ---------------------------------------------------------------------------
def run_stock_tracker():
    """Main interactive loop implementing Task 2."""
    display_header()
    display_price_catalog()

    portfolio = []
    print("\nEnter your stocks and quantities. (Type 'done' or 'exit' when finished)\n")

    while True:
        # Prompt user for stock name/symbol
        stock_input = input("Enter Stock Symbol (e.g. AAPL, TSLA) or 'done': ").strip().upper()

        if stock_input in ["DONE", "EXIT", "Q", "QUIT"]:
            break

        if not stock_input:
            print("[Warning] Stock symbol cannot be empty. Please try again.")
            continue

        # Look up price in hardcoded dictionary
        if stock_input in STOCK_PRICES:
            price = STOCK_PRICES[stock_input]
            print(f"  -> Found in catalog: {stock_input} Price = ${price:.2f}")
        else:
            print(f"  -> '{stock_input}' is not in predefined dictionary.")
            custom_price_input = input(f"  Enter price for {stock_input} ($): ").strip()
            try:
                price = float(custom_price_input)
                if price <= 0:
                    print("[Error] Price must be greater than $0.00.")
                    continue
            except ValueError:
                print("[Error] Invalid price. Must be a numeric value.")
                continue

        # Prompt user for quantity
        qty_input = input(f"Enter Quantity for {stock_input}: ").strip()
        try:
            quantity = float(qty_input)
            if quantity <= 0:
                print("[Error] Quantity must be greater than 0.")
                continue
        except ValueError:
            print("[Error] Invalid quantity. Must be a numeric value.")
            continue

        # Basic Arithmetic: Investment = Stock Price x Quantity
        investment = price * quantity

        # Store in list of dictionaries
        portfolio.append({
            "symbol": stock_input,
            "price": price,
            "quantity": quantity,
            "investment": investment
        })

        print(f"  [Added] {stock_input}: {quantity} shares @ ${price:.2f} = ${investment:,.2f}\n")

    # -----------------------------------------------------------------------
    # 4. Display Results & Calculations
    # -----------------------------------------------------------------------
    if not portfolio:
        print("\n[Info] No stocks entered. Exiting program.")
        return

    # Basic Arithmetic: Total Investment = Sum of all stock investments
    total_investment = sum(item["investment"] for item in portfolio)
    total_shares = sum(item["quantity"] for item in portfolio)

    print("\n" + "=" * 65)
    print("                    PORTFOLIO SUMMARY REPORT")
    print("=" * 65)
    print(f"{'STOCK':<10} {'PRICE':>12} {'QUANTITY':>12} {'INVESTMENT VALUE':>18}")
    print("-" * 65)

    for item in portfolio:
        print(
            f"{item['symbol']:<10} "
            f"${item['price']:>11.2f} "
            f"{item['quantity']:>12.2f} "
            f"${item['investment']:>17,.2f}"
        )

    print("-" * 65)
    print(f"{'TOTAL NUMBER OF STOCKS:':<30} {len(portfolio)} stocks")
    print(f"{'TOTAL QUANTITY OF SHARES:':<30} {total_shares:.2f} shares")
    print(f"{'TOTAL INVESTMENT:':<30} ${total_investment:>15,.2f}")
    print("=" * 65)

    # -----------------------------------------------------------------------
    # 5. Optional File Handling (.txt and .csv)
    # -----------------------------------------------------------------------
    save_choice = input("\nWould you like to save this portfolio report? (txt / csv / both / n): ").strip().lower()

    if save_choice in ["txt", "text", "t"]:
        save_to_txt_file(portfolio, total_investment)
    elif save_choice in ["csv", "c"]:
        save_to_csv_file(portfolio, total_investment)
    elif save_choice in ["both", "yes", "y", "all"]:
        save_to_txt_file(portfolio, total_investment)
        save_to_csv_file(portfolio, total_investment)
    else:
        print("[Info] Report not saved to disk.")

    # Optional prompt to open web dashboard
    open_web = input("\nWould you like to open the modern Web Dashboard? (y/N): ").strip().lower()
    if open_web in ["y", "yes"]:
        import webbrowser
        html_path = os.path.abspath("index.html")
        webbrowser.open(f"file://{html_path}")

    print("\nThank you for using CodeAlpha Stock Portfolio Tracker! (Task 2 Complete)\n")


# ---------------------------------------------------------------------------
# Program Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    run_stock_tracker()
