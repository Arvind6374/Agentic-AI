from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import time as time_module
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# =====================================================================
# MOCK TRADE INTELLIGENCE DATA
# =====================================================================

EXPORTERS = [
    "OLAM INTERNATIONAL LTD", "TATA COFFEE LTD", "CCL PRODUCTS INDIA LTD",
    "NESTLE INDIA PVT LTD", "HINDUSTAN UNILEVER LTD", "ITC LIMITED",
    "KRBL LIMITED", "LT FOODS LTD", "DAAWAT FOODS LTD", "AMIRA PURE FOODS PVT LTD",
    "ALLANA SONS LTD", "KOHINOOR FOODS LTD", "NATURE BIO FOODS LTD",
    "USHODAYA ENTERPRISES LTD", "LAKSHMI ENERGY FOODS LTD"
]

IMPORTERS = [
    "STARBUCKS CORPORATION", "NESTLE SA", "JACOBS DOUWE EGBERTS",
    "LAVAZZA SPA", "ILLY CAFFE SPA", "COSTCO WHOLESALE CORP",
    "WALMART INC", "AMAZON.COM INC", "CARREFOUR SA", "TESCO PLC"
]

COUNTRIES = ["Vietnam", "USA", "Germany", "UAE", "Saudi Arabia", "UK",
             "Japan", "Singapore", "Netherlands", "Belgium", "South Korea", "Australia"]

PORTS_ORIGIN = ["NHAVA SHEVA (JNPT)", "MUNDRA PORT", "CHENNAI PORT",
                "COCHIN PORT", "KOLKATA PORT", "VISAKHAPATNAM PORT", "TUTICORIN PORT"]
PORTS_DEST = ["HO CHI MINH PORT", "HAMBURG PORT", "JEBEL ALI PORT",
              "BUSAN PORT", "SINGAPORE PORT", "ROTTERDAM PORT", "FELIXSTOWE PORT", "LONG BEACH PORT"]

COMMODITIES = ["Coffee", "Rice", "Tea", "Spices", "Glass", "Cotton", "Sugar"]
GRADES = {
    "Coffee": ["Arabica Grade A", "Arabica Plantation A", "Robusta Cherry AB", "Robusta Parchment PB", "Instant Spray Dried"],
    "Rice": ["1121 Basmati Sella", "1121 Basmati Steam", "1509 Basmati Sella", "Pusa Basmati Raw", "IR-64 Parboiled"],
    "Tea": ["CTC BOP", "Orthodox TGFOP", "Green Tea Sencha", "Darjeeling First Flush"],
    "Glass": ["Float Glass 4mm", "Float Glass 6mm", "Tempered Glass 8mm", "Laminated Glass 10mm"],
    "Spices": ["Black Pepper ASTA", "Turmeric Finger", "Cumin Seeds", "Cardamom Bold Green"],
    "Cotton": ["Shankar-6 Raw", "J-34 Combed", "MCU-5 Long Staple"],
    "Sugar": ["ICUMSA 45", "ICUMSA 100", "Raw Sugar VHP"],
}
INCOTERMS = ["FOB", "CIF", "CFR", "EXW", "DDP"]


def _detect_commodity(q):
    for c in COMMODITIES:
        if c.lower() in q.lower():
            return c
    return "Coffee"


