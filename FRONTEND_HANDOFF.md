# ChargeIQ NG — Frontend Integration Handoff
**For: Rasheed (Full-Stack Engineer)**  
**From: Abdulsalam (ML & DevOps)**  
**Last Updated: 2026-06-06**

---

## TL;DR — What You Need Right Now

```
API Base URL:     https://61pt3nzcl0.execute-api.us-east-1.amazonaws.com/prod
AppSync URL:      https://mdywa3rv4ffuvnwwiwdonatuhy.appsync-api.us-east-1.amazonaws.com/graphql
AppSync API Key:  da2-pdqh2pm7ozfoxbar5xht2fv4sm
AWS Region:       us-east-1
```

All REST endpoints have **CORS fully open** (`Access-Control-Allow-Origin: *`) — no proxy needed in dev.  
All endpoints return `Content-Type: application/json`.  
**No auth on the REST API right now** — Cognito is your job to wire in on the frontend.

---

## 1. REST API — All Endpoints

### Base URL
```
https://61pt3nzcl0.execute-api.us-east-1.amazonaws.com/prod
```

---

### GET /stations
**Purpose:** List all charging stations. Main data source for the map view.

**Query params (all optional):**
| Param | Values | Description |
|-------|--------|-------------|
| `city` | `Lagos` \| `Abuja` | Filter by city |

**Example requests:**
```
GET /stations
GET /stations?city=Lagos
GET /stations?city=Abuja
```

**Response 200:**
```json
{
  "stations": [
    {
      "stationId": "uuid-string",
      "name": "Victoria Island Charge",
      "area": "Victoria Island",
      "city": "Lagos",
      "address": "Victoria Island, Lagos, Nigeria",
      "location": {
        "lat": "6.4281",
        "lng": "3.4219"
      },
      "operator": "GreenCharge NG",
      "connectors": [
        {
          "connectorId": "1",
          "type": "CCS",
          "powerKw": "150",
          "status": "available"
        },
        {
          "connectorId": "2",
          "type": "Type2",
          "powerKw": "50",
          "status": "occupied"
        }
      ],
      "status": "active",
      "availableConnectors": "1",
      "totalConnectors": "2",
      "waitTimeMinutes": "0",
      "totalSessions24h": "23",
      "rating": "4.5",
      "createdAt": "2025-01-01T00:00:00.000000",
      "updatedAt": "2025-01-01T00:00:00.000000"
    }
  ],
  "count": 30
}
```

**Important field notes:**
- `location.lat` and `location.lng` are **strings** (not numbers) — parse with `parseFloat()` before passing to map
- `availableConnectors`, `totalConnectors`, `waitTimeMinutes`, `rating`, `totalSessions24h` are all **strings** — parse to numbers as needed
- `status` at the station level: `"active"` | `"occupied"` | `"offline"`
- `connectors[].status`: `"available"` | `"occupied"` | `"offline"`
- `connectors[].type`: `"CCS"` | `"Type2"` | `"CHAdeMO"` | `"Type1"`
- `connectors[].powerKw`: `"22"` | `"50"` | `"100"` | `"150"` (string)

**For the map:** Station pins should use these colour codes:
- `"active"` → Green
- `"occupied"` → Amber/Orange
- `"offline"` → Red/Grey

---

### GET /stations/{stationId}
**Purpose:** Full station detail. Triggers AI wait-time prediction via SageMaker when station is occupied.

**Path param:** `stationId` — the UUID from the stations list

**Example:**
```
GET /stations/abc-123-uuid
```

**Response 200:** Same shape as a single station object from the list above.

**AI feature note:** When `availableConnectors === "0"`, the Lambda automatically calls the SageMaker endpoint and **overwrites `waitTimeMinutes`** with an ML-predicted value (e.g. `"14.3"`). If SageMaker is unavailable it falls back to the stored DynamoDB value. You don't need to do anything special — it just works.

**Response 404:**
```json
{ "error": "Station not found" }
```

