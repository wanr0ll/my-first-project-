// Mock Data for GHA Asset Management System (Head Office - Accra)

// Assets Data
export const vehicles = [
  { id: "V001", name: "Toyota Coaster Bus", type: "Bus", plate: "GV 123-24", status: "Active", division: "Transport", lastService: "2024-01-15", approvalStatus: "Approved", history: [{ date: "2024-01-15", action: "System Migration", user: "Admin" }] },
  { id: "V002", name: "Nissan Navara Pickup", type: "Pickup", plate: "GV 456-23", status: "Active", division: "Maintenance", lastService: "2023-11-20", approvalStatus: "Approved", history: [{ date: "2023-11-20", action: "System Migration", user: "Admin" }] },
  { id: "V003", name: "Land Cruiser V8", type: "V8", plate: "GV 001-25", status: "Active", division: "Executive", lastService: "2024-02-01", approvalStatus: "Approved", history: [{ date: "2024-02-01", action: "System Migration", user: "Admin" }] },
  { id: "V004", name: "Toyota Hilux", type: "Pickup", plate: "GV 789-22", status: "Maintenance", division: "General Services", lastService: "2023-12-10", approvalStatus: "Approved", history: [{ date: "2023-12-10", action: "System Migration", user: "Admin" }] },
  { id: "V005", name: "Isuzu NPR Bus", type: "Bus", plate: "GV 101-24", status: "Active", division: "Transport", lastService: "2024-01-05", approvalStatus: "Approved", history: [{ date: "2024-01-05", action: "System Migration", user: "Admin" }] },
];

export const furniture = [
  { id: "F001", name: "Ergonomic Office Chair", division: "Human Resources", quantity: 15, asset_condition: "Good", status: "Good", approvalStatus: "Approved", history: [{ date: "2024-01-20", action: "Audit Entry", user: "Admin" }] },
  { id: "F002", name: "Executive Mahogany Table", division: "Executive", quantity: 2, asset_condition: "Good", status: "Good", approvalStatus: "Approved", history: [{ date: "2024-01-20", action: "Audit Entry", user: "Admin" }] },
  { id: "F003", name: "3-Seater Leather Sofa", division: "Main Lobby", quantity: 4, asset_condition: "Fair", status: "Fair", approvalStatus: "Approved", history: [{ date: "2024-01-20", action: "Audit Entry", user: "Admin" }] },
  { id: "F004", name: "Reception Desk", division: "Reception", quantity: 1, asset_condition: "Good", status: "Good", approvalStatus: "Approved", history: [{ date: "2024-01-20", action: "Audit Entry", user: "Admin" }] },
  { id: "F005", name: "Conference Room Table", division: "Board Room", quantity: 1, asset_condition: "Good", status: "Good", approvalStatus: "Approved", history: [{ date: "2024-01-20", action: "Audit Entry", user: "Admin" }] },
];

export const electronics = [
  { id: "E001", name: "HP EliteBook Laptop", serial: "SN-554433", assignedTo: "John Doe", status: "Active", division: "Finance", approvalStatus: "Approved", history: [{ date: "2024-01-25", action: "Asset Tagged", user: "IT Chief" }] },
  { id: "E002", name: "Dell OptiPlex Desktop", serial: "SN-887766", assignedTo: "Sarah Smith", status: "Active", division: "IT", approvalStatus: "Approved", history: [{ date: "2024-01-25", action: "Asset Tagged", user: "IT Chief" }] },
  { id: "E003", name: "Logitech Keyboard & Mouse", serial: "N/A", assignedTo: "Shared", status: "Active", division: "HR", approvalStatus: "Approved", history: [{ date: "2024-01-25", action: "Asset Tagged", user: "IT Chief" }] },
  { id: "E004", name: "HP LaserJet Printer", serial: "PR-223344", assignedTo: "Shared", status: "Maintenance", division: "Administration", approvalStatus: "Approved", history: [{ date: "2024-01-25", action: "Asset Tagged", user: "IT Chief" }] },
  { id: "E005", name: "Samsung 27\" Monitor", serial: "MN-990011", assignedTo: "Kwame Gerd", status: "Active", division: "IT", approvalStatus: "Approved", history: [{ date: "2024-01-25", action: "Asset Tagged", user: "IT Chief" }] },
];