def _gen_ranking(question):
    commodity = _detect_commodity(question)
    n = 5
    for w in question.split():
        if w.isdigit():
            n = min(int(w), 15)
            break

    data = []
    base = random.uniform(800e6, 3e9)
    for i in range(n):
        val = base * (1 - i * 0.15) * random.uniform(0.85, 1.15)
        qty = int(val / random.uniform(400, 800))
        data.append({
            "exporter_name": EXPORTERS[i % len(EXPORTERS)],
            "trade_value_usd": round(val, 2),
            "total_quantity": qty,
            "shipment_count": random.randint(50, 900),
            "avg_unit_price": round(val / max(qty, 1), 2),
        })

    sql = f"SELECT exporter_name,\n       SUM(trade_value_usd) AS trade_value_usd,\n       SUM(quantity) AS total_quantity,\n       COUNT(*) AS shipment_count,\n       ROUND(AVG(unit_price_usd), 2) AS avg_unit_price\nFROM shipment_records\nWHERE UPPER(commodity) = '{commodity.upper()}'\nGROUP BY exporter_name\nORDER BY trade_value_usd DESC\nLIMIT {n}"
    chart = {"type": "bar", "label_key": "exporter_name", "value_keys": ["trade_value_usd"], "data": data}
    summary = f"Top {n} {commodity.lower()} exporters by trade value. **{data[0]['exporter_name']}** leads with ${data[0]['trade_value_usd']/1e9:.2f}B across {data[0]['shipment_count']} shipments."
    insights = [
        f"**{data[0]['exporter_name']}** dominates with {round(data[0]['trade_value_usd']/sum(d['trade_value_usd'] for d in data)*100)}% market share",
        f"Average unit price across top {n} ranges from **${min(d['avg_unit_price'] for d in data):,.0f}** to **${max(d['avg_unit_price'] for d in data):,.0f}**/unit",
    ]
    return data, sql, chart, summary, commodity, insights, "Ranking"


def _gen_trend(question):
    commodity = _detect_commodity(question)
    months = [f"2024-{m:02d}" for m in range(1, 13)]
    base = random.uniform(100e6, 500e6)
    data = []
    for m in months:
        val = base * random.uniform(0.7, 1.4)
        qty = int(val / random.uniform(300, 700))
        data.append({"month": m, "trade_value_usd": round(val, 2), "total_quantity": qty, "shipment_count": random.randint(20, 120)})

    sql = f"SELECT DATE_TRUNC('month', date) AS month,\n       SUM(trade_value_usd) AS trade_value_usd,\n       SUM(quantity) AS total_quantity,\n       COUNT(*) AS shipment_count\nFROM shipment_records\nWHERE UPPER(commodity) = '{commodity.upper()}'\n  AND date >= '2024-01-01' AND date < '2025-01-01'\nGROUP BY DATE_TRUNC('month', date)\nORDER BY month"
    chart = {"type": "line", "label_key": "month", "value_keys": ["trade_value_usd"], "data": data}
    total = sum(d["trade_value_usd"] for d in data)
    peak = max(data, key=lambda d: d["trade_value_usd"])
    summary = f"Monthly {commodity.lower()} trade trend for 2024. Total: **${total/1e9:.2f}B**. Peak: {peak['month']} (${peak['trade_value_usd']/1e6:.0f}M)."
    insights = [
        f"Peak trading month was **{peak['month']}** with ${peak['trade_value_usd']/1e6:.0f}M",
        f"Total annual trade: **${total/1e9:.2f}B** across {sum(d['shipment_count'] for d in data)} shipments",
    ]
    return data, sql, chart, summary, commodity, insights, "Trend"


def _gen_sourcing(question):
    commodity = _detect_commodity(question)
    grades = GRADES.get(commodity, ["Standard Grade"])
    data = []
    for i in range(8):
        val = random.uniform(50e6, 500e6)
        qty = int(val / random.uniform(300, 800))
        data.append({
            "exporter_name": EXPORTERS[i], "grade": grades[i % len(grades)],
            "trade_value_usd": round(val, 2), "total_quantity": qty,
            "avg_unit_price": round(val / max(qty, 1), 2),
            "origin_port": random.choice(PORTS_ORIGIN),
            "destination_country": random.choice(COUNTRIES),
            "shipment_count": random.randint(10, 200),
        })

    sql = f"SELECT DISTINCT exporter_name, grade,\n       SUM(trade_value_usd) AS trade_value_usd,\n       SUM(quantity) AS total_quantity,\n       ROUND(AVG(unit_price_usd), 2) AS avg_unit_price,\n       origin_port, destination_country,\n       COUNT(*) AS shipment_count\nFROM shipment_records\nWHERE UPPER(commodity) = '{commodity.upper()}'\nGROUP BY exporter_name, grade, origin_port, destination_country\nORDER BY trade_value_usd DESC\nLIMIT 8"
    summary = f"Found {len(data)} suppliers for {commodity.lower()}. **{data[0]['exporter_name']}** leads with ${data[0]['trade_value_usd']/1e6:.0f}M."
    insights = [
        f"**{data[0]['exporter_name']}** is top supplier with ${data[0]['trade_value_usd']/1e6:.0f}M",
        f"Unit prices range **${min(d['avg_unit_price'] for d in data):,.0f}** to **${max(d['avg_unit_price'] for d in data):,.0f}**/unit",
    ]
    return data, sql, None, summary, commodity, insights, "Sourcing"