---

### PUT /stations/{stationId}/status
**Purpose:** Operator updates station availability. Also triggers SNS email notifications to subscribed drivers when a station comes back online.

**Path param:** `stationId`

**Request body:**
```json
{
  "status": "active",
  "availableConnectors": 2,
  "waitTimeMinutes": 0
}
```

| Field | Required | Values |
|-------|----------|--------|
| `status` | yes | `"active"` \| `"occupied"` \| `"offline"` |
| `availableConnectors` | no | integer |
| `waitTimeMinutes` | no | integer |

**Response 200:**
```json
{ "message": "Station updated successfully" }
```

**SNS side-effect:** When `status` changes from `"occupied"` or `"offline"` → `"active"`, an email is pushed to all subscribed drivers automatically.

---

### POST /stations
**Purpose:** Operator adds a new charging station.

**Request body:**
```json
{
  "name": "New Station Name",
  "area": "Lekki",
  "city": "Lagos",
  "address": "12 Example Street, Lekki, Lagos, Nigeria",
  "location": {
    "lat": "6.4490",
    "lng": "3.5852"
  },
  "operator": "GreenCharge NG",
  "connectors": [
    {
      "connectorId": "1",
      "type": "CCS",
      "powerKw": "150",
      "status": "available"
    }
  ],
  "status": "active",
  "availableConnectors": "1",
  "totalConnectors": "1",
  "waitTimeMinutes": "0",
  "totalSessions24h": "0",
  "rating": "4.0"
}
```

**Response 201:**
```json
{
  "message": "Station created successfully",
  "stationId": "newly-generated-uuid"
}
```

---

### GET /stations/{stationId}/availability
**Purpose:** Historical availability data for a station (last 24 snapshots). Use this to render the availability chart in the station detail panel.

**Example:**
```
GET /stations/abc-123-uuid/availability
```

**Response 200:** Array of availability log entries (sorted newest-first, max 24)
```json
[
  {
    "stationId": "abc-123-uuid",
    "timestamp": "2025-01-01T12:00:00.000000",
    "availableConnectors": "2",
    "totalConnectors": "3",
    "status": "active"
  }
]
```

---

### POST /availability
**Purpose:** Log an availability snapshot (for polling/automation use — you can call this when a user views a station to build up history).

**Request body:**
```json
{
  "stationId": "abc-123-uuid",
  "availableConnectors": "2",
  "totalConnectors": "3",
  "status": "active"
}
```

**Response 201:**
```json
{ "message": "Availability logged" }
```

---

### POST /query/nl
**Purpose:** Natural language search powered by Amazon Bedrock (Claude Haiku). This is the AI search bar feature.

**Request body:**
```json
{
  "query": "find me a free fast charger near Victoria Island"
}
```

**Response 200:**
```json
{
  "response": "I found 2 available fast charging stations near Victoria Island. Victoria Island Charge has a 150kW CCS connector available right now.",
  "stations": [
    { ... station object ... },
    { ... station object ... }
  ],
  "count": 2
}
```

