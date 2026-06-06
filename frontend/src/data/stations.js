export const stations = [
  {
    stationId: 'st-001', name: 'GreenCharge Victoria Island', address: '12 Adeola Odeku Street, Victoria Island, Lagos',
    lat: 6.4281, lng: 3.4219, city: 'Lagos', area: 'Victoria Island', operatorName: 'GreenCharge NG',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c2', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c4', type: 'CCS2', power: 150, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 4, availablePorts: 3, rating: 4.8,
    lastUpdated: '2025-06-06T13:15:00Z', totalSessions: 187, utilizationPercent: 78
  },
  {
    stationId: 'st-002', name: 'VoltDrive Adeola Hopewell', address: '34 Adeola Hopewell Street, Victoria Island, Lagos',
    lat: 6.4315, lng: 3.4185, city: 'Lagos', area: 'Victoria Island', operatorName: 'VoltDrive Lagos',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'IN_USE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c3', type: 'Type 2', power: 7, status: 'AVAILABLE' }
    ],
    status: 'IN_USE', waitMinutes: 12, totalPorts: 3, availablePorts: 1, rating: 4.3,
    lastUpdated: '2025-06-06T13:10:00Z', totalSessions: 132, utilizationPercent: 85
  },
  {
    stationId: 'st-003', name: 'EcoPlug Sanusi Fafunwa', address: '8 Sanusi Fafunwa Street, Victoria Island, Lagos',
    lat: 6.4260, lng: 3.4240, city: 'Lagos', area: 'Victoria Island', operatorName: 'EcoPlug Nigeria',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 2, availablePorts: 2, rating: 4.5,
    lastUpdated: '2025-06-06T13:20:00Z', totalSessions: 98, utilizationPercent: 62
  },
  {
    stationId: 'st-004', name: 'PowerGrid Lekki Phase 1', address: '15 Admiralty Way, Lekki Phase 1, Lagos',
    lat: 6.4480, lng: 3.4730, city: 'Lagos', area: 'Lekki', operatorName: 'PowerGrid NG',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c2', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c3', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' },
      { id: 'c4', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c5', type: 'Type 2', power: 22, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 5, availablePorts: 4, rating: 4.9,
    lastUpdated: '2025-06-06T13:05:00Z', totalSessions: 210, utilizationPercent: 88
  },
  {
    stationId: 'st-005', name: 'NaijaCharge Lekki-Epe', address: '42 Lekki-Epe Expressway, Lekki, Lagos',
    lat: 6.4510, lng: 3.4810, city: 'Lagos', area: 'Lekki', operatorName: 'NaijaCharge',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'IN_USE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c3', type: 'Type 2', power: 7, status: 'IN_USE' }
    ],
    status: 'IN_USE', waitMinutes: 18, totalPorts: 3, availablePorts: 0, rating: 4.1,
    lastUpdated: '2025-06-06T12:50:00Z', totalSessions: 156, utilizationPercent: 92
  },
  {
    stationId: 'st-006', name: 'EVConnect Chevron', address: '1 Chevron Drive, Lekki, Lagos',
    lat: 6.4395, lng: 3.4690, city: 'Lagos', area: 'Lekki', operatorName: 'EVConnect Nigeria',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'OFFLINE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'OFFLINE' }
    ],
    status: 'OFFLINE', waitMinutes: null, totalPorts: 2, availablePorts: 0, rating: 3.8,
    lastUpdated: '2025-06-06T08:00:00Z', totalSessions: 67, utilizationPercent: 34
  },
  {
    stationId: 'st-007', name: 'GreenCharge Ikeja City Mall', address: 'Obafemi Awolowo Way, Ikeja, Lagos',
    lat: 6.6018, lng: 3.3415, city: 'Lagos', area: 'Ikeja', operatorName: 'GreenCharge NG',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c4', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c5', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c6', type: 'Type 2', power: 7, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 6, availablePorts: 5, rating: 4.7,
    lastUpdated: '2025-06-06T13:18:00Z', totalSessions: 245, utilizationPercent: 81
  },
  {
    stationId: 'st-008', name: 'WattStation Allen Avenue', address: '23 Allen Avenue, Ikeja, Lagos',
    lat: 6.5975, lng: 3.3520, city: 'Lagos', area: 'Ikeja', operatorName: 'WattStation NG',
    connectors: [
      { id: 'c1', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'IN_USE' }
    ],
    status: 'IN_USE', waitMinutes: 8, totalPorts: 2, availablePorts: 0, rating: 4.0,
    lastUpdated: '2025-06-06T13:00:00Z', totalSessions: 89, utilizationPercent: 76
  },
  {
    stationId: 'st-009', name: 'VoltDrive Computer Village', address: 'Otigba Street, Computer Village, Ikeja, Lagos',
    lat: 6.6070, lng: 3.3455, city: 'Lagos', area: 'Ikeja', operatorName: 'VoltDrive Lagos',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'MAINTENANCE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'MAINTENANCE' },
      { id: 'c3', type: 'CHAdeMO', power: 50, status: 'MAINTENANCE' }
    ],
    status: 'MAINTENANCE', waitMinutes: null, totalPorts: 3, availablePorts: 0, rating: 4.2,
    lastUpdated: '2025-06-06T07:30:00Z', totalSessions: 110, utilizationPercent: 55
  },
  {
    stationId: 'st-010', name: 'EcoPlug Ikoyi Club', address: '6 Ikoyi Club Road, Ikoyi, Lagos',
    lat: 6.4495, lng: 3.4370, city: 'Lagos', area: 'Ikoyi', operatorName: 'EcoPlug Nigeria',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c2', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c4', type: 'Type 2', power: 22, status: 'IN_USE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 4, availablePorts: 3, rating: 4.6,
    lastUpdated: '2025-06-06T13:12:00Z', totalSessions: 178, utilizationPercent: 71
  },
  {
    stationId: 'st-011', name: 'NaijaCharge Bourdillon', address: '18 Bourdillon Road, Ikoyi, Lagos',
    lat: 6.4520, lng: 3.4310, city: 'Lagos', area: 'Ikoyi', operatorName: 'NaijaCharge',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'IN_USE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'AVAILABLE' }
    ],
    status: 'IN_USE', waitMinutes: 15, totalPorts: 2, availablePorts: 1, rating: 4.4,
    lastUpdated: '2025-06-06T12:55:00Z', totalSessions: 121, utilizationPercent: 80
  },
  {
    stationId: 'st-012', name: 'PowerGrid Surulere Stadium', address: 'Funsho Williams Avenue, Surulere, Lagos',
    lat: 6.4920, lng: 3.3505, city: 'Lagos', area: 'Surulere', operatorName: 'PowerGrid NG',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 7, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 3, availablePorts: 3, rating: 4.3,
    lastUpdated: '2025-06-06T13:08:00Z', totalSessions: 95, utilizationPercent: 58
  },
  {
    stationId: 'st-013', name: 'GreenCharge Adeniran Ogunsanya', address: '45 Adeniran Ogunsanya Street, Surulere, Lagos',
    lat: 6.4960, lng: 3.3560, city: 'Lagos', area: 'Surulere', operatorName: 'GreenCharge NG',
    connectors: [
      { id: 'c1', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c2', type: 'Type 2', power: 7, status: 'AVAILABLE' }
    ],
    status: 'IN_USE', waitMinutes: 10, totalPorts: 2, availablePorts: 1, rating: 4.1,
    lastUpdated: '2025-06-06T13:02:00Z', totalSessions: 73, utilizationPercent: 65
  },
  {
    stationId: 'st-014', name: 'EVConnect Yaba Tech', address: 'Herbert Macaulay Way, Yaba, Lagos',
    lat: 6.5170, lng: 3.3750, city: 'Lagos', area: 'Yaba', operatorName: 'EVConnect Nigeria',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c4', type: 'Type 2', power: 7, status: 'IN_USE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 4, availablePorts: 3, rating: 4.5,
    lastUpdated: '2025-06-06T13:14:00Z', totalSessions: 162, utilizationPercent: 74
  },
  {
    stationId: 'st-015', name: 'WattStation Tejuosho', address: '21 Ojuelegba Road, Yaba, Lagos',
    lat: 6.5135, lng: 3.3690, city: 'Lagos', area: 'Yaba', operatorName: 'WattStation NG',
    connectors: [
      { id: 'c1', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 2, availablePorts: 2, rating: 3.9,
    lastUpdated: '2025-06-06T12:45:00Z', totalSessions: 54, utilizationPercent: 42
  },
  {
    stationId: 'st-016', name: 'NaijaCharge Ajah Junction', address: 'Abraham Adesanya Roundabout, Ajah, Lagos',
    lat: 6.4675, lng: 3.5710, city: 'Lagos', area: 'Ajah', operatorName: 'NaijaCharge',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c3', type: 'Type 2', power: 7, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 3, availablePorts: 2, rating: 4.2,
    lastUpdated: '2025-06-06T12:58:00Z', totalSessions: 88, utilizationPercent: 60
  },
  {
    stationId: 'st-017', name: 'VoltDrive Sangotedo', address: 'Lekki-Epe Expressway, Sangotedo, Ajah, Lagos',
    lat: 6.4630, lng: 3.5650, city: 'Lagos', area: 'Ajah', operatorName: 'VoltDrive Lagos',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 150, status: 'IN_USE' },
      { id: 'c2', type: 'CCS2', power: 50, status: 'IN_USE' }
    ],
    status: 'IN_USE', waitMinutes: 22, totalPorts: 2, availablePorts: 0, rating: 4.0,
    lastUpdated: '2025-06-06T12:40:00Z', totalSessions: 71, utilizationPercent: 83
  },
  {
    stationId: 'st-018', name: 'PowerGrid Apapa Wharf', address: 'Wharf Road, Apapa, Lagos',
    lat: 6.4490, lng: 3.3590, city: 'Lagos', area: 'Apapa', operatorName: 'PowerGrid NG',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c4', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c5', type: 'CCS2', power: 150, status: 'OFFLINE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 5, availablePorts: 4, rating: 3.7,
    lastUpdated: '2025-06-06T11:30:00Z', totalSessions: 43, utilizationPercent: 31
  },
  {
    stationId: 'st-019', name: 'EcoPlug Maryland Mall', address: 'Ikorodu Road, Maryland, Lagos',
    lat: 6.5710, lng: 3.3680, city: 'Lagos', area: 'Maryland', operatorName: 'EcoPlug Nigeria',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'IN_USE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'IN_USE' }
    ],
    status: 'IN_USE', waitMinutes: 14, totalPorts: 3, availablePorts: 0, rating: 4.4,
    lastUpdated: '2025-06-06T13:16:00Z', totalSessions: 198, utilizationPercent: 90
  },
  {
    stationId: 'st-020', name: 'GreenCharge Gbagada Phase 2', address: 'Diya Street, Gbagada Phase 2, Lagos',
    lat: 6.5530, lng: 3.3930, city: 'Lagos', area: 'Gbagada', operatorName: 'GreenCharge NG',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 2, availablePorts: 2, rating: 4.3,
    lastUpdated: '2025-06-06T13:11:00Z', totalSessions: 76, utilizationPercent: 52
  },
  {
    stationId: 'st-021', name: 'WattStation Festac Town', address: '22 Road, Festac Town, Lagos',
    lat: 6.4650, lng: 3.2830, city: 'Lagos', area: 'Festac', operatorName: 'WattStation NG',
    connectors: [
      { id: 'c1', type: 'Type 2', power: 22, status: 'MAINTENANCE' },
      { id: 'c2', type: 'Type 2', power: 7, status: 'MAINTENANCE' },
      { id: 'c3', type: 'CCS2', power: 50, status: 'MAINTENANCE' }
    ],
    status: 'MAINTENANCE', waitMinutes: null, totalPorts: 3, availablePorts: 0, rating: 3.5,
    lastUpdated: '2025-06-06T06:00:00Z', totalSessions: 38, utilizationPercent: 28
  },
  {
    stationId: 'st-022', name: 'NaijaCharge Magodo Brooks', address: 'CMD Road, Magodo, Lagos',
    lat: 6.6250, lng: 3.3950, city: 'Lagos', area: 'Magodo', operatorName: 'NaijaCharge',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 7, status: 'IN_USE' },
      { id: 'c4', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 4, availablePorts: 3, rating: 4.6,
    lastUpdated: '2025-06-06T13:19:00Z', totalSessions: 134, utilizationPercent: 69
  },
  {
    stationId: 'st-023', name: 'ChargePro Wuse Market', address: 'Wuse Market Road, Wuse Zone 5, Abuja',
    lat: 9.0725, lng: 7.4910, city: 'Abuja', area: 'Wuse', operatorName: 'ChargePro Abuja',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c2', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c3', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' },
      { id: 'c4', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c5', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c6', type: 'Type 2', power: 7, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 6, availablePorts: 5, rating: 4.8,
    lastUpdated: '2025-06-06T13:17:00Z', totalSessions: 220, utilizationPercent: 82
  },
  {
    stationId: 'st-024', name: 'EVConnect Wuse 2', address: 'Aminu Kano Crescent, Wuse 2, Abuja',
    lat: 9.0760, lng: 7.4880, city: 'Abuja', area: 'Wuse', operatorName: 'EVConnect Nigeria',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'IN_USE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'IN_USE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'IN_USE' }
    ],
    status: 'IN_USE', waitMinutes: 20, totalPorts: 3, availablePorts: 0, rating: 4.2,
    lastUpdated: '2025-06-06T12:48:00Z', totalSessions: 165, utilizationPercent: 91
  },
  {
    stationId: 'st-025', name: 'GreenCharge Maitama Hills', address: '14 Amazon Street, Maitama, Abuja',
    lat: 9.0835, lng: 7.4955, city: 'Abuja', area: 'Maitama', operatorName: 'GreenCharge NG',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c2', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c4', type: 'CHAdeMO', power: 50, status: 'IN_USE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 4, availablePorts: 3, rating: 4.7,
    lastUpdated: '2025-06-06T13:13:00Z', totalSessions: 192, utilizationPercent: 75
  },
  {
    stationId: 'st-026', name: 'PowerGrid Maitama Diplomatic', address: 'Diplomatic Drive, Maitama, Abuja',
    lat: 9.0810, lng: 7.5020, city: 'Abuja', area: 'Maitama', operatorName: 'PowerGrid NG',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'OFFLINE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'OFFLINE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'OFFLINE' }
    ],
    status: 'OFFLINE', waitMinutes: null, totalPorts: 3, availablePorts: 0, rating: 3.6,
    lastUpdated: '2025-06-06T09:15:00Z', totalSessions: 58, utilizationPercent: 37
  },
  {
    stationId: 'st-027', name: 'ChargePro Garki Area 11', address: 'Area 11, Garki, Abuja',
    lat: 9.0380, lng: 7.4880, city: 'Abuja', area: 'Garki', operatorName: 'ChargePro Abuja',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c3', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' },
      { id: 'c4', type: 'Type 2', power: 7, status: 'IN_USE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 4, availablePorts: 3, rating: 4.4,
    lastUpdated: '2025-06-06T13:09:00Z', totalSessions: 143, utilizationPercent: 68
  },
  {
    stationId: 'st-028', name: 'VoltDrive Asokoro Village', address: 'Asokoro District, Abuja',
    lat: 9.0420, lng: 7.5250, city: 'Abuja', area: 'Asokoro', operatorName: 'VoltDrive Lagos',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 150, status: 'IN_USE' },
      { id: 'c2', type: 'CCS2', power: 150, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'AVAILABLE' }
    ],
    status: 'IN_USE', waitMinutes: 7, totalPorts: 3, availablePorts: 2, rating: 4.5,
    lastUpdated: '2025-06-06T13:04:00Z', totalSessions: 115, utilizationPercent: 73
  },
  {
    stationId: 'st-029', name: 'EcoPlug Central Area', address: 'Constitution Avenue, Central Area, Abuja',
    lat: 9.0580, lng: 7.4890, city: 'Abuja', area: 'Central Area', operatorName: 'EcoPlug Nigeria',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c4', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c5', type: 'CCS2', power: 150, status: 'IN_USE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 5, availablePorts: 4, rating: 4.6,
    lastUpdated: '2025-06-06T13:21:00Z', totalSessions: 175, utilizationPercent: 70
  },
  {
    stationId: 'st-030', name: 'NaijaCharge Gwarinpa Estate', address: '3rd Avenue, Gwarinpa Estate, Abuja',
    lat: 9.1070, lng: 7.4110, city: 'Abuja', area: 'Gwarinpa', operatorName: 'NaijaCharge',
    connectors: [
      { id: 'c1', type: 'CCS2', power: 50, status: 'AVAILABLE' },
      { id: 'c2', type: 'Type 2', power: 22, status: 'AVAILABLE' },
      { id: 'c3', type: 'Type 2', power: 7, status: 'AVAILABLE' },
      { id: 'c4', type: 'CHAdeMO', power: 50, status: 'AVAILABLE' }
    ],
    status: 'AVAILABLE', waitMinutes: 0, totalPorts: 4, availablePorts: 4, rating: 4.3,
    lastUpdated: '2025-06-06T13:07:00Z', totalSessions: 82, utilizationPercent: 48
  }
];

export default stations;