def _gen_comparison(question):
    c1, c2 = "India", "Vietnam"
    for a, b in [("india", "vietnam"), ("india", "china"), ("brazil", "vietnam"), ("india", "usa")]:
        if a in question.lower() and b in question.lower():
            c1, c2 = a.title(), b.title()
            break
    commodity = _detect_commodity(question)
    months = [f"2024-{m:02d}" for m in range(1, 13)]
    data = []
    for m in months:
        data.append({"month": m, f"{c1.lower()}_value": round(random.uniform(50e6, 200e6), 2), f"{c2.lower()}_value": round(random.uniform(30e6, 180e6), 2)})

    sql = f"SELECT DATE_TRUNC('month', date) AS month,\n       SUM(CASE WHEN origin_country='{c1}' THEN trade_value_usd ELSE 0 END) AS {c1.lower()}_value,\n       SUM(CASE WHEN origin_country='{c2}' THEN trade_value_usd ELSE 0 END) AS {c2.lower()}_value\nFROM shipment_records\nWHERE UPPER(commodity) = '{commodity.upper()}'\n  AND origin_country IN ('{c1}','{c2}')\nGROUP BY 1 ORDER BY 1"
    chart = {"type": "line", "label_key": "month", "value_keys": [f"{c1.lower()}_value", f"{c2.lower()}_value"], "data": data}
    t1 = sum(d[f"{c1.lower()}_value"] for d in data)
    t2 = sum(d[f"{c2.lower()}_value"] for d in data)
    leader = c1 if t1 > t2 else c2
    summary = f"{c1} vs {c2} {commodity.lower()} exports 2024. **{leader}** leads: ${max(t1,t2)/1e9:.2f}B vs ${min(t1,t2)/1e9:.2f}B."
    insights = [f"**{leader}** leads by ${abs(t1-t2)/1e6:.0f}M ({round(max(t1,t2)/max(min(t1,t2),1)*100-100)}% higher)"]
    return data, sql, chart, summary, commodity, insights, "Comparison"


def _gen_default(question):
    commodity = _detect_commodity(question)
    grades = GRADES.get(commodity, ["Standard"])
    data = []
    for i in range(20):
        val = random.uniform(100_000, 50_000_000)
        qty = int(val / random.uniform(300, 800))
        data.append({
            "date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "exporter_name": random.choice(EXPORTERS),
            "importer_name": random.choice(IMPORTERS),
            "commodity": commodity, "grade": random.choice(grades),
            "origin_country": "India", "destination_country": random.choice(COUNTRIES),
            "origin_port": random.choice(PORTS_ORIGIN), "destination_port": random.choice(PORTS_DEST),
            "quantity": qty, "unit_price_usd": round(val / max(qty, 1), 2),
            "trade_value_usd": round(val, 2), "incoterm": random.choice(INCOTERMS),
            "product_description": f"{commodity} - {random.choice(grades)} - Export Quality",
        })

    sql = f"SELECT date, exporter_name, importer_name, commodity, grade,\n       origin_country, destination_country, quantity,\n       unit_price_usd, trade_value_usd, incoterm\nFROM shipment_records\nWHERE UPPER(commodity) = '{commodity.upper()}'\nORDER BY date DESC\nLIMIT 20"
    total = sum(d["trade_value_usd"] for d in data)
    summary = f"Retrieved {len(data)} {commodity.lower()} shipment records. Total: **${total/1e6:.1f}M**."
    insights = [f"Showing {len(data)} recent shipments totaling **${total/1e6:.1f}M**"]
    return data, sql, None, summary, commodity, insights, "Analytical"