- `response` — the natural language text to display to the user (show this as the AI's reply)
- `stations` — array of matched stations to highlight on the map (up to 5)
- `count` — number of results

**Fallback behaviour:** If Bedrock fails for any reason, the API still returns 200 with the top 5 active stations and a generic `response` message. It never returns a 500 to the user.

**For the UI:** Show `response` as a chat-style message, then highlight the returned `stations` on the map as pins.

---

### POST /notifications/subscribe
**Purpose:** Subscribe a driver's email to receive station availability alerts via SNS email.

**Request body:**
```json
{
  "email": "driver@example.com"
}
```

**Response 200:**
```json
{
  "message": "Subscription pending. Please check your email to confirm subscription.",
  "subscriptionArn": "arn:aws:sns:us-east-1:198233241344:chargeiq-driver-notifications:..."
}
```

**Important UX note:** The driver receives a confirmation email from AWS. They **must click the confirmation link** before they receive any notifications. Show a UI message telling them to check their email.

**Response 400:**
```json
{ "error": "Email is required" }
```

---

## 2. AppSync (Real-Time WebSocket)

AppSync is deployed and ready for real-time station status subscriptions. Use this to push live status updates to the map without polling.

```
AppSync GraphQL URL:  https://mdywa3rv4ffuvnwwiwdonatuhy.appsync-api.us-east-1.amazonaws.com/graphql
AppSync API Key:      da2-pdqh2pm7ozfoxbar5xht2fv4sm
Auth Mode:            API_KEY
```

**Note:** The Lambda functions are not yet writing to AppSync on every update. For the hackathon demo, use AppSync for subscriptions if you have time, but the REST `PUT /stations/{id}/status` endpoint is the reliable path. If you need real-time for the demo, you can poll `GET /stations` every 10–15 seconds as a fallback.

---

## 3. Data Shapes Reference

### Full Station Object
```typescript
interface Station {
  stationId: string;           // UUID
  name: string;
  area: string;
  city: "Lagos" | "Abuja";
  address: string;
  location: {
    lat: string;               // parse to float for map
    lng: string;               // parse to float for map
  };
  operator: string;            // "GreenCharge NG" | "VoltAfrica" | "EcoCharge" | "SwiftEV Nigeria" | "PowerUp NG"
  connectors: Connector[];
  status: "active" | "occupied" | "offline";
  availableConnectors: string; // parse to int
  totalConnectors: string;     // parse to int
  waitTimeMinutes: string;     // parse to float — ML-predicted when station is full
  totalSessions24h: string;    // parse to int
  rating: string;              // parse to float (3.5–5.0)
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
}

interface Connector {
  connectorId: string;         // "1", "2", "3"
  type: "CCS" | "Type2" | "CHAdeMO" | "Type1";
  powerKw: string;             // "22" | "50" | "100" | "150"
  status: "available" | "occupied" | "offline";
}
```

### NL Query Response
```typescript
interface NLQueryResponse {
  response: string;            // AI's natural language reply — show this to the user
  stations: Station[];         // up to 5 matched stations
  count: number;
}
```

---

## 4. Seeded Data Summary (30 Stations)

**Lagos (20 stations):**
| Station Name | Area | Lat | Lng |
|---|---|---|---|
| Ikeja EV Hub | Ikeja | 6.6018 | 3.3515 |
| Victoria Island Charge | Victoria Island | 6.4281 | 3.4219 |
| Lekki Phase 1 Station | Lekki | 6.4490 | 3.5852 |
| Surulere FastCharge | Surulere | 6.5020 | 3.3560 |
| Yaba Tech Charge | Yaba | 6.5170 | 3.3720 |
| Ajah EV Point | Ajah | 6.4698 | 3.5877 |
| Ikoyi Premium Charge | Ikoyi | 6.4550 | 3.4350 |
| Gbagada EV Station | Gbagada | 6.5560 | 3.3860 |
| Magodo Charge Point | Magodo | 6.6190 | 3.3940 |
| Oshodi Transit Hub | Oshodi | 6.5570 | 3.3480 |
| Maryland EV Stop | Maryland | 6.5700 | 3.3600 |
| Apapa Port Charge | Apapa | 6.4490 | 3.3580 |
| Festac EV Hub | Festac | 6.4650 | 3.2840 |
| Ogba FastCharge | Ogba | 6.6050 | 3.3340 |
| Sangotedo Charge | Sangotedo | 6.4380 | 3.6150 |
| Chevron Drive Station | Chevron | 6.4350 | 3.5380 |
| Ojodu EV Point | Ojodu | 6.6310 | 3.3520 |
| Isale Eko Charge | Lagos Island | 6.4530 | 3.3950 |
| Badagry Road Station | Badagry | 6.4150 | 2.8900 |
| Epe EV Hub | Epe | 6.5870 | 3.9790 |

**Abuja (10 stations):**
| Station Name | Area | Lat | Lng |
|---|---|---|---|
| Wuse 2 EV Hub | Wuse 2 | 9.0580 | 7.4891 |
| Maitama Charge Point | Maitama | 9.0820 | 7.4920 |
| Garki FastCharge | Garki | 9.0280 | 7.4850 |
| Gwarinpa EV Station | Gwarinpa | 9.1120 | 7.4150 |
| Jabi EV Hub | Jabi | 9.0720 | 7.4320 |
| Asokoro Charge | Asokoro | 9.0420 | 7.5320 |
| Utako EV Point | Utako | 9.0780 | 7.4520 |
| Kubwa FastCharge | Kubwa | 9.1590 | 7.3490 |
| Lokogoma Charge | Lokogoma | 8.9980 | 7.4320 |
| Lugbe EV Station | Lugbe | 8.9980 | 7.3820 |

**Map center suggestions:**
- Lagos default view: `{ lat: 6.5244, lng: 3.3792 }`, zoom 11
- Abuja default view: `{ lat: 9.0765, lng: 7.3986 }`, zoom 11

---

## 5. Filter Bar Implementation Guide

The `/stations` endpoint only supports `city` filtering server-side. **All other filters (connector type, distance radius, availability) must be done client-side** after fetching all stations.

```javascript
// Fetch all stations once, cache locally
const allStations = await fetch(`${API_BASE}/stations`).then(r => r.json());

// Client-side filter examples
const byConnectorType = (stations, type) =>
  stations.filter(s => s.connectors.some(c => c.type === type));

const byStatus = (stations, status) =>
  stations.filter(s => s.status === status);

// Distance filter — Haversine formula
const byRadius = (stations, userLat, userLng, radiusKm) =>
  stations.filter(s => {
    const lat = parseFloat(s.location.lat);
    const lng = parseFloat(s.location.lng);
    const R = 6371;
    const dLat = (lat - userLat) * Math.PI / 180;
    const dLon = (lng - userLng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userLat * Math.PI/180) *
              Math.cos(lat * Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) <= radiusKm;
  });
```

---

## 6. NL Search Bar Implementation

```javascript
// POST /query/nl
const searchWithAI = async (query) => {
  const res = await fetch(`${API_BASE}/query/nl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  // data.response  → show as AI chat message
  // data.stations  → highlight these pins on the map
  return data;
};

