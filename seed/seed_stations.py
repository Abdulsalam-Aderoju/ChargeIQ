import boto3
import uuid
import random
from datetime import datetime, timedelta

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("chargeiq-stations")

TAGS = [
    {"Key": "aws-apn-id", "Value": "pc:8l8gcn23lmlgammd8572tk6va"},
    {"Key": "event",      "Value": "oneWithAI"},
]

stations = [
    # Lagos stations
    {"name": "Ikeja EV Hub",          "area": "Ikeja",           "city": "Lagos", "lat": 6.6018,  "lng": 3.3515},
    {"name": "Victoria Island Charge","area": "Victoria Island", "city": "Lagos", "lat": 6.4281,  "lng": 3.4219},
    {"name": "Lekki Phase 1 Station", "area": "Lekki",           "city": "Lagos", "lat": 6.4490,  "lng": 3.5852},
    {"name": "Surulere FastCharge",   "area": "Surulere",        "city": "Lagos", "lat": 6.5020,  "lng": 3.3560},
    {"name": "Yaba Tech Charge",      "area": "Yaba",            "city": "Lagos", "lat": 6.5170,  "lng": 3.3720},
    {"name": "Ajah EV Point",         "area": "Ajah",            "city": "Lagos", "lat": 6.4698,  "lng": 3.5877},
    {"name": "Ikoyi Premium Charge",  "area": "Ikoyi",           "city": "Lagos", "lat": 6.4550,  "lng": 3.4350},
    {"name": "Gbagada EV Station",    "area": "Gbagada",         "city": "Lagos", "lat": 6.5560,  "lng": 3.3860},
    {"name": "Magodo Charge Point",   "area": "Magodo",          "city": "Lagos", "lat": 6.6190,  "lng": 3.3940},
    {"name": "Oshodi Transit Hub",    "area": "Oshodi",          "city": "Lagos", "lat": 6.5570,  "lng": 3.3480},
    {"name": "Maryland EV Stop",      "area": "Maryland",        "city": "Lagos", "lat": 6.5700,  "lng": 3.3600},
    {"name": "Apapa Port Charge",     "area": "Apapa",           "city": "Lagos", "lat": 6.4490,  "lng": 3.3580},
    {"name": "Festac EV Hub",         "area": "Festac",          "city": "Lagos", "lat": 6.4650,  "lng": 3.2840},
    {"name": "Ogba FastCharge",       "area": "Ogba",            "city": "Lagos", "lat": 6.6050,  "lng": 3.3340},
    {"name": "Sangotedo Charge",      "area": "Sangotedo",       "city": "Lagos", "lat": 6.4380,  "lng": 3.6150},
    {"name": "Chevron Drive Station", "area": "Chevron",         "city": "Lagos", "lat": 6.4350,  "lng": 3.5380},
    {"name": "Ojodu EV Point",        "area": "Ojodu",           "city": "Lagos", "lat": 6.6310,  "lng": 3.3520},
    {"name": "Isale Eko Charge",      "area": "Lagos Island",    "city": "Lagos", "lat": 6.4530,  "lng": 3.3950},
    {"name": "Badagry Road Station",  "area": "Badagry",         "city": "Lagos", "lat": 6.4150,  "lng": 2.8900},
    {"name": "Epe EV Hub",            "area": "Epe",             "city": "Lagos", "lat": 6.5870,  "lng": 3.9790},
    # Abuja stations
    {"name": "Wuse 2 EV Hub",         "area": "Wuse 2",          "city": "Abuja", "lat": 9.0580,  "lng": 7.4891},
    {"name": "Maitama Charge Point",  "area": "Maitama",         "city": "Abuja", "lat": 9.0820,  "lng": 7.4920},
    {"name": "Garki FastCharge",      "area": "Garki",           "city": "Abuja", "lat": 9.0280,  "lng": 7.4850},
    {"name": "Gwarinpa EV Station",   "area": "Gwarinpa",        "city": "Abuja", "lat": 9.1120,  "lng": 7.4150},
    {"name": "Jabi EV Hub",           "area": "Jabi",            "city": "Abuja", "lat": 9.0720,  "lng": 7.4320},
    {"name": "Asokoro Charge",        "area": "Asokoro",         "city": "Abuja", "lat": 9.0420,  "lng": 7.5320},
    {"name": "Utako EV Point",        "area": "Utako",           "city": "Abuja", "lat": 9.0780,  "lng": 7.4520},
    {"name": "Kubwa FastCharge",      "area": "Kubwa",           "city": "Abuja", "lat": 9.1590,  "lng": 7.3490},
    {"name": "Lokogoma Charge",       "area": "Lokogoma",        "city": "Abuja", "lat": 8.9980,  "lng": 7.4320},
    {"name": "Lugbe EV Station",      "area": "Lugbe",           "city": "Abuja", "lat": 8.9980,  "lng": 7.3820},
]

operators = ["GreenCharge NG", "VoltAfrica", "EcoCharge", "SwiftEV Nigeria", "PowerUp NG"]
connector_types = ["CCS", "Type2", "CHAdeMO", "Type1"]
statuses = ["available", "available", "available", "occupied", "offline"]

def generate_connectors():
    count = random.randint(2, 4)
    connectors = []
    for i in range(count):
        connectors.append({
            "connectorId": str(i + 1),
            "type": random.choice(connector_types),
            "powerKw": str(random.choice([22, 50, 100, 150])),
            "status": random.choice(statuses),
        })
    return connectors

def seed():
    print("🌱 Seeding ChargeIQ stations...\n")
    for s in stations:
        connectors = generate_connectors()
        available = sum(1 for c in connectors if c["status"] == "available")
        total = len(connectors)
        overall_status = "active" if available > 0 else "occupied" if any(
            c["status"] == "occupied" for c in connectors) else "offline"

        item = {
            "stationId":           str(uuid.uuid4()),
            "name":                s["name"],
            "area":                s["area"],
            "city":                s["city"],
            "address":             f"{s['area']}, {s['city']}, Nigeria",
            "location": {
                "lat": str(s["lat"]),
                "lng": str(s["lng"]),
            },
            "operator":            random.choice(operators),
            "connectors":          connectors,
            "status":              overall_status,
            "availableConnectors": str(available),
            "totalConnectors":     str(total),
            "waitTimeMinutes":     str(0 if available > 0 else random.randint(5, 30)),
            "totalSessions24h":    str(random.randint(5, 40)),
            "rating":              str(round(random.uniform(3.5, 5.0), 1)),
            "createdAt":           datetime.utcnow().isoformat(),
            "updatedAt":           datetime.utcnow().isoformat(),
        }

        table.put_item(Item=item)
        print(f"✅  {s['name']} — {s['city']} ({overall_status})")

    print(f"\n🎉 Done! {len(stations)} stations seeded into chargeiq-stations table.")

if __name__ == "__main__":
    seed()