def generate_query_response(question, session_id):
    start = time_module.time()
    q = question.lower()

    if any(w in q for w in ["top", "best", "highest", "largest", "rank", "leading"]):
        data, sql, chart, summary, commodity, insights, intent = _gen_ranking(question)
    elif any(w in q for w in ["trend", "month", "monthly", "over time", "timeline"]):
        data, sql, chart, summary, commodity, insights, intent = _gen_trend(question)
    elif any(w in q for w in ["compare", "vs", "versus"]):
        data, sql, chart, summary, commodity, insights, intent = _gen_comparison(question)
    elif any(w in q for w in ["source", "supplier", "find", "who sells"]):
        data, sql, chart, summary, commodity, insights, intent = _gen_sourcing(question)
    else:
        data, sql, chart, summary, commodity, insights, intent = _gen_default(question)

    elapsed = (time_module.time() - start) * 1000 + random.uniform(180, 650)
    cost_map = {"Ranking": "Simple", "Trend": "Medium", "Comparison": "Medium", "Sourcing": "Simple", "Analytical": "Complex"}

    dq_flags = []
    if random.random() > 0.4:
        dq_flags.append("destination_port missing in 12% of records")
    if random.random() > 0.6:
        dq_flags.append("unit_price_usd NULL for 3 rows - excluded from avg")

    followup_map = {
        "Ranking": [f"Show monthly trend for {data[0].get('exporter_name','')}", f"Which countries import most {commodity.lower()}?", "Compare unit prices across exporters"],
        "Trend": [f"Who are the top {commodity.lower()} exporters?", "Show price trend alongside volume", "Compare with previous year"],
        "Sourcing": ["Compare prices of these suppliers", "Which has the best track record?", "Show shipping routes for top supplier"],
        "Comparison": ["Show ranking for each country", "Break down by grade", "Add quantity comparison"],
        "Analytical": [f"Summarize by exporter", "Show the trend over time", "What is the average price?"],
    }

    return {
        "success": True, "data": data, "chart_data": chart, "summary": summary,
        "sql": sql, "total_rows": len(data), "elapsed_ms": round(elapsed, 1),
        "intent": intent, "tables_used": ["shipment_records"], "session_id": session_id,
        "data_quality_flags": dq_flags,
        "analytical_insights": insights,
        "confidence": {"score": random.randint(78, 96), "level": "High", "explanations": ["Direct column match", f"{intent} intent detected", "SQL validated against schema"]},
        "followup_questions": followup_map.get(intent, []),
        "cost_tier": cost_map.get(intent, "Simple"),
        "entities": {"commodity": commodity},
    }


def generate_entity_profile(name, entity_type):
    commodity = random.choice(["Coffee", "Rice", "Tea"])
    grades = GRADES.get(commodity, ["Standard"])
    total_value = random.uniform(500e6, 3e9)
    total_qty = int(total_value / random.uniform(400, 700))
    shipments = random.randint(100, 900)
    countries_served = random.randint(3, 15)

    grade_data = []
    remaining = total_value
    for i, g in enumerate(grades[:4]):
        gval = remaining * random.uniform(0.2, 0.5) if i < len(grades[:4]) - 1 else remaining
        if i < len(grades[:4]) - 1:
            remaining -= gval
        grade_data.append({"name": g, "value": round(gval, 2), "quantity": int(gval / random.uniform(350, 650))})
    grade_data.sort(key=lambda x: x["value"], reverse=True)

    size_label = "significant" if total_value > 1e9 else "notable" if total_value > 500e6 else "emerging"
    summary_text = f"{name} is a {size_label} {entity_type} with {shipments} recorded shipments totaling ${total_value/1e9:.2f}B. Primary commodity is {commodity}, contributing ${grade_data[0]['value']/1e9:.2f}B in trade value. Active from Jan 2023 to Nov 2024."

    country_data = [{"country": c, "trade_value": round(random.uniform(10e6, 500e6), 2), "shipments": random.randint(5, 200)} for c in random.sample(COUNTRIES, min(countries_served, len(COUNTRIES)))]
    country_data.sort(key=lambda x: x["trade_value"], reverse=True)

    incoterm_data = [{"term": t, "count": random.randint(10, 300)} for t in random.sample(INCOTERMS, random.randint(2, 4))]

    why_choose = []
    if total_value > 1e9:
        why_choose.append(f"High-volume trader with ${total_value/1e9:.1f}B total value")
    if any(t["term"] == "FOB" for t in incoterm_data):
        why_choose.append("Offers FOB terms for flexible freight")
    if countries_served > 3:
        why_choose.append(f"Ships to {countries_served} countries globally")
    avg_price = total_value / max(total_qty, 1)
    if avg_price < 600:
        why_choose.append(f"Competitive pricing at ${avg_price:,.0f}/unit")

    return {
        "name": name, "type": entity_type,
        "overview": {
            "summary": summary_text,
            "kpis": {
                "total_shipments": shipments, "total_trade_value": round(total_value, 2),
                "avg_unit_price": round(total_value / max(total_qty, 1), 2),
                "countries_served": countries_served, "commodities_traded": random.randint(1, 5),
            },
            "top_commodity": {"name": commodity, "trade_value": round(total_value * 0.85, 2), "quantity": int(total_qty * 0.85), "grades": grade_data},
            "incoterms": incoterm_data, "countries": country_data,
            "date_range": {"start": "2023-01-15", "end": "2024-11-30"},
            "why_choose": why_choose,
        },
    }


