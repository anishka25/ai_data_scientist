import os
import sqlite3
import json
import random
from datetime import datetime, timedelta

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__)))

def init():
    os.makedirs(DATA_DIR, exist_ok=True)
    db_path = os.path.join(DATA_DIR, "mock_business.db")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("DROP TABLE IF EXISTS sales")
    c.execute("DROP TABLE IF EXISTS inventory")
    c.execute("DROP TABLE IF EXISTS customers")

    c.execute("CREATE TABLE sales (id INTEGER PRIMARY KEY, product TEXT, amount REAL, date TEXT, region TEXT)")
    c.execute("CREATE TABLE inventory (id INTEGER PRIMARY KEY, product TEXT, stock_level INTEGER, warehouse TEXT)")
    c.execute("CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, segment TEXT, lifetime_value REAL)")

    products = ["Alpha Processor", "Beta Module", "Gamma Core", "Delta Array", "Epsilon Node"]
    regions = ["North America", "EMEA", "APAC", "LATAM"]
    segments = ["Enterprise", "SMB", "Startup"]

    base_date = datetime(2025, 1, 1)
    for i in range(500):
        date = (base_date + timedelta(days=random.randint(0, 120))).isoformat()
        c.execute("INSERT INTO sales VALUES (?, ?, ?, ?, ?)", (
            i+1, random.choice(products), round(random.gauss(5000, 2000), 2),
            date, random.choice(regions)
        ))

    for i, p in enumerate(products):
        c.execute("INSERT INTO inventory VALUES (?, ?, ?, ?)", (
            i+1, p, random.randint(5, 100), random.choice(["WHA", "WHB", "WHC"])
        ))

    names = ["Elena Vostok", "Marcus Chen", "Aria Patel", "Jovan Kowalski", "Suki Tanaka", "Lars Jensen", "Ingrid Bergman", "Kai Osei"]
    for i in range(50):
        c.execute("INSERT INTO customers VALUES (?, ?, ?, ?)", (
            i+1, random.choice(names), random.choice(segments),
            round(random.gauss(45000, 15000), 2)
        ))

    conn.commit()
    conn.close()

    erp_logs = []
    levels = ["INFO", "WARN", "ERROR", "DEBUG"]
    modules = ["PROCUREMENT", "INVENTORY", "HR", "FINANCE", "CRM"]
    for i in range(200):
        erp_logs.append({
            "timestamp": (base_date + timedelta(hours=random.randint(0, 3000))).isoformat(),
            "level": random.choice(levels),
            "module": random.choice(modules),
            "message": f"Transaction {random.randint(1000,9999)} processed in {random.choice(modules)}"
        })
    with open(os.path.join(DATA_DIR, "erp_logs.json"), "w") as f:
        json.dump(erp_logs, f)

    trends = []
    symbols = ["TECH_IDX", "ENERGY_IDX", "FINANCE_IDX"]
    for sym in symbols:
        price = 100.0
        for i in range(90):
            price = price * (1 + random.gauss(0.001, 0.02))
            trends.append({
                "date": (base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                "symbol": sym,
                "price": round(price, 2),
                "volume": random.randint(1000000, 5000000)
            })
    with open(os.path.join(DATA_DIR, "market_trends.json"), "w") as f:
        json.dump(trends, f)

def query_mock_db(query: str):
    db_path = os.path.join(DATA_DIR, "mock_business.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    try:
        c.execute(query)
        rows = [dict(row) for row in c.fetchall()]
        return rows
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

def get_erp_logs(limit=50):
    with open(os.path.join(DATA_DIR, "erp_logs.json")) as f:
        logs = json.load(f)
    return logs[:limit]

def get_market_trends(symbol="ALL"):
    with open(os.path.join(DATA_DIR, "market_trends.json")) as f:
        data = json.load(f)
    if symbol == "ALL":
        return data
    return [d for d in data if d["symbol"] == symbol]
