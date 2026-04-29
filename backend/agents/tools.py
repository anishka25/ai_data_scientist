TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "Execute a read-only SQL query against the organizational SQLite database. Schema: sales(id, product, amount, date, region), inventory(id, product, stock_level, warehouse), customers(id, name, segment, lifetime_value).",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Valid SQLite SELECT query."}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_python",
            "description": "Execute Python code in an isolated virtual environment. Use this for statistical analysis, modeling, forecasting, and generating matplotlib/seaborn plots. Save images to the current working directory (e.g., plt.savefig('chart.png')). If a package is missing, use install_python_packages first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python code to execute."}
                },
                "required": ["code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "install_python_packages",
            "description": "Install Python packages into the isolated venv using pip.",
            "parameters": {
                "type": "object",
                "properties": {
                    "packages": {"type": "array", "items": {"type": "string"}, "description": "List of package names."}
                },
                "required": ["packages"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_pdf",
            "description": "Analyze a PDF document by converting pages to images and using visual sub-agents. Provide the absolute path to the PDF within the workspace or data directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pdf_path": {"type": "string", "description": "Absolute path to the PDF file."},
                    "query": {"type": "string", "description": "Specific question to answer from the PDF."}
                },
                "required": ["pdf_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_erp_logs",
            "description": "Retrieve recent ERP system logs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "default": 50, "description": "Max number of log entries."}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_market_trends",
            "description": "Retrieve mock market trend data for a given symbol or ALL.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "default": "ALL", "description": "Market symbol or ALL."}
                }
            }
        }
    }
]