# ─── Schema Mock ──────────────────────────────────────────────

MOCK_SCHEMA = {
    "shipment_records": {
        "columns": [
            {"name": "id", "type": "BIGINT", "nullable": False, "is_primary_key": True},
            {"name": "date", "type": "DATE", "nullable": True, "is_primary_key": False},
            {"name": "hs_code", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "hs_code_description", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "product_description", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "exporter_name", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "importer_name", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "origin_country", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "destination_country", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "origin_port", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "destination_port", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "quantity", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "quantity_unit", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "unit_price_usd", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "trade_value_usd", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "weight_kg", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "commodity", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "grade", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "incoterm", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "transport_mode", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "vessel_name", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "bill_of_lading", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "customs_code", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "payment_terms", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "currency", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "net_weight_kg", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "gross_weight_kg", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "container_count", "type": "BIGINT", "nullable": True, "is_primary_key": False},
            {"name": "container_type", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "insurance_value_usd", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "freight_value_usd", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "duty_usd", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "tax_usd", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "total_duty_tax_usd", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "country_of_origin", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "country_of_destination", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "exporter_address", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "importer_address", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "notify_party", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "customs_declaration_no", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "shipping_line", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "voyage_number", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "eta", "type": "DATE", "nullable": True, "is_primary_key": False},
            {"name": "etd", "type": "DATE", "nullable": True, "is_primary_key": False},
            {"name": "loading_date", "type": "DATE", "nullable": True, "is_primary_key": False},
            {"name": "arrival_date", "type": "DATE", "nullable": True, "is_primary_key": False},
        ],
        "foreign_keys": [],
        "row_count": 303000,
        "neighbors": ["trade_summary"],
    },
    "trade_summary": {
        "columns": [
            {"name": "id", "type": "BIGINT", "nullable": False, "is_primary_key": True},
            {"name": "commodity", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "exporter_name", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "total_trade_value", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "total_quantity", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "shipment_count", "type": "BIGINT", "nullable": True, "is_primary_key": False},
            {"name": "avg_unit_price", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
            {"name": "first_shipment_date", "type": "DATE", "nullable": True, "is_primary_key": False},
            {"name": "last_shipment_date", "type": "DATE", "nullable": True, "is_primary_key": False},
            {"name": "countries_served", "type": "BIGINT", "nullable": True, "is_primary_key": False},
            {"name": "origin_country", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "top_grade", "type": "TEXT", "nullable": True, "is_primary_key": False},
            {"name": "market_share_pct", "type": "NUMERIC", "nullable": True, "is_primary_key": False},
        ],
        "foreign_keys": [],
        "row_count": 847,
        "neighbors": ["shipment_records"],
    },
}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "schema_ready": True, "tables": 2}

@api_router.get("/schema")
async def get_schema():
    return MOCK_SCHEMA

@api_router.post("/query")
async def query_endpoint(request: QueryRequest):
    sid = request.session_id or str(uuid.uuid4())
    return generate_query_response(request.question, sid)

@api_router.post("/query/all")
async def fetch_all_rows(body: dict):
    return {"success": True, "data": [], "total_rows": 0}

@api_router.get("/entity-profile")
async def entity_profile(name: str, type: str = "exporter"):
    return generate_entity_profile(name, type)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
