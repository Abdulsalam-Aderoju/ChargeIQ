export const MOCK_STATIONS = [
  {
    stationId: "st-001",
    name: "Ikeja EV Hub",
    operator: "GreenCharge NG",
    area: "Ikeja",
    city: "Lagos",
    address: "Obafemi Awolowo Way, Ikeja, Lagos",
    location: { lat: 6.6018, lng: 3.3515 },
    connectors: [
      { connectorId: "1", type: "CCS", powerKw: "50", status: "available" },
      { connectorId: "2", type: "Type2", powerKw: "22", status: "occupied" }
    ],
    status: "active",
    availableConnectors: "1",
    totalConnectors: "2",
    waitTimeMinutes: "0",
    totalSessions24h: "14",
    rating: "4.5"
  },
  {
    stationId: "st-002",
    name: "Victoria Island Charge",
    operator: "VoltAfrica",
    area: "Victoria Island",
    city: "Lagos",
    address: "Adeola Odeku Street, VI, Lagos",
    location: { lat: 6.4281, lng: 3.4219 },
    connectors: [
      { connectorId: "1", type: "CCS", powerKw: "100", status: "occupied" },
      { connectorId: "2", type: "CHAdeMO", powerKw: "50", status: "available" },
      { connectorId: "3", type: "Type2", powerKw: "22", status: "available" }
    ],
    status: "active",
    availableConnectors: "2",
    totalConnectors: "3",
    waitTimeMinutes: "0",
    totalSessions24h: "22",
    rating: "4.8"
  },
  {
    stationId: "st-003",
    name: "Wuse 2 EV Hub",
    operator: "SwiftEV Nigeria",
    area: "Wuse 2",
    city: "Abuja",
    address: "Aminu Kano Crescent, Wuse 2, Abuja",
    location: { lat: 9.0580, lng: 7.4891 },
    connectors: [
      { connectorId: "1", type: "CCS", powerKw: "150", status: "available" },
      { connectorId: "2", type: "Type2", powerKw: "22", status: "offline" }
    ],
    status: "active",
    availableConnectors: "1",
    totalConnectors: "2",
    waitTimeMinutes: "0",
    totalSessions24h: "9",
    rating: "4.2"
  }
];

export default MOCK_STATIONS;