// Example queries that work well:
// "find me a free fast charger near Victoria Island"
// "show CCS chargers in Abuja"
// "available stations in Lekki"
// "which stations in Maitama are online?"
```

---

## 7. Operator Dashboard Data Flow

For the operator dashboard (station management):

```javascript
// List all stations (no filter = all cities)
GET /stations

// Update a station's status
PUT /stations/{stationId}/status
Body: { "status": "active", "availableConnectors": 2 }

// Add a new station
POST /stations
Body: { ...full station object without stationId... }
```

The `stationId` is auto-generated by the backend — don't send it in POST requests.

---

## 8. Heatmap / Analytics Endpoint

There is **no dedicated `/analytics/heatmap` endpoint built yet**. For the demo, generate the heatmap from the `/stations` data:

```javascript
// Derive heatmap intensity from totalSessions24h
const heatmapPoints = stations.map(s => ({
  lat: parseFloat(s.location.lat),
  lng: parseFloat(s.location.lng),
  weight: parseInt(s.totalSessions24h) / 40  // normalise 0–1
}));
```

If you need a dedicated endpoint, let me know and I'll deploy one.

---

## 9. Environment Variables for Your Frontend (.env)

Create a `.env` file in your React project root:

```env
REACT_APP_API_BASE_URL=https://61pt3nzcl0.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_APPSYNC_URL=https://mdywa3rv4ffuvnwwiwdonatuhy.appsync-api.us-east-1.amazonaws.com/graphql
REACT_APP_APPSYNC_API_KEY=da2-pdqh2pm7ozfoxbar5xht2fv4sm
REACT_APP_AWS_REGION=us-east-1
```

For Cognito (once you set it up — you own this):
```env
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 10. Known Gotchas & Quirks