export const indoorDevices = [
  { id: "I001", name: "Carrier Split AC", location: "Server Room", status: "Active", lastService: "2024-01-10", division: "Maintenance", approvalStatus: "Approved", history: [{ date: "2024-01-10", action: "Service Verified", user: "Maintenance Chief" }] },
  { id: "I002", name: "LG Double Door Fridge", location: "Staff Kitchen", status: "Active", lastService: "2023-06-15", division: "Administration", approvalStatus: "Approved", history: [{ date: "2023-06-15", action: "Procured", user: "Admin Chief" }] },
  { id: "I003", name: "Steel Filing Cabinet", location: "Archives", status: "Good", lastService: "N/A", division: "Administration", approvalStatus: "Approved", history: [{ date: "2023-12-01", action: "Audit Entry", user: "Admin Chief" }] },
  { id: "I004", name: "Samsung Microwave", location: "Canteen", status: "Failure", lastService: "2023-09-20", division: "Administration", approvalStatus: "Approved", history: [{ date: "2023-09-20", action: "Reported", user: "Staff" }] },
  { id: "I005", name: "Water Dispenser", location: "Operations", status: "Active", lastService: "2024-02-15", division: "Administration", approvalStatus: "Approved", history: [{ date: "2024-02-15", action: "Installed", user: "Admin Chief" }] },
];

// Re-export as roads/bridges/equipment to prevent initial break, then update pages
export const roads = vehicles;
export const bridges = furniture;
export const equipment = electronics;

// Dashboard Stats
export const stats = {
  totalAssets: 142,
  activeVehicles: 28,
  maintenanceTasks: 12,
  equipmentHealth: 94,
  budgetSpent: 450000,
  activeProjects: 5,
  equipmentAvailable: 96
};

stats.budgetSpent = 68000;

export const recentActivity = [
  { id: 1, type: "maintenance", asset: "GV 123-24 (Toyota Coaster)", status: "completed", date: "2024-03-15", desc: "Oil change and brake pad replacement." },
  { id: 2, type: "repair", asset: "Samsung Microwave", status: "warning", date: "2024-03-14", desc: "Heating element issue reported." },
  { id: 3, type: "deployment", asset: "HP EliteBook (SN-554433)", status: "completed", date: "2024-03-12", desc: "Assigned to new Finance Manager." },
  { id: 4, type: "service", asset: "Server Room AC", status: "ongoing", date: "2024-03-10", desc: "Regular dry and wet cleaning." },
];

export const maintenanceTasks = [
  { id: "M001", asset: "GV 123-24", type: "Vehicle Service", status: "Scheduled", date: "2024-04-10", priority: "High", assignedTo: "Head Office Garage" },
  { id: "M002", asset: "Server Room AC", type: "Gas Refill", status: "In Progress", date: "2024-03-22", priority: "Critical", assignedTo: "Cooling Experts" },
  { id: "M003", asset: "Executive Floor Fridge", type: "General Cleaning", status: "Completed", date: "2024-03-15", priority: "Medium", assignedTo: "Janitorial Team" },
  { id: "M004", asset: "SN-223344 (Printer)", type: "Toner Replacement", status: "Overdue", date: "2024-03-01", priority: "High", assignedTo: "IT Support" },
  { id: "M005", asset: "Executive Sofa", type: "Leather Polish", status: "Scheduled", date: "2024-04-05", priority: "Low", assignedTo: "Maintenance" },
];

export const divisionDistribution = [
  { name: 'Transport', value: 25 },
  { name: 'IT', value: 20 },
  { name: 'Finance', value: 15 },
  { name: 'HR', value: 15 },
  { name: 'Administration', value: 25 },
];

export const costTrends = [
  { month: 'Sep', labor: 12000, material: 8000 },
  { month: 'Oct', labor: 15000, material: 9500 },
  { month: 'Nov', labor: 11000, material: 7000 },
  { month: 'Dec', labor: 18000, material: 12000 },
  { month: 'Jan', labor: 14000, material: 8500 },
  { month: 'Feb', labor: 16500, material: 10000 }
];

// Keep project structure if necessary for components but update themes
export const projects = [
  {
    id: 'PRJ001',
    name: 'Office Digitization',
    description: 'Scanning and archiving all physical files in the HR and Finance divisions.',
    status: 'In Progress',
    priority: 'High',
    budget: 50000,
    spent: 12000,
    progress: 24,
    region: 'Accra Head Office',
    manager: 'Kwame Gerd',
    startDate: '2024-02-15',
    endDate: '2024-06-20',
    team: 8
  },
  {
    id: 'PRJ002',
    name: 'Fleet Modernization',
    description: 'Replacing aged Pickup vehicles with newer fuel-efficient models.',
    status: 'Planning',
    priority: 'Medium',
    budget: 250000,
    spent: 0,
    progress: 0,
    region: 'Accra Head Office',
    manager: 'Abena Osei',
    startDate: '2024-05-01',
    endDate: '2024-12-30',
    team: 4
  }
];

export const notifications = [
  {
    id: 'NOT001',
    type: 'critical',
    title: 'AC Failure',
    message: 'Server Room AC (I001) has stopped cooling. Immediate action required.',
    timestamp: '2024-03-20T10:30:00',
    read: false,
    link: '/assets'
  },
  {
    id: 'NOT002',
    type: 'warning',
    title: 'Service Due',
    message: 'Vehicle GV 456-23 is due for routine service in 3 days.',
    timestamp: '2024-03-19T09:15:00',
    read: false,
    link: '/maintenance'
  }
];