1. **All numeric values are strings.** DynamoDB stores everything as strings. Always `parseFloat()` or `parseInt()` on `lat`, `lng`, `waitTimeMinutes`, `rating`, `availableConnectors`, `totalConnectors`, `totalSessions24h`, `powerKw`.

2. **Station `status` vs connector `status` use different values.** Station-level uses `"active"` (not `"available"`). Connector-level uses `"available"`. Don't mix them.

3. **`waitTimeMinutes` is `"0"` when connectors are free**, and an ML-predicted float string (e.g. `"14.3"`) when the station is full. Parse it accordingly before displaying.

4. **NL query results are max 5 stations.** Bedrock returns a filtered subset — these should be highlighted/zoomed on the map, not replace the full station list.

5. **SNS email confirmation is required.** After calling `/notifications/subscribe`, the user must click a link in an AWS confirmation email before they get any alerts. Always show a "Check your email" message after subscription.

6. **CORS is open (`*`)** — no need for a proxy in dev or prod. Direct fetch works everywhere.

7. **The `PUT /stations/{id}/status` body fields `availableConnectors` and `waitTimeMinutes` are integers** (not strings) in the request, but the backend stores them as strings. Don't stringify them in the request body.

---

## 11. What's Live vs What's Pending

| Feature | Status | Notes |
|---|---|---|
| GET /stations | ✅ Live | 30 stations seeded, Lagos + Abuja |
| GET /stations/{id} | ✅ Live | Includes SageMaker wait-time prediction |
| PUT /stations/{id}/status | ✅ Live | Triggers SNS notifications |
| POST /stations | ✅ Live | Operators add new stations |
| GET /stations/{id}/availability | ✅ Live | 24-entry history |
| POST /availability | ✅ Live | Log availability snapshots |
| POST /query/nl | ✅ Live | Bedrock Claude Haiku |
| POST /notifications/subscribe | ✅ Live | SNS email subscription |
| AppSync real-time subscriptions | ⚠️ Deployed, not fully wired | Use REST polling as fallback |
| SageMaker endpoint | ⚠️ May need re-deploy | Lambda falls back gracefully if down — let me know |
| Cognito User Pools | ❌ Your responsibility | Two roles: EV Driver + Station Operator |
| Amazon Location Service | ❌ Your responsibility | Map tiles + station pins |
| QuickSight dashboard | ✅ On my side | I'll share the embed URL when ready |

---

## 12. Quick Test — Verify the API is Up

Run this in your browser console or terminal to confirm everything is live:

```bash
# Should return 30 stations
curl https://61pt3nzcl0.execute-api.us-east-1.amazonaws.com/prod/stations

# Should return Lagos stations only
curl "https://61pt3nzcl0.execute-api.us-east-1.amazonaws.com/prod/stations?city=Lagos"

# NL query test
curl -X POST https://61pt3nzcl0.execute-api.us-east-1.amazonaws.com/prod/query/nl \
  -H "Content-Type: application/json" \
  -d '{"query": "show me available stations in Lekki"}'
```

---

## 13. Demo Flow Checklist (What You Must Show)

Per the hackathon plan, your 5 demo moments and what backend calls they use:

| Demo Moment | Backend Call |
|---|---|
| Map loads → Lagos pins with colour-coded status | `GET /stations?city=Lagos` |
| Click station → side panel with live wait time | `GET /stations/{stationId}` |
| Type NL query → Bedrock responds, highlights pins | `POST /query/nl` |
| Toggle heatmap → demand overlay | Derive from `totalSessions24h` in station data |
| Switch to operator view → edit station status | `PUT /stations/{stationId}/status` |

---

*Ping me if any endpoint behaves unexpectedly or you need a new one built. I'm watching CloudWatch — I'll see errors before you do.*
