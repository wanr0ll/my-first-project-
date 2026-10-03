import React, { useState, useEffect, useRef } from 'react';
import { Plus, AlertCircle, Check, Trash2, Layout, Monitor, HardDrive, Smartphone, Zap, Settings, Database, Lamp, Briefcase, Table, PanelTop, MousePointerClick, ScanLine, Upload, Camera, FileText, X, Eye } from 'lucide-react';
import Modal from './Modal';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../context/AssetContext';
import { calculateDepreciation } from '../utils/depreciation';
import { getDefaultImage, getSaloonModelImage, getSUVModelImage, getPickupModelImage, getVanModelImage, getBusModelImage } from '../utils/assetImages';
import { uploadAssetReceipt } from '../services/api';

const SUB_CATEGORIES = {
    'Land and Buildings': [
        'Office Land and Premises',
        'Administrative Office Buildings',
        'Departmental and Sectional Blocks',
        'Warehouses and Storage Facilities',
        'Parking Lot',
        'Service Centers',
        'Hotels/Guest Houses',
        'Staff Quarters',
        'Staff Canteens',
        'Roads',
        'Bridges',
        'Interchanges',
        'Others'
    ],
    'Installed Infrastructure & Utility System': [
        'Plumbing System',
        'CCTV',
        'Traffic Lights',
        'Access Control Systems',
        'Elevators / Lifts',
        'Fire Detection and Alarm System',
        'Air conditioning Systems',
        'Fans',
        'Electrical Wiring and Installation'
    ],
    'Plant and Machinery': [
        'Power Generators',
        'Others'
    ],
    'Fleet': [
        'Saloon Cars', 'SUV', 'Van', 'Pick-up', 'Buses'
    ],
    'Furniture and Office Equipment': [
        'Office Desk', 'Chair', 'Workstations', 'Office Partition and Fitting'
    ],
    'ICT Asset': [
        'Computers', 'Network Equipment', 'Printers', 'Scanners', 'Photocopier'
    ],
    'Intangible Fixed Assets': [
        'Asset Management Software', 'Enterprise Systems', 'Software license', 'Database and Proprietary Systems'
    ],
    'Office Consumables': [
        'Printing Papers', 'Toner and ink Cartridges', 'Stationery items'
    ],
    'IT and Technical Consumables': [
        'USB / Flash Drives', 'External Hard Drives', 'Network Cables',
        'Power Cables / Adapters', 'UPS Batteries', 'Wireless Peripherals',
        'RAM / Memory Modules', 'Others'
    ],
    'Maintenance and Workshop Supplies': [
        'Spare Parts for Machinery', 'Lubricants and Oil',
        'Hand Tools', 'Power Tools', 'Fasteners / Fixings',
        'Cleaning Supplies', 'Others'
    ],
    'Fuel and Energy Supplies': [
        'Petrol', 'Diesel', 'Liquefied Gas (LPG)',
        'Lubricating Grease', 'Engine Oil', 'Others'
    ],
    'Safety and Productive Equipment': [
        'Helmet / Hard Hat', 'Reflective Jacket / Vest', 'Safety Gloves',
        'Safety Boots / Footwear', 'Protective Wear / Coveralls',
        'Eye and Face Protection', 'Respiratory Protection',
        'Fall Protection / Harness', 'Fire Extinguisher', 'First Aid Kit', 'Others'
    ],
    'Utility Equipment': [
        'Power Backup / UPS',
        'Solar Power System',
        'Refrigerator',
        'Microwave',
        'Kettle',
        'Public Address System',
        'Display System',
        'Fire Suppression System',
        'Others'
    ]
};

const CATEGORY_HIERARCHY = {
    'Fixed Asset': {
        'Moveable': [
            'Plant and Machinery',
            'Fleet',
            'Furniture and Office Equipment',
            'ICT Asset',
            'Utility Equipment',
            'Intangible Fixed Assets'
        ],
        'Non Moveable': [
            'Land and Buildings',
            'Installed Infrastructure & Utility System'
        ]
    },
    'Non Fixed Asset': {
        'General': [
            'Cash and bank balance',
            'Office Consumables',
            'Safety and Productive Equipment',
            'Maintenance and Workshop Supplies',
            'Fuel and Energy Supplies',
            'IT and Technical Consumables'
        ]
    }
};



const DIVISIONS = [
    'Chief Executive', 'Deputy Chief Executive Admin', 'Deputy Chief Executive Dev', 'Deputy Chief Executive Mtce',
    'Legal Services', 'HR', 'Finance', 'Public Affairs', 'Training & Dev',
    'MIS', 'Contracts', 'Survey & Design', 'Materials', 'Bridges',
    'Planning', 'Road Safety & Environment', 'Quantity Surveying',
    'Road Maintenance', 'Plant & Equipment', 'Audit'
];

const DESK_TYPES = [
    'Executive Desk',
    'Computer Desk',
    'L-Shaped Desk',
    'Sit Stand (Height-Adjustable) Desk',
    'Writing/Laptop Desk',
    'Reception Desk',
    'Bench Desk',
    'Wall-Mounted/Floating Desk',
    'Conner Desk',
    'Drafting/Art Table',
    'Secretary Desk'
];

const CHAIR_TYPES = [
    'Executive Chair',
    'Task / Office Chair',
    'Guest / Visitor Chair',
    'Conference Chair',
    'Ergonomic Chair',
    'Gaming Chair',
    'Stacking Chair',
    'Folding Chair',
    'Bar Stool',
    'Others'
];

const CHAIR_MATERIALS = [
    'Fabric',
    'Mesh',
    'Leather',
    'Faux Leather',
    'Plastic',
    'Wood',
    'Metal',
    'Others'
];

const WORKSTATION_TYPES = [
    'L-Shaped Workstation',
    'U-Shaped Workstation',
    'Straight / Linear Workstation',
    'Corner Workstation',
    'Cubicle Workstation',
    'Open-Plan Workstation',
    'Back-to-Back Workstation',
    'Others'
];

const WORKSTATION_MATERIALS = [
    'Laminate / MDF',
    'Solid Wood',
    'Metal Frame',
    'Glass Top',
    'Chipboard',
    'Others'
];

const PARTITION_TYPES = [
    'Floor-to-Ceiling Partition',
    'Half-Height Panel',
    'Glass Partition',
    'Acoustic Panel',
    'Cubicle Panel',
    'Folding / Moveable Partition',
    'Others'
];

const PARTITION_MATERIALS = [
    'Glass',
    'Fabric / Soft-Board',
    'Wood / MDF',
    'Metal Frame',
    'Polycarbonate',
    'Gypsum Board',
    'Others'
];

const LOCATIONS = [
    'Head Office, Accra'
];

const BUS_TYPES = [
    'Small Bus',
    'Medium Bus',
    'Large Bus'
];

const VAN_BRANDS = [
    'Iveco',
    'Ford',
    'Mercedes-Benz',
    'MAN',
    'Others'
];

const VAN_MODELS = {
    'Iveco': ['Iveco Daily', 'Others'],
    'Ford': ['Ford Transit', 'Others'],
    'Mercedes-Benz': ['Sprinter Van', 'Others'],
    'MAN': ['MAN TGE Van']
};

const BUS_BRANDS = [
    'Toyota',
    'Nissan',
    'Others'
];

const BUS_MODELS = {
    'Toyota': ['Hiace', 'Coaster bus', 'Others'],
    'Nissan': ['Civillian', 'Caravan', 'Others']
};

const PROCESSORS = [
    'Intel Pentium',
    'Intel Celeron',
    'Intel Core i3',
    'Intel Core i5',
    'Intel Core i7',
    'Intel Core i9',
    'Intel Core Ultra 5',
    'Intel Core Ultra 7',
    'Intel Core Ultra 9',
    'AMD Ryzen 3',
    'AMD Ryzen 5',
    'AMD Ryzen 7',
    'AMD Ryzen 9',
    'Athlon',
    'Threadripper',
    'M1',
    'M1 Pro',
    'M1 Max',
    'M1 Ultra',
    'M2',
    'M2 Pro',
    'M2 Max',
    'M2 Ultra',
    'M3 / M3 Pro / M3 Max',
    'FX Series',
    'A-Series (APUs)',
    'Others'
];

const COMPUTER_TYPES = [
    'All-In-One Computer',
    'Desktop',
    'Laptop',
    'Others'
];

const COMPUTER_BRANDS = [
    'HP',
    'Dell',
    'Lenovo',
    'Microsoft',
    'Samsung',
    'Acer',
    'ASUS',
    'Fujitsu',
    'Alienware',
    'LG',
    'MSI',
    'Razer',
    'Panasonic',
    'Others'
];

const MEMORY_SIZES = [
    '2G',
    '4G',
    '8G',
    '16G',
    '32G',
    '64G',
    '128G'
];

const COMPUTER_MODELS = {
    'HP': ['Pavilion', 'Envy', 'Spectre', 'EliteBook', 'ProBook', 'HP Desktop / Pavilion Desktop', 'EliteDesk', 'ProDesk', 'Omen', 'Others'],
    'Dell': ['Latitude', 'Inspiron', 'XPS', 'Vostro', 'Precision', 'Alienware', 'G-Series', 'Others'],
    'Lenovo': ['ThinkPad', 'IdeaPad', 'Legion', 'Yoga', 'ThinkBook', 'ThinkCentre', 'Others'],
    'Microsoft': ['Surface Pro', 'Surface Laptop', 'Surface Book', 'Surface Go', 'Surface Studio', 'Others'],
    'Samsung': ['Galaxy Book', 'Odyssey', 'Galaxy Tab S (Laptops)', 'Galaxy Chromebook', 'Others'],
    'Acer': ['Aspire', 'Swift', 'Spin', 'Predator', 'Nitro', 'TravelMate', 'Others'],
    'ASUS': ['Zenbook', 'Vivobook', 'ROG', 'TUF Gaming', 'ProArt', 'ExpertBook', 'Others'],
    'Fujitsu': ['Lifebook', 'Celsius', 'Esprimo', 'Others'],
    'Alienware': ['x14', 'x15', 'x17', 'm15', 'm17', 'Aurora', 'Others'],
    'LG': ['Gram', 'UltraPC', 'Others'],
    'MSI': ['Stealth', 'Raider', 'Katana', 'Prestige', 'Modern', 'Creator', 'Others'],
    'Razer': ['Blade 14', 'Blade 15', 'Blade 16', 'Blade 17', 'Blade Stealth', 'Others'],
    'Panasonic': ['Toughbook', 'Toughpad', 'Others']
};

const GENERATIONS = [
    '2nd Gen', '3rd Gen', '4th Gen', '5th Gen', '6th Gen', '7th Gen', '8th Gen',
    '9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen', '15th Gen'
];

const STORAGE_SIZES = [
    '128GB SSD', '256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '4TB SSD',
    '320GB HDD', '500GB HDD', '1TB HDD', '2TB HDD', '4TB HDD',
    '256GB SSD + 1TB HDD', '512GB SSD + 1TB HDD', '512GB SSD + 2TB HDD',
    'Others'
];

const NETWORK_BRANDS = [
    'Cisco', 'Ubiquiti', 'TP-Link', 'MikroTik', 'Netgear', 'D-Link', 'Juniper', 'Fortinet', 'Palo Alto', 'Sophos', 'Aruba', 'Others'
];

const NETWORK_MODELS = {
    'Cisco': ['Catalyst Series', 'Nexus Series', 'Meraki', 'ISR Series', 'Others'],
    'Ubiquiti': ['UniFi Security Gateway', 'UniFi Switch', 'UniFi AP', 'EdgeRouter', 'Others'],
    'TP-Link': ['Omada', 'Deco', 'Archer', 'SafeStream', 'Others'],
    'MikroTik': ['RouterBOARD', 'Cloud Core Router', 'Cloud Smart Switch', 'Others'],
    'Netgear': ['Nighthawk', 'ProSAFE', 'Insight', 'Orbi', 'Others'],
    'D-Link': ['DES Series', 'DGS Series', 'DIR Series', 'Others'],
    'Juniper': ['EX Series', 'SRX Series', 'MX Series', 'Others'],
    'Fortinet': ['FortiGate', 'FortiSwitch', 'FortiAP', 'Others'],
    'Palo Alto': ['PA-Series', 'VM-Series', 'Others'],
    'Sophos': ['XG Firewall', 'SG UTM', 'SD-RED', 'Others'],
    'Aruba': ['Instant On', 'CX Series', 'Others']
};

const NETWORK_TYPES = [
    'Router',
    'Switch',
    'Firewall',
    'Network Cable',
    'Access Point',
    'Patch Panel',
    'Network Storage (NAS)',
    'Server',
    'Others'
];

const PRINTER_BRANDS = [
    'HP', 'Canon', 'Epson', 'Brother', 'Xerox', 'Ricoh', 'Others'
];

const PRINTER_MODELS = {
    'HP': ['LaserJet Pro', 'OfficeJet Pro', 'DeskJet', 'PageWide', 'DesignJet', 'Others'],
    'Canon': ['PIXMA', 'imageCLASS', 'MAXIFY', 'imageRUNNER', 'Others'],
    'Epson': ['EcoTank', 'WorkForce', 'Expression', 'SureColor', 'Others'],
    'Brother': ['HL Series', 'MFC Series', 'DCP Series', 'Others'],
    'Xerox': ['Phaser', 'VersaLink', 'AltaLink', 'WorkCentre', 'Others'],
    'Ricoh': ['Aficio', 'SP Series', 'IM Series', 'Others'],



};

const PRINTER_TYPES = [
    'Inkjet Printer',
    'Laser Printer',
    'Dot Matrix Printer',
    'Thermal Printer',
    'Wide-Format Printer',
    'Label Printer',
    'Others'
];

const SCANNER_BRANDS = [
    'Epson', 'Canon', 'HP', 'Panasonic', 'Others'
];

const SCANNER_MODELS = {

    'Epson': ['WorkForce DS', 'Perfection', 'FastFot', 'Others'],
    'Canon': ['imageFORMULA', 'CanoScan', 'Others'],
    'HP': ['ScanJet Pro', 'ScanJet Enterprise', 'Others'],
    'Panasonic': ['KV Series', 'Others'],
};

const SCANNER_TYPES = [
    'Flatbed Scanner',
    'Document / Sheet-fed Scanner',
    'Handheld Scanner',
    'Drum Scanner',
    'Photo Scanner',
    'Barcode Scanner',
    'Others'
];

const PHOTOCOPIER_BRANDS = [
    'Canon', 'Sharp', 'HP', 'Others'
];

const PHOTOCOPIER_MODELS = {
    'Canon': ['imageRUNNER ADVANCE', 'imagePRESS', 'Others'],
    'Sharp': ['MX Series', 'BP Series', 'Others'],
    'HP': ['LaserJet Managed', 'PageWide Managed', 'Others']
};

const PLANT_BRANDS = {
    'Power Generators': ['Caterpillar', 'Cummins', 'Perkins', 'FG Wilson', 'Denyo', 'Kipor', 'Honda', 'Jubaili Bros', 'Mikano', 'Others'],

};

const PLANT_MODELS = {
    'Caterpillar': ['C-Series', 'GC Series', 'Olympian', 'Excavator', 'Bulldozer', 'Wheel Loader', 'Motor Grader', 'Backhoe Loader', 'Others'],
    'Cummins': ['QuietConnect', 'PowerCommand', 'Others'],
    'Perkins': ['400 Series', '1100 Series', '2000 Series', 'Others'],
    'FG Wilson': ['P-Series', 'F-Series', 'Others'],
    'Denyo': ['DCA Series', 'TLG Series', 'Others'],
    'Kipor': ['KDE Series', 'IG Series', 'Others'],
    'Honda': ['EU Series', 'EG Series', 'Others'],
    'Jubaili Bros': ['Marapco', 'Jet', 'Others'],
    'Mikano': ['Yorc', 'Soundproof', 'Others']

};

const OFFICE_CONSUMABLES_BRANDS = [
    'HP', 'Canon', 'Epson', 'Double A', 'PaperOne', 'BIC', 'Staedtler', 'Casio', 'Deli', 'Others'
];

const OFFICE_CONSUMABLES_MODELS = {
    'HP': ['Toner Cartridge', 'Ink Cartridge', 'Others'],
    'Canon': ['Toner Cartridge', 'Ink Cartridge', 'Others'],
    'Epson': ['Ink Bottle', 'Ribbon Cartridge', 'Others'],
    'Double A': ['A4 Paper (80gsm)', 'A3 Paper', 'Others'],
    'PaperOne': ['A4 Paper (70gsm)', 'A4 Paper (80gsm)', 'Others'],
    'BIC': ['Ballpoint Pens', 'Whiteboard Markers', 'Others'],
    'Staedtler': ['Pencils', 'Markers', 'Others'],
    'Casio': ['Calculators', 'Others'],
    'Deli': ['Staplers', 'Files/Folders', 'Sticky Notes', 'Others']
};

const PRINTING_PAPER_BRANDS = ['Double A', 'PaperOne', 'HP', 'Mondi', 'Discovery', 'Chamex', 'Others'];
const PAPER_SIZES = ['A4', 'A3', 'A5', 'Letter', 'Others'];
const PAPER_WEIGHTS = ['70 gsm', '75 gsm', '80 gsm', '90 gsm', '100 gsm', '120 gsm', 'Others'];

const CARTRIDGE_BRANDS = ['HP', 'Canon', 'Epson', 'Brother', 'Ricoh', 'Kyocera', 'Others'];
const CARTRIDGE_TYPES = ['Toner Cartridge', 'Ink Cartridge', 'Drum Unit', 'Ribbon', 'Others'];
const CARTRIDGE_COLORS = ['Black (K)', 'Cyan (C)', 'Magenta (M)', 'Yellow (Y)', 'Tri-Color', 'Others'];

const STATIONERY_TYPES = ['Pens / Pencils', 'Markers / Highlighters', 'Files / Folders', 'Staplers / Punchers', 'Calculators', 'Sticky Notes / Notepads', 'Paper Clips / Pins', 'Others'];
const STATIONERY_BRANDS = ['BIC', 'Staedtler', 'Deli', 'Kangaro', 'Casio', 'Pelikan', 'Others'];

const IT_CONSUMABLES_BRANDS = [
    'SanDisk', 'Samsung', 'Western Digital (WD)', 'Seagate', 'Kingston', 'Logitech', 'APC', 'Eaton', 'HPE', 'Others'
];

const IT_CONSUMABLES_MODELS = {
    'SanDisk': ['USB Flash Drive', 'SD Card', 'Others'],
    'Samsung': ['Portable SSD', 'Internal SSD', 'Others'],
    'Western Digital (WD)': ['External HDD', 'Internal HDD', 'Others'],
    'Seagate': ['External HDD', 'Internal HDD', 'Others'],
    'Kingston': ['USB Flash Drive', 'RAM Module', 'Others'],
    'Logitech': ['Wireless Mouse', 'Keyboard', 'Webcam', 'Headset', 'Others'],
    'APC': ['UPS Replacement Battery', 'Surge Protector', 'Others'],
    'Eaton': ['UPS Battery', 'Others'],
    'HPE': ['Server HDD', 'Server RAM', 'Others']
};

// IT Consumables sub-type constants
const USB_CAPACITIES = ['8 GB', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', 'Others'];
const USB_STANDARDS = ['USB 2.0', 'USB 3.0', 'USB 3.1', 'USB-C', 'USB-A', 'Others'];
const HDD_CAPACITIES = ['500 GB', '1 TB', '2 TB', '4 TB', '6 TB', '8 TB', 'Others'];
const RAM_TYPES = ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'ECC', 'Others'];
const RAM_SIZES = ['2 GB', '4 GB', '8 GB', '16 GB', '32 GB', '64 GB', 'Others'];
const CABLE_TYPES = ['Ethernet (Cat5e)', 'Ethernet (Cat6)', 'Ethernet (Cat6a)', 'HDMI', 'DisplayPort', 'USB-A to USB-B', 'USB-C', 'VGA', 'Fibre Optic', 'Power Extension Cable', 'Others'];
const ADAPTER_TYPES = ['Power Adapter / Charger', 'USB Hub', 'HDMI to VGA', 'USB-C to HDMI', 'Docking Station', 'PoE Injector', 'Others'];
const PERIPHERAL_TYPES = ['Wireless Mouse', 'Wireless Keyboard', 'Webcam', 'Headset / Headphones', 'Barcode Scanner', 'Others'];

// Maintenance / Workshop constants
const LUBRICANT_TYPES = ['Engine Oil', 'Gear Oil', 'Hydraulic Fluid', 'Grease', 'Coolant / Antifreeze', 'Chain Lubricant', 'Others'];
const LUBRICANT_CAPACITIES = ['1 L', '4 L', '5 L', '10 L', '20 L', '25 L', '50 L', '205 L (Drum)', 'Others'];
const TOOL_TYPES = ['Spanners / Wrenches', 'Screwdrivers', 'Pliers', 'Hammers', 'Measuring Tapes', 'Others'];
const POWER_TOOL_TYPES = ['Drill', 'Angle Grinder', 'Circular Saw', 'Jigsaw', 'Rotary Hammer', 'Impact Driver', 'Sander', 'Others'];
const FASTENER_TYPES = ['Bolts and Nuts', 'Screws', 'Rivets', 'Washers', 'Anchors', 'Others'];

// Fuel constants
const FUEL_UNITS = ['Litres', 'Gallons', 'Drums (200 L)', 'Jerricans (20 L)', 'Others'];
const FUEL_OCTANE = ['RON 91', 'RON 95 (Premium)', 'RON 98 (Super)', 'N/A'];
const DIESEL_GRADES = ['Automotive Diesel', 'ULSD (Ultra Low Sulphur)', 'Off-Road Diesel', 'N/A'];

const SAFETY_EQUIPMENT_BRANDS = [
    '3M', 'MSA', 'Honeywell', 'Caterpillar (CAT)', 'Delta Plus', 'JSP',
    'Uvex', 'Kimberly-Clark', 'Draeger', 'Scott Safety', 'cofra', 'Others'
];

const SAFETY_EQUIPMENT_MODELS = {
    '3M': ['Safety Goggles', 'N95 Mask', 'Half-Face Respirator', 'Full-Face Respirator', 'Ear Muffs', 'Ear Plugs', 'Safety Glasses', 'Others'],
    'MSA': ['Safety Helmet (Hard Hat)', 'V-Gard Helmet', 'Fall Protection Kit', 'Self-Rescue Device', 'Gas Detector', 'Others'],
    'Honeywell': ['Safety Glasses', 'Safety Gloves (Cut-resistant)', 'Full-Body Harness', 'Fire Retardant Suit', 'Others'],
    'Caterpillar (CAT)': ['Safety Boots (Steel Toe)', 'Safety Boots (Composite Toe)', 'Work Boots', 'Others'],
    'Delta Plus': ['Reflective Vest (Class 2)', 'Reflective Vest (Class 3)', 'Safety Boots', 'Safety Harness', 'Coveralls', 'Others'],
    'JSP': ['EVO Safety Helmet', 'Traffic Cones', 'Marksman Harness', 'Others'],
    'Uvex': ['Safety Specs', 'Safety Gloves', 'Safety Boots', 'Others'],
    'Kimberly-Clark': ['Disposable Coverall', 'Protective Sleeves', 'Others'],
    'Draeger': ['Self-Contained Breathing Apparatus (SCBA)', 'Gas Detection Tube', 'Others'],
    'Scott Safety': ['SCBA Set', 'Air Cylinder', 'Others'],
    'cofra': ['Safety Boots', 'Others']
};

// Per-sub-type safety constants
const HELMET_STANDARDS = ['EN 397', 'ANSI Z89.1', 'BS EN 397', 'AS/NZS 1801', 'Others'];
const HELMET_CLASSES = ['Class A (General)', 'Class B (Electrical)', 'Class C (Conductive)', 'Others'];
const HELMET_COLORS = ['White', 'Yellow', 'Orange', 'Red', 'Blue', 'Green', 'Black', 'Others'];

const VEST_CLASSES = ['Class 1', 'Class 2', 'Class 3', 'FR (Fire Retardant)', 'Others'];
const VEST_COLORS = ['Orange', 'Yellow / Lime', 'Red', 'Blue', 'Others'];

const GLOVE_TYPES = ['Cut-Resistant', 'Chemical/Liquid Resistant', 'Heat Resistant', 'Electrical Insulating', 'Disposable Nitrile', 'General Purpose', 'Others'];
const GLOVE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const BOOT_TYPES = ['Steel Toe Cap', 'Composite Toe Cap', 'Chemical Resistant', 'Anti-Static', 'Waterproof', 'Others'];
const BOOT_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

const PPE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];

const EYE_PROTECTION_TYPES = ['Safety Glasses', 'Safety Goggles', 'Face Shield', 'Welding Helmet / Visor', 'Others'];

const RESP_PROTECTION_TYPES = ['Disposable Dust Mask (FFP1)', 'Disposable Dust Mask (FFP2 / N95)', 'Disposable Dust Mask (FFP3)', 'Half-Face Respirator', 'Full-Face Respirator', 'SCBA', 'Others'];

const HARNESS_TYPES = ['Full-Body Harness', 'Chest Harness', 'Seat Harness', 'Fall Arrest Lanyard', 'Rope Grab', 'Lifeline System', 'Others'];

const EXTINGUISHER_TYPES = ['Dry Powder (ABC)', 'CO2', 'Foam (AFFF)', 'Water', 'Wet Chemical', 'Halotron', 'Others'];
const EXTINGUISHER_CAPACITIES = ['1 kg', '2 kg', '4 kg', '6 kg', '9 kg', '12 kg', '2L', '6L', '9L', '50L (Trolley)', 'Others'];

const FIRST_AID_TYPES = ['Standard First Aid Kit', 'Burns Kit', 'Eye Wash Station', 'Trauma Kit', 'Workplace First Aid Kit', 'Others'];

const INFRASTRUCTURE_BRANDS = {
    'Air conditioning Systems': ['Daikin', 'Hisense', 'Nasco', 'Bruhm', 'Midea', 'Westpool', 'Chigo', 'Gree', 'Sigma', 'LG', 'Samsung', 'Panasonic', 'Carrier', 'Others'],
    'CCTV': ['Hikvision', 'Dahua', 'Bosch', 'Axis', 'Others'],
    'Access Control Systems': ['ZKTeco', 'HID Global', 'Suprema', 'Others'],
    'Fire Detection and Alarm System': ['Honeywell', 'Siemens', 'Bosch', 'Tyco', 'Others'],
    'Electrical Wiring and Installation': ['Schneider Electric', 'Legrand', 'ABB', 'Eaton', 'Siemens', 'Others'],
    'Plumbing System': ['Grohe', 'Kohler', 'TOTO', 'Geberit', 'Others'], // Added common plumbing brands
    'Fans': ['Panasonic', 'KDK', 'Havells', 'Binatone', 'Orient', 'Nexus', 'Others'],
    'Traffic Lights': ['Siemens', 'Swarco', 'Aldridge Traffic Controllers', 'Peek Traffic', 'McCain', 'Trafficware', 'Others']
};

const FAN_TYPES = [
    'Ceiling Fan',
    'Standing Fan',
    'Wall-mounted Fan',
    'Table/Desk Fan',
    'Industrial Fan',
    'Exhaust Fan',
    'Others'
];

const INFRASTRUCTURE_MODELS = {
    'Daikin': ['VRV System', 'Split AC', 'Cassette AC', 'Others'],
    'LG': ['Multi V', 'Split AC', 'Cassette AC', 'Others'],
    'Samsung': ['DVM S', 'Split AC', 'Cassette AC', 'Others'],
    'Panasonic': ['VRF System', 'Split AC', 'Others'],
    'Carrier': ['AquaSnap', 'Split AC', 'Others'],
    'Hikvision': ['IP Camera', 'PTZ Camera', 'NVR', 'DVR', 'Others'],
    'Dahua': ['IP Camera', 'PTZ Camera', 'NVR', 'Others'],
    'Bosch': ['FLEXIDOME', 'AUTODOME', 'Fire Alarm Control Panel', 'Others'],
    'Axis': ['Network Camera', 'Video Encoder', 'Others'],
    'ZKTeco': ['Biometric Terminal', 'Turnstile', 'Access Controller', 'Others'],
    'HID Global': ['iCLASS Reader', 'Omnikey', 'Others'],
    'Suprema': ['BioStation', 'BioLite', 'Others'],
    'Honeywell': ['Morley-IAS', 'Notifier', 'CCTV System', 'Others'],
    'Siemens': ['Cerberus PRO', 'Desigo', 'Others'],
    'Schneider Electric': ['Acti9', 'MasterPact', 'EcoStruxure', 'Others'],
    'Tyco': ['Simplex', 'Zettler', 'Others'],
    'Legrand': ['Circuit Breaker', 'Distribution Board', 'Others'],
    'ABB': ['Switchgear', 'Circuit Breaker', 'Others'],
    'Eaton': ['Switchgear', 'Circuit Breaker', 'Others']
};

const UPS_BRANDS = [
    'APC', 'Eaton', 'Vertiv (Liebert)', 'CyberPower', 'Tripp Lite', 'Mercury', 'MEC', 'Others'
];

const UPS_MODELS = {
    'APC': ['Smart-UPS', 'Back-UPS', 'Symmetra', 'Easy UPS', 'Others'],
    'Eaton': ['5E Series', '5S Series', '9PX Series', '9SX Series', 'Others'],
    'Vertiv (Liebert)': ['GXT4', 'GXT5', 'Edge', 'PSA', 'Others'],
    'CyberPower': ['BRICs', 'Value Pro', 'PFC Sinewave', 'Others'],
    'Tripp Lite': ['SmartPro', 'SmartOnline', 'OmniVS', 'Others'],
    'Mercury': ['Maverick', 'Elite', 'Radiant', 'Others'],
    'MEC': ['MEC UPS Series', 'Others']
};

const UPS_CAPACITIES = [
    '650 VA', '850 VA', '1 kVA', '1.5 kVA', '2 kVA', '3 kVA', '5 kVA', '6 kVA', '10 kVA', '20 kVA', 'Others'
];

const UPS_RUNTIMES = [
    '10 mins', '15 mins', '30 mins', '45 mins', '1 hour', '2 hours', '4 hours', '> 4 hours', 'Others'
];

// Solar Power System
const SOLAR_BRANDS = [
    'SMA', 'Huawei', 'SolarEdge', 'Sungrow', 'Victron Energy', 'ABB', 'Schneider Electric', 'Others'
];
const SOLAR_MODELS = {
    'SMA': ['Sunny Boy', 'Sunny Tripower', 'Sunny Island', 'Others'],
    'Huawei': ['SUN2000 Series', 'SmartLogger', 'Others'],
    'SolarEdge': ['SE3000H', 'SE5000H', 'SE10000H', 'Others'],
    'Sungrow': ['SG5.0RS', 'SG10RT', 'SG50CX', 'Others'],
    'Victron Energy': ['MultiPlus', 'EasySolar', 'BlueSolar', 'Others'],
    'ABB': ['TRIO Series', 'UNO Series', 'Others'],
    'Schneider Electric': ['Conext XW+', 'Conext SW', 'Others']
};
const SOLAR_CAPACITIES = [
    '1 kWp', '2 kWp', '3 kWp', '5 kWp', '10 kWp', '20 kWp', '50 kWp', '100 kWp', 'Others'
];

// Water Pump / Reservoir System
const WATER_PUMP_BRANDS = [
    'Grundfos', 'KSB', 'Xylem', 'Pedrollo', 'Pentair', 'Davey', 'Shimge', 'Others'
];
const WATER_PUMP_MODELS = {
    'Grundfos': ['CM Series', 'CR Series', 'E-Pump', 'SQE Series', 'Others'],
    'KSB': ['Etanorm', 'Movitec', 'Multitec', 'Others'],
    'Xylem': ['Flygt', 'Lowara', 'AC Fire Pump', 'Others'],
    'Pedrollo': ['JCRm Series', 'HFm Series', 'Others'],
    'Pentair': ['Myers', 'Sta-Rite', 'Others'],
    'Davey': ['Rain Bank', 'Torrium', 'Others'],
    'Shimge': ['JET Series', 'SHm Series', 'Others']
};
const WATER_PUMP_CAPACITIES = [
    '0.5 HP', '1 HP', '1.5 HP', '2 HP', '3 HP', '5 HP', '10 HP', '20 HP', 'Others'
];

// Elevators / Lifts
const ELEVATOR_BRANDS = [
    'OTIS', 'Schindler', 'KONE', 'Thyssenkrupp', 'Mitsubishi Electric', 'Sigma', 'Hyundai Elevator', 'Others'
];
const ELEVATOR_MODELS = {
    'OTIS': ['Gen2', 'GeN360', 'XO500', 'Others'],
    'Schindler': ['3300', '5500', '6300', 'Others'],
    'KONE': ['MonoSpace', 'TravelMaster', 'MiniSpace', 'Others'],
    'Thyssenkrupp': ['Evolution', 'Synergy', 'Endura', 'Others'],
    'Mitsubishi Electric': ['NEXIEZ-MR', 'NEXIEZ-MP', 'Others'],
    'Sigma': ['SI Series', 'Others'],
    'Hyundai Elevator': ['TRACTION', 'HYDRAULIC', 'Others']
};
const ELEVATOR_CAPACITIES = [
    '4 persons (320 kg)', '6 persons (480 kg)', '8 persons (630 kg)', '10 persons (800 kg)',
    '13 persons (1000 kg)', '16 persons (1250 kg)', '20 persons (1600 kg)', 'Others'
];

// Fire Suppression System
const FIRE_SUPPRESSION_BRANDS = [
    'Kidde', 'Ansul', 'Tyco', 'Hochiki', 'Notifier', 'Johnson Controls', 'Minimax', 'Others'
];
const FIRE_SUPPRESSION_MODELS = {
    'Kidde': ['FM-200', 'CO2 System', 'Wet Pipe Sprinkler', 'Others'],
    'Ansul': ['INERGEN', 'Halon 1301', 'Wet Chemical', 'Others'],
    'Tyco': ['Aquamist', 'INERGEN', 'CO2 System', 'Others'],
    'Hochiki': ['Smoke Detector Module', 'Suppression Panel', 'Others'],
    'Notifier': ['NFS2-3030', 'NFS-320', 'Others'],
    'Johnson Controls': ['IFC-3030', 'Suppression Panel', 'Others'],
    'Minimax': ['FM-200 Suppression', 'CO2 Total Flooding', 'Others']
};
const FIRE_SUPPRESSION_COVERAGES = [
    'Up to 50 m²', '50 – 100 m²', '100 – 200 m²', '200 – 500 m²', '500 – 1000 m²', '> 1000 m²', 'Others'
];

// Security System Hub
const SECURITY_BRANDS = [
    'Hikvision', 'Dahua', 'Bosch', 'Axis', 'Honeywell', 'Hanwha', 'ZKTeco', 'Others'
];
const SECURITY_MODELS = {
    'Hikvision': ['DS-7700NI Series', 'DS-9600NI Series', 'AcuSense NVR', 'Others'],
    'Dahua': ['NVR4000 Series', 'WizSense NVR', 'Others'],
    'Bosch': ['DIVAR IP Series', 'FLEXIDOME Hub', 'Others'],
    'Axis': ['S3008 Recorder', 'S2208 NVR', 'Others'],
    'Honeywell': ['MAXPRO NVR', 'Performance NVR', 'Others'],
    'Hanwha': ['QRN Series', 'XRN Series', 'Others'],
    'ZKTeco': ['Z8600 Series', 'DVR8000', 'Others']
};
const SECURITY_ENDPOINTS = [
    '4 Channels', '8 Channels', '16 Channels', '32 Channels', '64 Channels', '128 Channels', 'Others'
];

const REFRIGERATOR_BRANDS = ['LG', 'Samsung', 'Hisense', 'Nasco', 'Bruhm', 'Midea', 'Beko', 'Bosch', 'Others'];
const MICROWAVE_BRANDS = ['LG', 'Samsung', 'Hisense', 'Nasco', 'Midea', 'Panasonic', 'Daewoo', 'Others'];
const KETTLE_BRANDS = ['Binatone', 'Philips', 'Nasco', 'Geepas', 'Akai', 'Kenwood', 'Others'];
const PUBLIC_ADDRESS_BRANDS = ['Bosch', 'Yamaha', 'JBL', 'TOA', 'Bose', 'Behringer', 'Ahuja', 'Others'];
const DISPLAY_SYSTEM_BRANDS = ['Samsung', 'LG', 'Sony', 'Panasonic', 'Hisense', 'TCL', 'Philips', 'Others'];
const MICROWAVE_VOLUMES = ['15L', '20L', '25L', '30L', '35L', '40L', '45L', 'Others'];
const MICROWAVE_POWER = ['700W', '800W', '900W', '1000W', '1200W', '1500W', 'Others'];
const KETTLE_CAPACITIES = ['0.5L', '1.0L', '1.2L', '1.5L', '1.7L', '2.0L', '2.5L', 'Others'];
const PA_SYSTEM_POWER = ['10W', '20W', '30W', '50W', '100W', '200W', '500W', '1000W', '2000W', 'Others'];
const DISPLAY_SIZES = ['24"', '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"', '100"', 'Others'];

const SPARE_PARTS_BRANDS = ['Caterpillar', 'Bosch', 'Cummins', 'Perkins', 'Volvo Penta', 'Komatsu', 'JCB', 'Others'];
const LUBRICANT_BRANDS = ['Mobil', 'Shell', 'Total', 'Castrol', 'Valvoline', 'Chevron', 'Liqui Moly', 'Others'];
const HAND_TOOL_BRANDS = ['Stanley', 'Facom', 'Snap-on', 'Bahco', 'Knipex', 'Wera', 'Gedore', 'Others'];
const POWER_TOOL_BRANDS = ['Bosch', 'Makita', 'DeWalt', 'Hilti', 'Milwaukee', 'Stihl', 'Festool', 'Others'];
const FASTENER_BRANDS = ['Wurth', 'Fischer', 'Hilti', 'Stainless Steel', 'Galvanized', 'Brass', 'Others'];
const CLEANING_SUPPLIES_BRANDS = ['Kärcher', '3M', 'WD-40', 'Diversey', 'Ecolab', 'Local/Generic', 'Others'];

// ── Additional Dropdown Constants ────────────────────────────────────────
const PORT_COUNTS = [
    '4 Ports', '8 Ports', '12 Ports', '16 Ports', '24 Ports', '28 Ports',
    '48 Ports', '52 Ports', '96 Ports', 'N/A (Router/Firewall)', 'Others'
];

const NETWORK_FORM_FACTORS = [
    '1U Rack', '2U Rack', '3U Rack', 'Desktop', 'Wall-Mount', 'Tower', 'Modular', 'Others'
];

const ENGINE_SIZES = [
    '1.0L', '1.2L', '1.4L', '1.5L', '1.6L', '1.8L', '2.0L', '2.4L',
    '2.5L', '2.7L', '3.0L', '3.5L', '4.0L', '4.5L', '4.7L', '5.7L',
    'Electric (No Engine)', 'Others'
];

const MILEAGE_RANGES = [
    'Under 10,000 km', '10,000 – 30,000 km', '30,000 – 50,000 km',
    '50,000 – 80,000 km', '80,000 – 100,000 km', '100,000 – 150,000 km',
    '150,000 – 200,000 km', 'Over 200,000 km', 'Brand New (0 km)', 'Others'
];

const FLOOR_COUNTS = [
    '1 Floor', '2 Floors', '3 Floors', '4 Floors', '5 Floors',
    '6 Floors', '7 Floors', '8 Floors', '9 Floors', '10 Floors',
    '11–15 Floors', '16–20 Floors', '20+ Floors', 'Others'
];

const LANE_COUNTS = [
    '1 Lane', '2 Lanes', '3 Lanes', '4 Lanes', '5 Lanes', '6 Lanes',
    '7 Lanes', '8 Lanes', '10 Lanes', '12 Lanes', 'Others'
];

const LAYER_THICKNESSES = [
    '20 mm', '25 mm', '30 mm', '40 mm', '50 mm', '60 mm', '75 mm',
    '100 mm', '125 mm', '150 mm', '200 mm', 'Others'
];

const INTERCHANGE_AREAS = [
    'Less than 1 ha', '1 – 2 ha', '2 – 3 ha', '3 – 5 ha',
    '5 – 10 ha', '10 – 20 ha', 'Over 20 ha', 'Others'
];

// ── Color & Size Dropdown Constants ──────────────────────────────────────
const GENERAL_COLORS = [
    'Black', 'White', 'Silver / Grey', 'Dark Grey', 'Brown / Oak', 'Walnut',
    'Mahogany', 'Beige / Cream', 'Navy Blue', 'Blue', 'Red', 'Green',
    'Yellow', 'Orange', 'Purple', 'Gold', 'Others'
];

const VEHICLE_COLORS = [
    'White', 'Black', 'Silver', 'Grey', 'Dark Grey', 'Blue', 'Navy Blue',
    'Red', 'Maroon', 'Dark Green', 'Gold / Champagne', 'Pearl White',
    'Brown', 'Orange', 'Beige', 'Others'
];

const FURNITURE_COLORS = [
    'Black', 'White', 'Brown / Oak', 'Walnut', 'Mahogany', 'Beige / Cream',
    'Grey', 'Charcoal', 'Navy Blue', 'Silver', 'Others'
];

const PARTITION_COLORS = [
    'White', 'Frosted / White', 'Grey', 'Black', 'Silver / Aluminium',
    'Beige', 'Blue', 'Glass / Clear', 'Others'
];

const COMPUTER_COLORS = [
    'Space Grey', 'Silver', 'Black', 'White', 'Midnight Blue', 'Gold',
    'Rose Gold', 'Graphite', 'Dark Blue', 'Others'
];

const DESK_SIZES = [
    '100 x 50 cm', '120 x 60 cm', '140 x 70 cm', '150 x 75 cm',
    '160 x 80 cm', '180 x 80 cm', '180 x 90 cm', '200 x 90 cm',
    'L-Shape (140 x 100 cm)', 'L-Shape (160 x 120 cm)', 'L-Shape (180 x 140 cm)', 'Others'
];

const WORKSTATION_SIZES = [
    '120 x 60 cm', '140 x 70 cm', '150 x 75 cm', '160 x 80 cm',
    '180 x 80 cm', '180 x 90 cm', '200 x 100 cm',
    'L-Shape (160 x 120 cm)', 'L-Shape (180 x 140 cm)', 'U-Shape (200 x 160 cm)', 'Others'
];

const PARTITION_SIZES = [
    '0.6m H x 1.2m W', '1.2m H x 1.2m W', '1.5m H x 1.2m W',
    '1.8m H x 1.2m W', '2.0m H x 1.2m W', '2.4m H x 1.2m W',
    '2.4m H x 1.8m W', 'Floor-to-Ceiling', 'Others'
];

const COMPUTER_DISPLAY_SIZES = [
    '11"', '12"', '13"', '13.3"', '14"', '15.6"', '16"', '17"', '17.3"',
    '21.5"', '24"', '27"', '32"', 'Others'
];

const SCANNER_RESOLUTIONS = [
    '300 DPI', '600 DPI', '1200 DPI', '2400 DPI', '4800 DPI', '9600 DPI', 'Others'
];

const FAN_BLADE_SIZES = [
    '24 inches', '36 inches', '42 inches', '48 inches', '52 inches', '56 inches',
    '60 inches', 'Others'
];

const SUV_BRANDS = [
    'Toyota',
    'Nissan',
    'Mitsubishi',
    'Ford',
    'Hyundai',
    'Others'
];

const SALOON_BRANDS = [
    'Toyota',
    'Nissan',
    'KIA',
    'Hyundai',
    'Mercedes-Benz',
    'Others'
];

const PICKUP_BRANDS = [
    'Toyota',
    'Nissan',
    'Mitsubishi',
    'Ford',
    'Zonda',
    'Changan',
    'Peugeot',
    'Isuzu',
    'Foton',
    'Others'
];

const SUV_MODELS = {
    'Toyota': ['Land Cruiser V8', 'Land Cruiser Prado', 'Fortuner', 'Highlander', 'Rav 4', 'Others'],
    'Nissan': ['Nissan Patrol', 'Armada', 'Others'],
    'Mitsubishi': ['Pajero', 'Others'],
    'Hyundai': ['Palisade', 'Santa-fe', 'Others']
};

const SALOON_MODELS = {
    'Hyundai': ['Hyundai Accent', 'Hyundai Sonata', 'Hyundai Elantra', 'Others'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'CLS-Class', 'Others'],
    'Nissan': ['Nissan Sentra', 'Nissan Versa', 'Nissan Sunny', 'Nissan Maxima', 'Nissan Altima', 'Others'],
    'Toyota': ['Toyota Corolla', 'Toyota Camry', 'Others'],
    'KIA': ['KIA Rio', 'KIA Optima', 'KIA Forte', 'Others'],
};

const FLEET_FUEL_TYPES = [
    'Petrol',
    'Diesel',
    'Hybrid',
    'Electric',
    'Others'
];

const FLEET_TRANSMISSIONS = [
    'Automatic',
    'Manual',
    'CVT',
    'Others'
];

const PICKUP_MODELS = {
    'Toyota': ['Hilux', 'Land Cruiser Pick-up', 'Tundra', 'Tacoma', 'Others'],
    'Nissan': ['Navara', 'Frontier', 'Hard body', 'Others'],
    'Mitsubishi': ['L 200', 'Others'],
    'Ford': ['Ranger', 'F150', 'Raptor', 'Others'],
    'Zonda': ['Poer Pick-up', 'Others'],
    'Changan': ['Changan Pick-up', 'Others'],
    'Peugeot': ['LandTrek', 'Others'],
    'Isuzu': ['D-Max', 'Others'],
    'Foton': ['Tunland', 'Others'],
    'Kantanka': ['Obrempong', 'Omama', 'Others']
};

const AddAssetModal = ({ isOpen, onClose, assetToEdit = null }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { addAsset, updateAsset } = useAssets();

    const [activeTab, setActiveTab] = useState('General Info');
    const TABS = ['General Info', 'Specifications', 'Location & Ownership', 'Financials'];

    // Receipt scanner state
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [receiptUploading, setReceiptUploading] = useState(false);
    const [receiptUploaded, setReceiptUploaded] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const receiptInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const getInitialFormData = () => ({
        name: '',
        majorCategory: 'Fixed Asset',
        assetType: 'Moveable',
        category: 'Fleet',
        division: DIVISIONS[0],
        status: 'Active',
        details: '',
        plate: '',
        subType: '',
        serial: '',
        location: '',
        image: '',
        ownerDivision: DIVISIONS[0],
        custodianName: '',
        custodianID: '',
        cost: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        usefulLife: '5',
        residualValue: '0',
        sizes: '',
        color: '',
        roomNo: '',
        deskNo: '',
        staffAssignedTo: '',
        staffID: '',
        type: '',
        custodianAddress: '',
        custodianMobile: '',
        brandName: '',
        model: '',
        routeName: '',
        assetTag: '',
        hasAssetTag: 'No',
        powerOutput: '',
        powerOutputCustom: '',
        roomName: '',
        memorySize: '',
        processor: '',
        processorCustom: '',
        generation: '',
        storageSize: '',
        storageSizeCustom: '',
        brandNameCustom: '',
        modelCustom: '',
        chairMaterial: '',
        workstationMaterial: '',
        partitionMaterial: '',
        capacity: '',
        capacityCustom: '',
        batteryType: '',
        runtime: '',
        runtimeCustom: '',
        numberOfFloors: '',
        licenseType: '',
        numberOfSeats: '',
        expiryDate: '',
        licenseKey: '',
        softwareVersion: '',
        vendor: '',
        printerType: '',
        scannerType: '',
        ipAddress: '',
        portCount: '',
        engineNumber: '',
        yearOfManufacture: '',
        fuelType: '',
        transmission: '',
        engineSize: '',
        mileage: '',
        // Land & Buildings specific fields
        gpsCoordinates: '',
        yearBuilt: '',
        numRooms: '',
        starRating: '',
        numUnits: '',
        accommodationType: '',
        seatingCapacity: '',
        roadLength: '',
        roadWidth: '',
        surfaceType: '',
        bridgeLength: '',
        bridgeWidth: '',
        loadCapacity: '',
        bridgeType: '',
        numLanes: '',
        interchangeType: '',
        yearOfCommencement: '',
        contractor: '',
        supervisors: '',
        commissionedBy: '',
        lastMaintenanceType: '',
        lastMaintenanceDate: '',
        estimatedResidualLife: '',
        layerThickness: '',
        warrantyExpiry: ''
    });

    const [formData, setFormData] = useState(getInitialFormData());

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (assetToEdit) {
            setFormData({
                ...assetToEdit,
                majorCategory: assetToEdit.major_category || 'Fixed Asset',
                assetType: assetToEdit.asset_type || (assetToEdit.major_category === 'Non Fixed Asset' ? 'General' : 'Moveable'),
                category: assetToEdit.category || 'Fleet',
                cost: assetToEdit.purchase_cost || '',
                purchaseDate: assetToEdit.purchase_date || new Date().toISOString().split('T')[0],
                usefulLife: assetToEdit.useful_life || '5',
                residualValue: assetToEdit.residual_value || '0',
                plate: assetToEdit.plate_number || '',
                chassis: assetToEdit.chassis_number || '',
                engine: assetToEdit.engine_number || '',
                subType: assetToEdit.sub_type || '',
                serial: assetToEdit.serial_number || '',
                details: assetToEdit.notes || '',
                custodianName: assetToEdit.custodian_name || '',
                custodianID: assetToEdit.custodian_id || '',
                ownerDivision: assetToEdit.owner_division || assetToEdit.division || DIVISIONS[0],
                sizes: assetToEdit.sizes || '',
                color: assetToEdit.color || '',
                roomNo: assetToEdit.room_number || '',
                deskNo: assetToEdit.desk_number || '',
                staffAssignedTo: assetToEdit.staff_assigned_to || '',
                staffID: assetToEdit.staff_id || '',
                type: assetToEdit.type || '',
                custodianAddress: assetToEdit.custodian_address || '',
                custodianMobile: assetToEdit.custodian_mobile || '',
                brandName: assetToEdit.brand_name || '',
                model: assetToEdit.model || '',
                routeName: assetToEdit.route_name || '',
                assetTag: assetToEdit.asset_tag || '',
                hasAssetTag: assetToEdit.asset_tag ? 'Yes' : 'No',
                roomName: assetToEdit.room_name || '',
                memorySize: assetToEdit.memory_size || '',
                processor: assetToEdit.processor || '',
                processorCustom: '',
                generation: assetToEdit.generation || '',
                storageSize: assetToEdit.storage_size || '',
                storageSizeCustom: '',
                brandNameCustom: '',
                modelCustom: '',
                chairMaterial: assetToEdit.chair_material || '',
                workstationMaterial: assetToEdit.workstation_material || '',
                partitionMaterial: assetToEdit.partition_material || '',
                capacity: assetToEdit.capacity || '',
                capacityCustom: '',
                batteryType: assetToEdit.battery_type || '',
                runtime: assetToEdit.runtime || '',
                runtimeCustom: '',
                numberOfFloors: assetToEdit.number_of_floors || '',
                licenseType: assetToEdit.license_type || '',
                numberOfSeats: assetToEdit.number_of_seats || '',
                expiryDate: assetToEdit.expiry_date || '',
                licenseKey: assetToEdit.license_key || '',
                softwareVersion: assetToEdit.software_version || '',
                vendor: assetToEdit.vendor || '',
                printerType: assetToEdit.printer_type || '',
                scannerType: assetToEdit.scanner_type || '',
                ipAddress: assetToEdit.ip_address || '',
                portCount: assetToEdit.port_count || '',
                engineNumber: assetToEdit.engine_number || '',
                yearOfManufacture: assetToEdit.year_of_manufacture || '',
                fuelType: assetToEdit.fuel_type || '',
                transmission: assetToEdit.transmission || '',
                engineSize: assetToEdit.engine_size || '',
                mileage: assetToEdit.mileage || '',
                // Land & Buildings specific fields
                gpsCoordinates: assetToEdit.gps_coordinates || '',
                yearBuilt: assetToEdit.year_built || '',
                numRooms: assetToEdit.num_rooms || '',
                starRating: assetToEdit.star_rating || '',
                numUnits: assetToEdit.num_units || '',
                accommodationType: assetToEdit.accommodation_type || '',
                seatingCapacity: assetToEdit.seating_capacity || '',
                roadLength: assetToEdit.road_length || '',
                roadWidth: assetToEdit.road_width || '',
                surfaceType: assetToEdit.surface_type || '',
                bridgeLength: assetToEdit.bridge_length || '',
                bridgeWidth: assetToEdit.bridge_width || '',
                loadCapacity: assetToEdit.load_capacity || '',
                bridgeType: assetToEdit.bridge_type || '',
                numLanes: assetToEdit.num_lanes || '',
                interchangeType: assetToEdit.interchange_type || '',
                yearOfCommencement: assetToEdit.year_of_commencement || '',
                contractor: assetToEdit.contractor || '',
                supervisors: assetToEdit.supervisors || '',
                commissionedBy: assetToEdit.commissioned_by || '',
                lastMaintenanceType: assetToEdit.last_maintenance_type || '',
                lastMaintenanceDate: assetToEdit.last_maintenance_date || '',
                estimatedResidualLife: assetToEdit.estimated_residual_life || '',
                layerThickness: assetToEdit.layer_thickness || ''

            });

            // Handle custom brand loading
            if (assetToEdit.brand_name) {
                const brands = assetToEdit.sub_type === 'SUV' ? SUV_BRANDS :
                    assetToEdit.sub_type === 'Pick-up' ? PICKUP_BRANDS :
                        assetToEdit.sub_type === 'Saloon Cars' ? SALOON_BRANDS :
                            assetToEdit.sub_type === 'Van' ? VAN_BRANDS :
                                assetToEdit.sub_type === 'Buses' ? BUS_BRANDS :
                                    assetToEdit.sub_type === 'Network Equipment' ? NETWORK_BRANDS :
                                        assetToEdit.sub_type === 'Printers' ? PRINTER_BRANDS :
                                            assetToEdit.sub_type === 'Scanners' ? SCANNER_BRANDS :
                                                assetToEdit.sub_type === 'Photocopier' ? PHOTOCOPIER_BRANDS :
                                                    assetToEdit.category === 'Plant and Machinery' ? (PLANT_BRANDS[assetToEdit.sub_type] || ['Others']) :
                                                        assetToEdit.category === 'Office Consumables' ? OFFICE_CONSUMABLES_BRANDS :
                                                            assetToEdit.category === 'IT and Technical Consumables' ? IT_CONSUMABLES_BRANDS :
                                                                assetToEdit.category === 'Safety and Productive Equipment' ? SAFETY_EQUIPMENT_BRANDS :
                                                                    assetToEdit.category === 'Installed Infrastructure & Utility System' ? (INFRASTRUCTURE_BRANDS[assetToEdit.subType] || ['Others']) :
                                                                        assetToEdit.category === 'ICT Asset' && assetToEdit.sub_type === 'Computers' ? COMPUTER_BRANDS :
                                                                            assetToEdit.sub_type === 'Power Backup / UPS' ? UPS_BRANDS : [];
                if (brands.length > 0 && !brands.includes(assetToEdit.brand_name)) {
                    setFormData(prev => ({ ...prev, brandName: 'Others', brandNameCustom: assetToEdit.brand_name }));
                }
            }

            // Handle custom model loading
            if (assetToEdit.model) {
                const brand = assetToEdit.brand_name;
                const models = assetToEdit.sub_type === 'SUV' ? SUV_MODELS[brand] :
                    assetToEdit.sub_type === 'Pick-up' ? PICKUP_MODELS[brand] :
                        assetToEdit.sub_type === 'Saloon Cars' ? SALOON_MODELS[brand] :
                            assetToEdit.sub_type === 'Van' ? VAN_MODELS[brand] :
                                assetToEdit.sub_type === 'Buses' ? BUS_MODELS[brand] :
                                    assetToEdit.sub_type === 'Network Equipment' ? NETWORK_MODELS[brand] :
                                        assetToEdit.sub_type === 'Printers' ? PRINTER_MODELS[brand] :
                                            assetToEdit.sub_type === 'Scanners' ? SCANNER_MODELS[brand] :
                                                assetToEdit.sub_type === 'Photocopier' ? PHOTOCOPIER_MODELS[brand] :
                                                    assetToEdit.category === 'Plant and Machinery' ? PLANT_MODELS[brand] :
                                                        assetToEdit.category === 'Office Consumables' ? OFFICE_CONSUMABLES_MODELS[brand] :
                                                            assetToEdit.category === 'IT and Technical Consumables' ? IT_CONSUMABLES_MODELS[brand] :
                                                                assetToEdit.category === 'Safety and Productive Equipment' ? SAFETY_EQUIPMENT_MODELS[brand] :
                                                                    assetToEdit.category === 'Installed Infrastructure & Utility System' ? INFRASTRUCTURE_MODELS[brand] :
                                                                        assetToEdit.category === 'ICT Asset' && assetToEdit.sub_type === 'Computers' ? COMPUTER_MODELS[brand] :
                                                                            assetToEdit.sub_type === 'Power Backup / UPS' ? UPS_MODELS[brand] : [];
                if (models && models.length > 0 && !models.includes(assetToEdit.model)) {
                    setFormData(prev => ({ ...prev, model: 'Others', modelCustom: assetToEdit.model }));
                }
            }

            // Handle custom processor loading
            if (assetToEdit.processor) {
                if (!PROCESSORS.includes(assetToEdit.processor)) {
                    setFormData(prev => ({ ...prev, processor: 'Others', processorCustom: assetToEdit.processor }));
                }
            }

            // Handle custom capacity loading
            if (assetToEdit.capacity) {
                if (!UPS_CAPACITIES.includes(assetToEdit.capacity) && assetToEdit.sub_type === 'Power Backup / UPS') {
                    setFormData(prev => ({ ...prev, capacity: 'Others', capacityCustom: assetToEdit.capacity }));
                }
            }

            // Handle custom runtime loading
            if (assetToEdit.runtime) {
                if (!UPS_RUNTIMES.includes(assetToEdit.runtime) && assetToEdit.sub_type === 'Power Backup / UPS') {
                    setFormData(prev => ({ ...prev, runtime: 'Others', runtimeCustom: assetToEdit.runtime }));
                }
            }

            // Handle custom storage loading
            if (assetToEdit.storage_size && assetToEdit.sub_type === 'Computers') {
                if (!STORAGE_SIZES.includes(assetToEdit.storage_size)) {
                    setFormData(prev => ({ ...prev, storageSize: 'Others', storageSizeCustom: assetToEdit.storage_size }));
                }
            }
        } else {
            setFormData(getInitialFormData());
            setActiveTab('General Info');
        }
    }, [assetToEdit, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'majorCategory') {
            const firstType = Object.keys(CATEGORY_HIERARCHY[value])[0];
            const firstCat = CATEGORY_HIERARCHY[value][firstType][0];
            setFormData(prev => ({
                ...prev,
                majorCategory: value,
                assetType: firstType,
                category: firstCat
            }));
        } else if (name === 'assetType') {
            const firstCat = CATEGORY_HIERARCHY[formData.majorCategory][value][0];
            setFormData(prev => ({
                ...prev,
                assetType: value,
                category: firstCat,
                subType: ''
            }));
        } else if (name === 'category') {
            setFormData(prev => ({
                ...prev,
                category: value,
                subType: ''
            }));
        } else if (name === 'brandName' && value !== 'Others') {
            setFormData(prev => ({ ...prev, brandName: value, brandNameCustom: '', model: '', modelCustom: '' }));
        } else if (name === 'model' && value !== 'Others') {
            setFormData(prev => ({ ...prev, model: value, modelCustom: '' }));
        } else if (name === 'processor' && value !== 'Others') {
            setFormData(prev => ({ ...prev, processor: value, processorCustom: '' }));
        } else if (name === 'capacity' && value !== 'Others') {
            setFormData(prev => ({ ...prev, capacity: value, capacityCustom: '' }));
        } else if (name === 'runtime' && value !== 'Others') {
            setFormData(prev => ({ ...prev, runtime: value, runtimeCustom: '' }));
        } else if (name === 'storageSize' && value !== 'Others') {
            setFormData(prev => ({ ...prev, storageSize: value, storageSizeCustom: '' }));
        } else {
            setErrors(prev => ({ ...prev, [name]: null }));
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateTabFields = (tabIndex) => {
        const newErrors = {};
        const cat = formData.category;
        const sub = formData.subType;

        // ── TAB 0: General Info ──────────────────────────────────
        if (tabIndex === 0) {
            if (!formData.name?.trim()) newErrors.name = 'Asset name is required';
            if (!formData.division?.trim()) newErrors.division = 'Division is required';
            if (SUB_CATEGORIES[cat] && !sub) newErrors.subType = 'Type is required';
        }

        // ── TAB 1: Specifications ────────────────────────────────
        if (tabIndex === 1) {

            // Fleet (all vehicle sub-types require brand + model)
            if (cat === 'Fleet') {
                if (!formData.brandName?.trim()) newErrors.brandName = 'Brand is required';
                if (!formData.model?.trim()) newErrors.model = 'Model is required';
                if (['Saloon Cars', 'SUV', 'Van', 'Pick-up'].includes(sub)) {
                    if (!formData.plate?.trim()) newErrors.plate = 'Plate number is required';
                }
                if (sub === 'Buses') {
                    if (!formData.plate?.trim()) newErrors.plate = 'Plate number is required';
                }
            }

            // Plant and Machinery
            else if (cat === 'Plant and Machinery') {
                if (!formData.brandName?.trim() || (formData.brandName === 'Others' && !formData.brandNameCustom?.trim())) newErrors.brandName = 'Brand / Manufacturer is required';
                if (!formData.model?.trim() || (formData.model === 'Others' && !formData.modelCustom?.trim())) newErrors.model = 'Model is required';
            }

            // ICT Assets
            else if (cat === 'ICT Asset') {
                if (!formData.brandName?.trim() || (formData.brandName === 'Others' && !formData.brandNameCustom?.trim())) newErrors.brandName = 'Brand is required';
                if (!formData.model?.trim() || (formData.model === 'Others' && !formData.modelCustom?.trim())) newErrors.model = 'Model is required';
                if (sub === 'Computers') {
                    if (!formData.processor?.trim() || (formData.processor === 'Others' && !formData.processorCustom?.trim())) newErrors.processor = 'Processor is required';
                }
                if (sub === 'Network Equipment') {
                    if (!formData.type?.trim()) newErrors.type = 'Equipment type is required';
                }
            }

            // Furniture and Office Equipment
            else if (cat === 'Furniture and Office Equipment') {
                if (!formData.type?.trim()) newErrors.type = 'Type is required';
                if (sub === 'Chair' && !formData.chairMaterial?.trim()) newErrors.chairMaterial = 'Material is required';
                if (sub === 'Workstations' && !formData.workstationMaterial?.trim()) newErrors.workstationMaterial = 'Material is required';
                if (sub === 'Office Partition and Fitting' && !formData.partitionMaterial?.trim()) newErrors.partitionMaterial = 'Material is required';
            }

            // Intangible Fixed Assets
            else if (cat === 'Intangible Fixed Assets') {
                if (!formData.vendor?.trim()) newErrors.vendor = 'Vendor / Developer is required';
                if (!formData.licenseType?.trim()) newErrors.licenseType = 'License type is required';
            }

            // Utility Equipment
            else if (cat === 'Utility Equipment') {
                if (!formData.brandName?.trim()) newErrors.brandName = 'Brand is required';
                if (!formData.capacity?.trim()) newErrors.capacity = 'Capacity is required';
                if (sub === 'Microwave' && !formData.powerOutput?.trim()) newErrors.powerOutput = 'Power Output is required';
            }

            // Installed Infrastructure & Utility System
            else if (cat === 'Installed Infrastructure & Utility System') {
                if (!formData.brandName?.trim()) newErrors.brandName = 'Brand / Manufacturer is required';
            }

            // Land and Buildings
            else if (cat === 'Land and Buildings') {
                if (sub === 'Roads') {
                    if (!formData.surfaceType?.trim()) newErrors.surfaceType = 'Surface type is required';
                } else if (sub === 'Bridges') {
                    if (!formData.bridgeType?.trim()) newErrors.bridgeType = 'Bridge type is required';
                } else if (sub === 'Interchanges') {
                    if (!formData.interchangeType?.trim()) newErrors.interchangeType = 'Interchange type is required';
                } else {
                    // All other land/building types: require at least the floor area/capacity field
                    if (!formData.capacity?.trim()) newErrors.capacity = 'Floor area / capacity is required';
                }
            }

            // Non-Fixed: Office Consumables, IT Consumables, Maintenance Supplies, Fuel, Safety Equipment
            else if ([
                'Office Consumables',
                'IT and Technical Consumables',
                'Maintenance and Workshop Supplies',
                'Fuel and Energy Supplies',
                'Safety and Productive Equipment'
            ].includes(cat)) {
                if (!formData.brandName?.trim()) newErrors.brandName = 'Brand / Manufacturer is required';
                if (!formData.capacity?.toString().trim()) newErrors.capacity = 'Quantity / Capacity is required';
                if (!formData.sizes?.trim()) newErrors.sizes = 'Unit of Measure is required';
            }

            else if (cat === 'Cash and bank balance') {
                if (!formData.bankName?.trim()) newErrors.bankName = 'Bank Name is required';
                if (!formData.accountNumber?.trim()) newErrors.accountNumber = 'Account Number is required';
                if (!formData.balanceAmount?.toString().trim()) newErrors.balanceAmount = 'Balance Amount is required';
            }

            // Asset Tag Validation (Applicable across most sub-types)
            if (formData.hasAssetTag === 'Yes' && !formData.assetTag?.trim()) {
                newErrors.assetTag = 'Asset Tag is required if "Yes" is selected';
            }
        }

        // ── TAB 2: Location & Ownership ─────────────────────────
        if (tabIndex === 2) {
            if (!formData.location?.trim()) newErrors.location = 'Location is required';
            if (!formData.ownerDivision?.trim()) newErrors.ownerDivision = 'Owner Division is required';
        }

        // ── TAB 3: Financials ────────────────────────────────────
        if (tabIndex === 3) {
            if (!formData.cost?.toString().trim()) newErrors.cost = 'Purchase cost is required';
            if (!formData.purchaseDate?.trim()) newErrors.purchaseDate = 'Purchase date is required';
        }

        return newErrors;
    };


    const handleTabChange = (targetTab) => {
        const targetIndex = TABS.indexOf(targetTab);
        const currentIndex = TABS.indexOf(activeTab);

        // If attempting to move forward to a later tab
        if (targetIndex > currentIndex) {
            // Rule 1: Always validate the tab they are LEAVING first
            const currentErrors = validateTabFields(currentIndex);
            if (Object.keys(currentErrors).length > 0) {
                setErrors(currentErrors);
                addToast(`Please complete required fields in ${TABS[currentIndex]} before moving to ${targetTab}.`, "error");
                return; // Block them on the current tab
            }

            // Rule 2: If they are trying to jump tabs (e.g. from 0 directly to 2)
            // check the intermediate tabs too!
            for (let i = currentIndex + 1; i < targetIndex; i++) {
                const intermediateErrors = validateTabFields(i);
                if (Object.keys(intermediateErrors).length > 0) {
                    setErrors(intermediateErrors);
                    addToast(`You cannot skip ahead! Please complete ${TABS[i]} first.`, "warning");
                    setActiveTab(TABS[i]);
                    return;
                }
            }
        }

        // If moving backwards or no errors found, allow navigation
        setActiveTab(targetTab);
    };

    const handleReceiptFile = (file) => {
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowed.includes(file.type)) {
            addToast('Only JPG, PNG, or PDF files are allowed.', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            addToast('File size must be under 10MB.', 'error');
            return;
        }
        setReceiptFile(file);
        setReceiptUploaded(false);
        if (file.type === 'application/pdf') {
            setReceiptPreview('pdf');
        } else {
            const reader = new FileReader();
            reader.onloadend = () => setReceiptPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleReceiptDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleReceiptFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let allErrors = {};
        let firstErrorTab = null;

        // Check all tabs before submitting
        for (let i = 0; i <= 3; i++) {
            const tabErrors = validateTabFields(i);
            if (Object.keys(tabErrors).length > 0) {
                allErrors = { ...allErrors, ...tabErrors };
                if (firstErrorTab === null) firstErrorTab = TABS[i];
            }
        }

        if (firstErrorTab) {
            setErrors(allErrors);
            addToast(`Please correct errors in the ${firstErrorTab} tab before saving.`, "error");
            setActiveTab(firstErrorTab);
            return;
        }

        const assetId = assetToEdit?.id || `GHA-${formData.category.toUpperCase().slice(0, 3)}-${Date.now()}`;

        const submissionData = {
            ...formData,
            brandName: formData.brandName === 'Others' ? formData.brandNameCustom : formData.brandName,
            model: formData.model === 'Others' ? formData.modelCustom : formData.model,
            processor: formData.processor === 'Others' ? formData.processorCustom : formData.processor,
            capacity: formData.capacity === 'Others' ? formData.capacityCustom : formData.capacity,
            powerOutput: formData.powerOutput === 'Others' ? formData.powerOutputCustom : formData.powerOutput,
            runtime: formData.runtime === 'Others' ? formData.runtimeCustom : formData.runtime,
            storageSize: formData.storageSize === 'Others' ? formData.storageSizeCustom : formData.storageSize,
            id: assetId
        };

        const result = assetToEdit
            ? await updateAsset(submissionData)
            : await addAsset(submissionData);

        if (result.success) {
            // If there is a receipt file staged, upload it now
            if (receiptFile && !receiptUploaded) {
                try {
                    setReceiptUploading(true);
                    const uploadResult = await uploadAssetReceipt(assetId, receiptFile);
                    if (uploadResult?.data?.receipt_url) {
                        setReceiptUrl(uploadResult.data.receipt_url);
                        setReceiptUploaded(true);
                    }
                } catch (err) {
                    addToast('Asset saved, but receipt upload failed: ' + err.message, 'warning');
                } finally {
                    setReceiptUploading(false);
                }
            }
            onClose();
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
                addToast("Photo attached to asset record", "info");
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={assetToEdit ? "Edit Asset" : "Add New Asset"} size="3xl">
            <div className="flex flex-col h-[78vh] bg-bg-card rounded-b-xl overflow-hidden mt-2">
                {/* Tabs Header */}
                <div className="flex border-b border-border-color/50 px-2 pt-2 overflow-x-auto custom-scrollbar shrink-0 gap-1 bg-primary/5">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => handleTabChange(tab)}
                            className={`px-5 py-3 text-xs font-extrabold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary bg-bg-card rounded-t-xl' : 'border-transparent text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-t-xl'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">

                        {/* TAB 1: GENERAL INFO */}
                        {activeTab === 'General Info' && (
                            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                <div>
                                    <label className="label">Asset Name / Model Description</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        type="text"
                                        className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                                        placeholder="e.g., Toyota V8, Office Desk, Dell Server"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Major Category</label>
                                        <select name="majorCategory" value={formData.majorCategory} onChange={handleInputChange} className="input-field">
                                            {Object.keys(CATEGORY_HIERARCHY).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Sub Category</label>
                                        <select name="assetType" value={formData.assetType} onChange={handleInputChange} className="input-field">
                                            {Object.keys(CATEGORY_HIERARCHY[formData.majorCategory] || {}).map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className={`grid ${SUB_CATEGORIES[formData.category] ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}>
                                    <div>
                                        <label className="label">Specific Category</label>
                                        <select name="category" value={formData.category} onChange={handleInputChange} className="input-field">
                                            {(CATEGORY_HIERARCHY[formData.majorCategory]?.[formData.assetType] || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    {SUB_CATEGORIES[formData.category] && (
                                        <div>
                                            <label className="label">Asset Type</label>
                                            <select name="subType" value={formData.subType || ''} onChange={handleInputChange} className={`input-field ${errors.subType ? 'border-red-500' : ''}`}>
                                                <option value="">Select Type...</option>
                                                {SUB_CATEGORIES[formData.category].map(type => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                            {errors.subType && <p className="text-red-500 text-xs mt-1">{errors.subType}</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Reporting Division</label>
                                        <select name="division" value={formData.division} onChange={handleInputChange} className="input-field">
                                            {DIVISIONS.map(div => <option key={div} value={div}>{div}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Operational Status</label>
                                        <select name="status" value={formData.status} onChange={handleInputChange} className="input-field">
                                            <option>Active</option>
                                            <option>Inactive</option>
                                            <option>Maintaince</option>
                                            <option>Disposed</option>
                                        </select>
                                    </div>
                                </div>



                            </div>
                        )}

                        {/* TAB 2: LOCATION & OWNERSHIP */}
                        {activeTab === 'Location & Ownership' && (
                            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-5 rounded-2xl bg-primary/5 border-2 border-primary/10 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Owner Division</label>
                                            <select name="ownerDivision" value={formData.ownerDivision} onChange={handleInputChange} className={`input-field ${errors.ownerDivision ? 'border-red-500' : ''}`}>
                                                {DIVISIONS.map(div => <option key={div} value={div}>{div}</option>)}
                                            </select>
                                            {errors.ownerDivision && <p className="text-red-500 text-xs mt-1">{errors.ownerDivision}</p>}
                                        </div>
                                        <div>
                                            <label className="label">Location</label>
                                            <select name="location" value={formData.location} onChange={handleInputChange} className={`input-field ${errors.location ? 'border-red-500' : ''}`}>
                                                <option value="">Select Location...</option>
                                                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                                        </div>
                                        <div>
                                            <label className="label">Room No</label>
                                            <input name="roomNo" value={formData.roomNo} onChange={handleInputChange} className="input-field" placeholder="e.g., 204" />
                                        </div>
                                        <div>
                                            <label className="label">Room Name</label>
                                            <input name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field" placeholder="e.g., Conference Room A" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">{formData.subType === 'Buses' ? 'Driver Name' : 'Custodian Name'}</label>
                                            <input name="custodianName" value={formData.custodianName} onChange={handleInputChange} className="input-field" placeholder="Enter Staff Name" />
                                        </div>
                                        <div>
                                            <label className="label">{formData.subType === 'Buses' ? 'Driver ID' : 'Custodian ID'}</label>
                                            <input name="custodianID" value={formData.custodianID} onChange={handleInputChange} className="input-field" placeholder="GHA-xxxxxxxxx-x" />
                                        </div>
                                    </div>

                                    {(formData.category === 'Fleet' || formData.category === 'ICT Asset') && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">{formData.subType === 'Buses' ? 'Driver Address' : 'Custodian Address'}</label>
                                                <input name="custodianAddress" value={formData.custodianAddress} onChange={handleInputChange} className="input-field" placeholder="Residential Address" />
                                            </div>
                                            <div>
                                                <label className="label">{formData.subType === 'Buses' ? 'Driver Mobile Number' : 'Custodian Mobile'}</label>
                                                <input name="custodianMobile" value={formData.custodianMobile} onChange={handleInputChange} className="input-field" placeholder="Phone Number" />
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}

                        {/* TAB 3: FINANCIALS */}
                        {activeTab === 'Financials' && (
                            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                {/* Cost & Dates */}
                                <div className="p-5 rounded-2xl bg-accent/5 border-2 border-accent/10 space-y-4">
                                    <div className="text-xs font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-4 bg-accent rounded-full inline-block"></span>
                                        Purchase Details
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Purchase Cost (GHS)</label>
                                            <input name="cost" type="number" value={formData.cost} onChange={handleInputChange} className={`input-field ${errors.cost ? 'border-red-500' : ''}`} placeholder="0.00" />
                                            {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost}</p>}
                                        </div>
                                        <div>
                                            <label className="label">Purchase Date</label>
                                            <input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleInputChange} className={`input-field ${errors.purchaseDate ? 'border-red-500' : ''}`} />
                                            {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
                                        </div>
                                        <div>
                                            <label className="label">Useful Life (Yrs)</label>
                                            <input name="usefulLife" type="number" value={formData.usefulLife} onChange={handleInputChange} className="input-field" placeholder="5" />
                                        </div>
                                        <div>
                                            <label className="label">Residual Value (GHS)</label>
                                            <input name="residualValue" type="number" value={formData.residualValue} onChange={handleInputChange} className="input-field" placeholder="0" />
                                        </div>
                                    </div>
                                </div>

                                {/* Depreciation Preview */}
                                <div className="p-5 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/15 space-y-4">
                                    <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block"></span>
                                        Depreciation Preview
                                    </div>

                                    {(() => {
                                        const dep = calculateDepreciation({
                                            major_category: 'Fixed Asset',
                                            approval_status: 'Approved',
                                            purchase_cost: formData.cost,
                                            useful_life: formData.usefulLife,
                                            purchase_date: formData.purchaseDate,
                                            residual_value: formData.residualValue
                                        });

                                        return (
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="p-3 bg-bg-card rounded-xl border border-border-color/50 shadow-sm">
                                                    <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Annual Dep.</div>
                                                    <div className="text-sm font-bold text-emerald-600">
                                                        GHS {dep.annualDepreciation?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-bg-card rounded-xl border border-border-color/50 shadow-sm">
                                                    <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Accumulated</div>
                                                    <div className="text-sm font-bold text-orange-500">
                                                        GHS {dep.accumulatedDepreciation?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-bg-card rounded-xl border border-border-color/50 shadow-sm">
                                                    <div className="text-[10px] text-text-muted font-bold uppercase mb-1">Book Value</div>
                                                    <div className="text-sm font-bold text-primary">
                                                        GHS {dep.currentBookValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <p className="text-[10px] text-text-muted italic">
                                        * Preview based on Straight-Line Method. Calculations are updated automatically.
                                    </p>
                                </div>

                                {/* Receipt Scanner / Upload */}
                                <div className="p-5 rounded-2xl bg-violet-500/5 border-2 border-violet-400/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-extrabold text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1 h-4 bg-violet-500 rounded-full inline-block"></span>
                                            <ScanLine size={14} />
                                            Receipt / Proof of Purchase
                                        </div>
                                        {receiptFile && (
                                            <button
                                                type="button"
                                                onClick={() => { setReceiptFile(null); setReceiptPreview(null); setReceiptUploaded(false); setReceiptUrl(''); }}
                                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                                            >
                                                <X size={12} /> Remove
                                            </button>
                                        )}
                                    </div>

                                    {/* Hidden file inputs */}
                                    <input
                                        ref={receiptInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,application/pdf"
                                        className="hidden"
                                        onChange={(e) => handleReceiptFile(e.target.files[0])}
                                    />
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handleReceiptFile(e.target.files[0])}
                                    />

                                    {!receiptFile ? (
                                        /* Drop Zone */
                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                            onDragLeave={() => setIsDragOver(false)}
                                            onDrop={handleReceiptDrop}
                                            className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 ${isDragOver
                                                ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
                                                : 'border-violet-300/40 bg-violet-500/3 hover:border-violet-400/60 hover:bg-violet-500/6'
                                                }`}
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                                                <ScanLine size={28} className="text-violet-500" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-text-primary">Scan or Upload Receipt</p>
                                                <p className="text-xs text-text-muted mt-1">Drag & drop, take a photo, or browse files</p>
                                                <p className="text-[10px] text-text-muted/70 mt-0.5">JPG, PNG, or PDF · Max 10MB</p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => cameraInputRef.current?.click()}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors shadow-sm"
                                                >
                                                    <Camera size={14} />
                                                    Scan / Camera
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => receiptInputRef.current?.click()}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border-2 border-violet-300/40 text-text-primary text-xs font-bold hover:border-violet-400/80 transition-colors"
                                                >
                                                    <Upload size={14} />
                                                    Browse Files
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Receipt Preview */
                                        <div className="flex gap-4 items-start p-4 rounded-xl bg-bg-card border border-border-color/50">
                                            <div className="shrink-0 w-24 h-28 rounded-lg overflow-hidden bg-violet-500/10 border border-violet-300/30 flex items-center justify-center">
                                                {receiptPreview === 'pdf' ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <FileText size={28} className="text-violet-500" />
                                                        <span className="text-[9px] font-bold text-violet-600 uppercase">PDF</span>
                                                    </div>
                                                ) : (
                                                    <img src={receiptPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {receiptUploaded ? (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-extrabold uppercase">
                                                            <Check size={11} /> Uploaded
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-600 text-[10px] font-extrabold uppercase">
                                                            <ScanLine size={11} /> Ready
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-text-primary mt-2 truncate">{receiptFile.name}</p>
                                                <p className="text-xs text-text-muted">{(receiptFile.size / 1024).toFixed(1)} KB</p>
                                                {receiptUploaded && receiptUrl && (
                                                    <a
                                                        href={receiptUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 mt-2 text-xs text-violet-600 hover:text-violet-700 font-semibold"
                                                    >
                                                        <Eye size={12} /> View Receipt
                                                    </a>
                                                )}
                                                {receiptUploading && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="h-1.5 flex-1 bg-border-color rounded-full overflow-hidden">
                                                            <div className="h-full bg-violet-500 rounded-full animate-pulse w-3/4" />
                                                        </div>
                                                        <span className="text-[10px] text-text-muted">Uploading...</span>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => receiptInputRef.current?.click()}
                                                        className="text-[11px] text-text-muted hover:text-text-primary underline"
                                                    >
                                                        Replace
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-text-muted italic">
                                        * The receipt will be attached to the asset record after saving. Accepted: photos of receipts, invoices, or purchase orders.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: SPECIFICATIONS */}
                        {activeTab === 'Specifications' && (
                            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                {formData.subType === 'Office Desk' && (
                                    <div className="p-5 rounded-2xl bg-indigo-500/8 border-2 border-indigo-400/25 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>Office Desk Specs
                                            </div>
                                            {formData.type && (
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group">
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                        {formData.image ? (
                                                            <img src={formData.image} className="w-full h-full object-cover" alt="Custom Preview" />
                                                        ) : (() => {
                                                            const imgUrl = getDefaultImage(formData);
                                                            return imgUrl
                                                                ? <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Desk Preview" />
                                                                : <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>;
                                                        })()}
                                                        {/* Hover overlay */}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                            <Camera size={22} className="text-white" />
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                            </span>
                                                        </div>
                                                    </label>
                                                    {formData.image && (
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                            <X size={10} /> Reset to Default
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Type</label>
                                                <select name="type" value={formData.type} onChange={handleInputChange} className={`input-field ${errors.type ? 'border-red-500' : ''}`}>
                                                    <option value="">Select Desk Type...</option>
                                                    {DESK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                                </select>
                                                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                                            </div>
                                            <div>
                                                <label className="label">Sizes</label>
                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Desk Size...</option>
                                                    {DESK_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">Color</label>
                                                <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Color...</option>
                                                    {FURNITURE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <div className="col-span-2 lg:col-span-1">
                                                <label className="label">Serial Number</label>
                                                <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <label className="label">Does the asset have an Asset Tag?</label>
                                                <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                                {formData.hasAssetTag === 'Yes' && (
                                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                                        <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                        {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <label className="label">Desk No</label>
                                                <input name="deskNo" value={formData.deskNo} onChange={handleInputChange} className="input-field" placeholder="e.g., DSK-05" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.subType === 'Chair' && (
                                    <div className="p-5 rounded-2xl bg-violet-500/8 border-2 border-violet-400/25 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="text-xs font-extrabold text-violet-500 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-4 bg-violet-500 rounded-full inline-block"></span>Chair Specs
                                            </div>
                                            {formData.type && (
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group">
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                        {formData.image ? (
                                                            <img src={formData.image} className="w-full h-full object-cover" alt="Custom Preview" />
                                                        ) : (() => {
                                                            const imgUrl = getDefaultImage(formData);
                                                            return imgUrl
                                                                ? <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Chair Preview" />
                                                                : <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>;
                                                        })()}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                            <Camera size={22} className="text-white" />
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                            </span>
                                                        </div>
                                                    </label>
                                                    {formData.image && (
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                            <X size={10} /> Reset to Default
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Type</label>
                                                <select name="type" value={formData.type} onChange={handleInputChange} className={`input-field ${errors.type ? 'border-red-500' : ''}`}>
                                                    <option value="">Select Chair Type...</option>
                                                    {CHAIR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                                </select>
                                                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                                            </div>
                                            <div>
                                                <label className="label">Material</label>
                                                <select name="chairMaterial" value={formData.chairMaterial} onChange={handleInputChange} className={`input-field ${errors.chairMaterial ? 'border-red-500' : ''}`}>
                                                    <option value="">Select Material...</option>
                                                    {CHAIR_MATERIALS.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                                                </select>
                                                {errors.chairMaterial && <p className="text-red-500 text-xs mt-1">{errors.chairMaterial}</p>}
                                            </div>
                                            <div>
                                                <label className="label">Color</label>
                                                <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Color...</option>
                                                    {FURNITURE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="label">Serial Number</label>
                                                <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                            </div>
                                            <div>
                                                <label className="label">Does the asset have an Asset Tag?</label>
                                                <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                                {formData.hasAssetTag === 'Yes' && (
                                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                                        <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                        {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.subType === 'Workstations' && (
                                    <div className="p-5 rounded-2xl bg-teal-500/8 border-2 border-teal-400/25 space-y-4">
                                        <div className="text-xs font-extrabold text-teal-600 uppercase tracking-widest flex items-center gap-2"><span className="w-1 h-4 bg-teal-500 rounded-full inline-block"></span>Workstation Specs</div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Type</label>
                                                <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Workstation Type...</option>
                                                    {WORKSTATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">Material</label>
                                                <select name="workstationMaterial" value={formData.workstationMaterial} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Material...</option>
                                                    {WORKSTATION_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">Color</label>
                                                <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Color...</option>
                                                    {FURNITURE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">Dimensions</label>
                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Dimensions...</option>
                                                    {WORKSTATION_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">No. of Stations</label>
                                                <input name="deskNo" value={formData.deskNo} onChange={handleInputChange} className="input-field" placeholder="e.g., 4" />
                                            </div>

                                            <div>
                                                <label className="label">Serial Number</label>
                                                <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                            </div>
                                            <div>
                                                <label className="label">Does the asset have an Asset Tag?</label>
                                                <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                                {formData.hasAssetTag === 'Yes' && (
                                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                                        <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                        {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.subType === 'Office Partition and Fitting' && (
                                    <div className="p-5 rounded-2xl bg-amber-500/8 border-2 border-amber-400/25 space-y-4">
                                        <div className="text-xs font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-2"><span className="w-1 h-4 bg-amber-500 rounded-full inline-block"></span>Partition & Fitting Specs</div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Type</label>
                                                <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Partition Type...</option>
                                                    {PARTITION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">Material</label>
                                                <select name="partitionMaterial" value={formData.partitionMaterial} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Material...</option>
                                                    {PARTITION_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">Color / Finish</label>
                                                <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Color / Finish...</option>
                                                    {PARTITION_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">Dimensions</label>
                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                    <option value="">Select Panel Size...</option>
                                                    {PARTITION_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="label">Serial Number</label>
                                                <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                            </div>
                                            <div>
                                                <label className="label">Does the asset have an Asset Tag?</label>
                                                <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                                {formData.hasAssetTag === 'Yes' && (
                                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                                        <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                        {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* UTILITY EQUIPMENT SPECS */}
                                {formData.category === 'Utility Equipment' && (
                                    <div className="p-5 rounded-2xl bg-cyan-500/8 border-2 border-cyan-400/25 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="text-xs font-extrabold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-4 bg-cyan-500 rounded-full inline-block"></span>Utility Equipment Specs
                                            </div>
                                            {((formData.brandName && ['Power Backup / UPS', 'Solar Power System', 'Refrigerator', 'Microwave'].includes(formData.subType)) ||
                                                (formData.type && ['Display System', 'Public Address System'].includes(formData.subType)) ||
                                                ['Kettle', 'Fire Suppression System'].includes(formData.subType)) && (
                                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                        <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group p-2">
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                            {formData.image ? (
                                                                <img src={formData.image} className="w-full h-full object-contain" alt="Custom Preview" />
                                                            ) : (() => {
                                                                const brandToUse = formData.brandName === 'Others' ? formData.brandNameCustom : formData.brandName;
                                                                const imgUrl = getDefaultImage({ subType: formData.subType, brandName: brandToUse, model: formData.model, type: formData.type });
                                                                return imgUrl
                                                                    ? <img src={imgUrl} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" alt="Utility Preview" onError={(e) => { e.target.onerror = null; e.target.src = '/defaults/network_default.png'; }} />
                                                                    : <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>;
                                                            })()}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                                <Camera size={22} className="text-white" />
                                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                    {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                                </span>
                                                            </div>
                                                        </label>
                                                        {formData.image && (
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                                <X size={10} /> Reset to Default
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Brand / Manufacturer</label>
                                                {formData.subType === 'Power Backup / UPS' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {UPS_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Solar Power System' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {SOLAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Water Pump / Reservoir System' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {WATER_PUMP_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Elevators / Lifts' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {ELEVATOR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Fire Suppression System' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {FIRE_SUPPRESSION_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Security System Hub' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {SECURITY_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Refrigerator' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {REFRIGERATOR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Microwave' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {MICROWAVE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Kettle' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {KETTLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Public Address System' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {PUBLIC_ADDRESS_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Display System' ? (
                                                    <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Brand...</option>
                                                        {DISPLAY_SYSTEM_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                ) : (
                                                    <input name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field" placeholder="e.g., APC, SMA, Bruhm" />
                                                )}
                                                {formData.brandName === 'Others' && (
                                                    <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand/Manufacturer..." />
                                                )}
                                            </div>
                                            {!['Microwave', 'Kettle', 'Refrigerator', 'Public Address System'].includes(formData.subType) && (
                                                <div>
                                                    <label className="label">Model</label>
                                                    {(() => {
                                                        const modelMap = {
                                                            'Power Backup / UPS': UPS_MODELS,
                                                            'Solar Power System': SOLAR_MODELS,
                                                            'Water Pump / Reservoir System': WATER_PUMP_MODELS,
                                                            'Elevators / Lifts': ELEVATOR_MODELS,
                                                            'Fire Suppression System': FIRE_SUPPRESSION_MODELS,
                                                            'Security System Hub': SECURITY_MODELS
                                                        };
                                                        let models = modelMap[formData.subType]?.[formData.brandName];
                                                        if (formData.subType === 'Fire Suppression System') {
                                                            const allModels = Object.values(FIRE_SUPPRESSION_MODELS).flat().filter(m => m !== 'Others');
                                                            models = [...new Set(allModels), 'Others'];
                                                        }
                                                        return models ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Smart-UPS 1500" />
                                                        );
                                                    })()}
                                                    {formData.model === 'Others' && (
                                                        <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <label className="label">
                                                    {formData.subType === 'Power Backup / UPS' ? 'Capacity' :
                                                        formData.subType === 'Solar Power System' ? 'Panel Capacity (kWp)' :
                                                            formData.subType === 'Water Pump / Reservoir System' ? 'Pump Capacity (HP)' :
                                                                formData.subType === 'Elevators / Lifts' ? 'Load Capacity' :
                                                                    formData.subType === 'Fire Suppression System' ? 'Coverage Area' :
                                                                        formData.subType === 'Security System Hub' ? 'Channel Capacity' :
                                                                            formData.subType === 'Refrigerator' ? 'Capacity (Liters)' :
                                                                                formData.subType === 'Microwave' ? 'Volume (Liters)' :
                                                                                    formData.subType === 'Kettle' ? 'Capacity (Liters)' :
                                                                                        formData.subType === 'Public Address System' ? 'Power Output (Watts)' :
                                                                                            formData.subType === 'Display System' ? 'Screen Size (Inches)' :
                                                                                                'Capacity / Coverage'}
                                                </label>
                                                {formData.subType === 'Power Backup / UPS' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Capacity...</option>
                                                        {UPS_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Solar Power System' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Capacity...</option>
                                                        {SOLAR_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Water Pump / Reservoir System' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Capacity...</option>
                                                        {WATER_PUMP_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Elevators / Lifts' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Capacity...</option>
                                                        {ELEVATOR_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Fire Suppression System' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Coverage Area...</option>
                                                        {FIRE_SUPPRESSION_COVERAGES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Security System Hub' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Channels...</option>
                                                        {SECURITY_ENDPOINTS.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Microwave' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Volume...</option>
                                                        {MICROWAVE_VOLUMES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Kettle' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Capacity...</option>
                                                        {KETTLE_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Public Address System' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Power...</option>
                                                        {PA_SYSTEM_POWER.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : formData.subType === 'Display System' ? (
                                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Screen Size...</option>
                                                        {DISPLAY_SIZES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : (
                                                    <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 1.5 kVA, 5 kWp" />
                                                )}
                                                {formData.capacity === 'Others' && (
                                                    <input name="capacityCustom" value={formData.capacityCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Capacity..." />
                                                )}
                                            </div>
                                            {formData.subType === 'Power Backup / UPS' && (
                                                <>
                                                    <div>
                                                        <label className="label">Battery Type</label>
                                                        <select name="batteryType" value={formData.batteryType} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Battery Type...</option>
                                                            <option>VRLA / Sealed Lead-Acid</option>
                                                            <option>Lithium-Ion</option>
                                                            <option>Gel Cell</option>
                                                            <option>NiCd</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Runtime</label>
                                                        <select name="runtime" value={formData.runtime} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Runtime...</option>
                                                            {UPS_RUNTIMES.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                        {formData.runtime === 'Others' && (
                                                            <input name="runtimeCustom" value={formData.runtimeCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Runtime..." />
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                            {formData.subType === 'Refrigerator' && (
                                                <>
                                                    <div>
                                                        <label className="label">Refrigerator Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Type...</option>
                                                            <option>Single Door</option>
                                                            <option>Double Door (Top Freezer)</option>
                                                            <option>Double Door (Bottom Freezer)</option>
                                                            <option>Side-by-Side</option>
                                                            <option>French Door</option>
                                                            <option>Chest Freezer</option>
                                                            <option>Deep Freezer</option>
                                                            <option>Mini / Compact Fridge</option>
                                                            <option>Beverage Cooler</option>
                                                            <option>Others</option>
                                                        </select>
                                                        {formData.type === 'Others' && (
                                                            <input name="typeCustom" value={formData.typeCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify type..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Energy Efficiency Rating</label>
                                                        <select name="starRating" value={formData.starRating} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Rating...</option>
                                                            <option>✴</option>
                                                            <option>✴✴</option>
                                                            <option>✴✴✴</option>
                                                            <option>✴✴✴✴</option>
                                                            <option>✴✴✴✴✴</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Color</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Color...</option>
                                                            {GENERAL_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                            {formData.subType === 'Microwave' && (
                                                <>
                                                    <div>
                                                        <label className="label">Microwave Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Type...</option>
                                                            <option>Solo / Standard</option>
                                                            <option>Grill</option>
                                                            <option>Convection</option>
                                                            <option>Built-in</option>
                                                            <option>Commercial</option>
                                                            <option>Others</option>
                                                        </select>
                                                        {formData.type === 'Others' && (
                                                            <input name="typeCustom" value={formData.typeCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify type..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Power Output (Watts)</label>
                                                        <select name="powerOutput" value={formData.powerOutput} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Wattage...</option>
                                                            {MICROWAVE_POWER.map(p => <option key={p} value={p}>{p}</option>)}
                                                        </select>
                                                        {formData.powerOutput === 'Others' && (
                                                            <input name="powerOutputCustom" value={formData.powerOutputCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type wattage..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Color</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Color...</option>
                                                            {GENERAL_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                            {formData.subType === 'Kettle' && (
                                                <>
                                                    <div>
                                                        <label className="label">Kettle Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Type...</option>
                                                            <option>Electric Jug</option>
                                                            <option>Cordless Electric</option>
                                                            <option>Gooseneck</option>
                                                            <option>Travel / Mini</option>
                                                            <option>Others</option>
                                                        </select>
                                                        {formData.type === 'Others' && (
                                                            <input name="typeCustom" value={formData.typeCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify type..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Color</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Color...</option>
                                                            {GENERAL_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                            {formData.subType === 'Public Address System' && (
                                                <>
                                                    <div>
                                                        <label className="label">Equipment Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Equipment...</option>
                                                            <option>Amplifier</option>
                                                            <option>Audio Mixer</option>
                                                            <option>Microphone (Wired/Wireless)</option>
                                                            <option>Loudspeaker / Horn</option>
                                                            <option>Megaphone</option>
                                                            <option>PA Console System</option>
                                                            <option>Others</option>
                                                        </select>
                                                        {formData.type === 'Others' && (
                                                            <input name="typeCustom" value={formData.typeCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify type..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Color</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Color...</option>
                                                            {GENERAL_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                            {formData.subType === 'Display System' && (
                                                <>
                                                    <div>
                                                        <label className="label">Display Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Type...</option>
                                                            <option>LED TV / Monitor</option>
                                                            <option>LCD Panel</option>
                                                            <option>Interactive Whiteboard / Smart Board</option>
                                                            <option>Projector</option>
                                                            <option>Video Wall</option>
                                                            <option>Others</option>
                                                        </select>
                                                        {formData.type === 'Others' && (
                                                            <input name="typeCustom" value={formData.typeCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify type..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Resolution</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Resolution...</option>
                                                            <option>HD (720p)</option>
                                                            <option>Full HD (1080p)</option>
                                                            <option>2K (1440p)</option>
                                                            <option>4K UHD</option>
                                                            <option>8K UHD</option>
                                                            <option>Others</option>
                                                        </select>
                                                        {formData.sizes === 'Others' && (
                                                            <input name="sizesCustom" value={formData.sizesCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify resolution..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Color</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Color...</option>
                                                            {GENERAL_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                            {formData.subType === 'Elevators / Lifts' && (
                                                <div>
                                                    <label className="label">Number of Floors Served</label>
                                                    <select name="numberOfFloors" value={formData.numberOfFloors} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select No. of Floors...</option>
                                                        {FLOOR_COUNTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                    </select>
                                                    {formData.numberOfFloors === 'Others' && (
                                                        <input name="numberOfFloorsCustom" value={formData.numberOfFloorsCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify..." />
                                                    )}
                                                </div>
                                            )}
                                            {formData.subType === 'Security System Hub' && (
                                                <div>
                                                    <label className="label">No. of Units / Endpoints</label>
                                                    <input name="deskNo" value={formData.deskNo} onChange={handleInputChange} className="input-field" placeholder="e.g., 12 cameras" />
                                                </div>
                                            )}

                                            <div>
                                                <label className="label">Serial Number</label>
                                                <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                            </div>
                                            <div>
                                                <label className="label">Does the asset have an Asset Tag?</label>
                                                <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                                {formData.hasAssetTag === 'Yes' && (
                                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                                        <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                        {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* INTANGIBLE FIXED ASSETS SPECS */}
                                {formData.category === 'Intangible Fixed Assets' && (
                                    <div className="p-5 rounded-2xl bg-purple-500/8 border-2 border-purple-400/25 space-y-4">
                                        <div className="text-xs font-extrabold text-purple-600 uppercase tracking-widest flex items-center gap-2"><span className="w-1 h-4 bg-purple-500 rounded-full inline-block"></span>Intangible Asset Specs</div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Vendor / Developer</label>
                                                <input name="vendor" value={formData.vendor} onChange={handleInputChange} className={`input-field ${errors.vendor ? 'border-red-500' : ''}`} placeholder="e.g., Oracle, Microsoft, SAP" />
                                                {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor}</p>}
                                            </div>
                                            <div>
                                                <label className="label">Version / Edition</label>
                                                <input name="softwareVersion" value={formData.softwareVersion} onChange={handleInputChange} className="input-field" placeholder="e.g., v2024.1, Enterprise" />
                                            </div>
                                            <div>
                                                <label className="label">License Type</label>
                                                <select name="licenseType" value={formData.licenseType} onChange={handleInputChange} className={`input-field ${errors.licenseType ? 'border-red-500' : ''}`}>
                                                    <option value="">Select License Type...</option>
                                                    <option>Perpetual</option>
                                                    <option>Annual Subscription</option>
                                                    <option>Monthly Subscription</option>
                                                    <option>Open Source</option>
                                                    <option>Freeware</option>
                                                    <option>Site License</option>
                                                    <option>Enterprise License</option>
                                                    <option>Others</option>
                                                </select>
                                                {errors.licenseType && <p className="text-red-500 text-xs mt-1">{errors.licenseType}</p>}
                                            </div>
                                            <div>
                                                <label className="label">No. of Users / Seats</label>
                                                <input name="numberOfSeats" value={formData.numberOfSeats} onChange={handleInputChange} className="input-field" placeholder="e.g., 50, Unlimited" />
                                            </div>
                                            <div>
                                                <label className="label">License Key / Reference No.</label>
                                                <input name="licenseKey" value={formData.licenseKey} onChange={handleInputChange} className="input-field" placeholder="License / Serial Key" />
                                            </div>
                                            <div>
                                                <label className="label">Support / Expiry Date</label>
                                                <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} className="input-field" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(formData.category === 'Fleet' || formData.category === 'Plant and Machinery' || formData.category === 'ICT Asset') && (
                                    <div className="p-5 rounded-2xl bg-orange-500/8 border-2 border-orange-400/25 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="text-xs font-extrabold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-4 bg-orange-500 rounded-full inline-block"></span>Technical Specifications
                                            </div>
                                            {(formData.category === 'Fleet' || formData.category === 'Plant and Machinery') && (
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleImageUpload}
                                                        />
                                                        {formData.image ? (
                                                            <img src={formData.image} className="w-full h-full object-cover" alt="Custom Preview" />
                                                        ) : getDefaultImage(formData) ? (
                                                            <img src={getDefaultImage(formData)} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" alt="Asset Preview" />
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2 text-text-muted">
                                                                <Camera size={28} />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span>
                                                            </div>
                                                        )}
                                                        {/* Hover overlay */}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                            <Camera size={22} className="text-white" />
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                            </span>
                                                        </div>
                                                    </label>
                                                    {formData.image && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                                            className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors"
                                                            title="Reset to default image"
                                                        >
                                                            <X size={10} /> Reset to Default
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>


                                        {formData.category === 'Fleet' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">Brand Name</label>
                                                        {errors.brandName && <p className="text-red-500 text-xs mb-1">{errors.brandName}</p>}
                                                        {formData.subType === 'SUV' ? (
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Brand...</option>
                                                                {SUV_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                                            </select>
                                                        ) : formData.subType === 'Pick-up' ? (
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Brand...</option>
                                                                {PICKUP_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                                            </select>
                                                        ) : formData.subType === 'Saloon Cars' ? (
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Brand...</option>
                                                                {SALOON_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                                            </select>
                                                        ) : formData.subType === 'Van' ? (
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Brand...</option>
                                                                {VAN_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                                            </select>
                                                        ) : formData.subType === 'Buses' ? (
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Brand...</option>
                                                                {BUS_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field" placeholder="e.g., Toyota" />
                                                        )}
                                                        {formData.brandName === 'Others' && (
                                                            <input
                                                                name="brandNameCustom"
                                                                value={formData.brandNameCustom}
                                                                onChange={handleInputChange}
                                                                className="input-field mt-2 animate-in slide-in-from-top-1 duration-200"
                                                                placeholder="Type Brand Name..."
                                                            />
                                                        )}

                                                    </div>
                                                    <div>
                                                        <label className="label">Model</label>
                                                        {errors.model && <p className="text-red-500 text-xs mb-1">{errors.model}</p>}
                                                        {formData.subType === 'SUV' && SUV_MODELS[formData.brandName] ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {SUV_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : formData.subType === 'Pick-up' && PICKUP_MODELS[formData.brandName] ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {PICKUP_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : formData.subType === 'Saloon Cars' && SALOON_MODELS[formData.brandName] ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {SALOON_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : formData.subType === 'Van' && VAN_MODELS[formData.brandName] ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {VAN_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : formData.subType === 'Buses' && BUS_MODELS[formData.brandName] ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {BUS_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Hilux" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input
                                                                name="modelCustom"
                                                                value={formData.modelCustom}
                                                                onChange={handleInputChange}
                                                                className="input-field mt-2 animate-in slide-in-from-top-1 duration-200"
                                                                placeholder="Type Model Name..."
                                                            />
                                                        )}

                                                    </div>
                                                    <div>
                                                        <label className="label">Color</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Color...</option>
                                                            {VEHICLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Plate Number</label>
                                                        <input name="plate" value={formData.plate} onChange={handleInputChange} className={`input-field ${errors.plate ? 'border-red-500' : ''}`} placeholder="GT-1234-23" />
                                                        {errors.plate && <p className="text-red-500 text-xs mt-1">{errors.plate}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="label">Chassis Number</label>
                                                        <input name="chassis" value={formData.chassis} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {formData.subType === 'Buses' && (
                                                        <div className="grid grid-cols-2 gap-4 col-span-2">
                                                            <div>
                                                                <label className="label">Type of Bus</label>
                                                                <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Bus Type...</option>
                                                                    {BUS_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Route Name</label>
                                                                <input name="routeName" value={formData.routeName} onChange={handleInputChange} className="input-field" placeholder="e.g., Accra - Kumasi" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-4 col-span-2">
                                                        <div>
                                                            <label className="label">Engine Number</label>
                                                            <input name="engineNumber" value={formData.engineNumber} onChange={handleInputChange} className="input-field" placeholder="Engine Number" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Year of Manufacture</label>
                                                            <input name="yearOfManufacture" type="number" min="1980" max="2030" value={formData.yearOfManufacture} onChange={handleInputChange} className="input-field" placeholder="e.g., 2022" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Fuel Type</label>
                                                            <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Fuel Type...</option>
                                                                {FLEET_FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Transmission</label>
                                                            <select name="transmission" value={formData.transmission} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Transmission...</option>
                                                                {FLEET_TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Engine Size</label>
                                                            <select name="engineSize" value={formData.engineSize} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Engine Size...</option>
                                                                {ENGINE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Mileage (km)</label>
                                                            <select name="mileage" value={formData.mileage} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Mileage Range...</option>
                                                                {MILEAGE_RANGES.map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {formData.category === 'Plant and Machinery' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {PLANT_BRANDS[formData.subType] ? PLANT_BRANDS[formData.subType].map(b => <option key={b} value={b}>{b}</option>) : <option value="Others">Others</option>}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model</label>
                                                        {(PLANT_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {PLANT_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., C27, HD465" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Capacity (kVA / kW / Tonnage)</label>
                                                        <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 50kVA, 20 Tons" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Power / Fuel Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Fuel...</option>
                                                            <option>Diesel</option>
                                                            <option>Petrol</option>
                                                            <option>Gas</option>
                                                            <option>Hybrid</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="label">Serial Number</label>
                                                        <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {formData.subType === 'Network Equipment' && (
                                            <div className="p-5 rounded-2xl bg-cyan-500/8 border-2 border-cyan-400/25 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="text-xs font-extrabold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="w-1 h-4 bg-cyan-500 rounded-full inline-block"></span>Network Equipment Specs
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                        <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group">
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                            {formData.image ? (
                                                                <img src={formData.image} className="w-full h-full object-contain p-1" alt="Custom Preview" />
                                                            ) : (() => {
                                                                const imgUrl = getDefaultImage(formData);
                                                                return imgUrl
                                                                    ? <img src={imgUrl} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" alt="Network Preview" />
                                                                    : <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>;
                                                            })()}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                                <Camera size={22} className="text-white" />
                                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                    {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                                </span>
                                                            </div>
                                                        </label>
                                                        {formData.image && (
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                                <X size={10} /> Reset to Default
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">Network Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Type...</option>
                                                            {NETWORK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Brand</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {NETWORK_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand / Manufacturer..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model</label>
                                                        {(formData.subType === 'Network Equipment' && NETWORK_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {NETWORK_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Catalyst 2960" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">IP Address</label>
                                                        <input name="ipAddress" value={formData.ipAddress} onChange={handleInputChange} className="input-field" placeholder="e.g., 192.168.1.1" />
                                                    </div>
                                                    <div>
                                                        <label className="label">No. of Ports</label>
                                                        <select name="portCount" value={formData.portCount} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Port Count...</option>
                                                            {PORT_COUNTS.map(p => <option key={p} value={p}>{p}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Size / Form Factor</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Form Factor...</option>
                                                            {NETWORK_FORM_FACTORS.map(f => <option key={f} value={f}>{f}</option>)}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="label">Serial Number</label>
                                                        <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {formData.subType === 'Printers' && (
                                            <div className="p-5 rounded-2xl bg-fuchsia-500/8 border-2 border-fuchsia-400/25 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="text-xs font-extrabold text-fuchsia-600 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="w-1 h-4 bg-fuchsia-500 rounded-full inline-block"></span>Printer Specs
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                        <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group">
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                            {formData.image ? (
                                                                <img src={formData.image} className="w-full h-full object-contain p-1" alt="Custom Preview" />
                                                            ) : (() => {
                                                                const imgUrl = getDefaultImage(formData);
                                                                return imgUrl
                                                                    ? <img src={imgUrl} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" alt="Printer Preview" />
                                                                    : <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>;
                                                            })()}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                                <Camera size={22} className="text-white" />
                                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                    {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                                </span>
                                                            </div>
                                                        </label>
                                                        {formData.image && (
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                                <X size={10} /> Reset to Default
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">Printer Type</label>
                                                        <select name="printerType" value={formData.printerType} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Type...</option>
                                                            {PRINTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Brand</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {PRINTER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model</label>
                                                        {(formData.subType === 'Printers' && PRINTER_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {PRINTER_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., LaserJet Pro M404n" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Connectivity</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Connectivity...</option>
                                                            <option>USB</option>
                                                            <option>Network / Ethernet</option>
                                                            <option>Wi-Fi</option>
                                                            <option>Bluetooth</option>
                                                            <option>USB + Network</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Color Capability</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select...</option>
                                                            <option>Colour</option>
                                                            <option>Monochrome (Black & White)</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="label">Serial Number</label>
                                                        <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {formData.subType === 'Scanners' && (
                                            <div className="p-5 rounded-2xl bg-indigo-500/8 border-2 border-indigo-400/25 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>Scanner Specs
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                        <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group">
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                            {formData.image ? (
                                                                <img src={formData.image} className="w-full h-full object-contain p-1" alt="Custom Preview" />
                                                            ) : (() => {
                                                                const imgUrl = getDefaultImage(formData);
                                                                return imgUrl
                                                                    ? <img src={imgUrl} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" alt="Scanner Preview" />
                                                                    : <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>;
                                                            })()}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                                <Camera size={22} className="text-white" />
                                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                    {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                                </span>
                                                            </div>
                                                        </label>
                                                        {formData.image && (
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                                <X size={10} /> Reset to Default
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">Scanner Type</label>
                                                        <select name="scannerType" value={formData.scannerType} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Type...</option>
                                                            {SCANNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Brand</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {SCANNER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model</label>
                                                        {(formData.subType === 'Scanners' && SCANNER_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {SCANNER_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., WorkForce DS-870" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Resolution (DPI)</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Resolution...</option>
                                                            {SCANNER_RESOLUTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Connectivity</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Connectivity...</option>
                                                            <option>USB</option>
                                                            <option>Network / Ethernet</option>
                                                            <option>Wi-Fi</option>
                                                            <option>USB + Wi-Fi</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="label">Serial Number</label>
                                                        <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {formData.subType === 'Photocopier' && (
                                            <div className="p-5 rounded-2xl bg-amber-500/8 border-2 border-amber-400/25 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="text-xs font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="w-1 h-4 bg-amber-500 rounded-full inline-block"></span>Photocopier Specs
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                        <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group">
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                            {formData.image ? (
                                                                <img src={formData.image} className="w-full h-full object-contain p-1" alt="Custom Preview" />
                                                            ) : (() => {
                                                                const imgUrl = getDefaultImage(formData);
                                                                return imgUrl
                                                                    ? <img src={imgUrl} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" alt="Photocopier Preview" />
                                                                    : <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>;
                                                            })()}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                                <Camera size={22} className="text-white" />
                                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                    {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                                </span>
                                                            </div>
                                                        </label>
                                                        {formData.image && (
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                                <X size={10} /> Reset to Default
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">Functions</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Functions...</option>
                                                            <option>Copier Only</option>
                                                            <option>Print + Copy</option>
                                                            <option>Print + Copy + Scan</option>
                                                            <option>All-in-One (Print, Copy, Scan, Fax)</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Brand</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {PHOTOCOPIER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model</label>
                                                        {(formData.subType === 'Photocopier' && PHOTOCOPIER_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {PHOTOCOPIER_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Ricoh MP 2014" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Color Capability</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select...</option>
                                                            <option>Colour</option>
                                                            <option>Monochrome (Black & White)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Paper Size</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Paper Size...</option>
                                                            <option>A4</option>
                                                            <option>A3</option>
                                                            <option>A4 & A3</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="label">Serial Number</label>
                                                        <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial Number" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {formData.subType === 'Computers' && (
                                            <div className="p-5 rounded-2xl bg-sky-500/8 border-2 border-sky-400/25 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="text-xs font-extrabold text-sky-500 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="w-1 h-4 bg-sky-500 rounded-full inline-block"></span>Computer Specs
                                                    </div>
                                                    {formData.type && (
                                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                            <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group">
                                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                                {formData.image ? (
                                                                    <img src={formData.image} className="w-full h-full object-cover" alt="Custom Preview" />
                                                                ) : (() => {
                                                                    const imgUrl = getDefaultImage(formData);
                                                                    return imgUrl
                                                                        ? <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Computer Preview" />
                                                                        : <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>;
                                                                })()}
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                                    <Camera size={22} className="text-white" />
                                                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                        {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                            {formData.image && (
                                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                                    <X size={10} /> Reset to Default
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Type...</option>
                                                            {COMPUTER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Brand Name</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {COMPUTER_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input
                                                                name="brandNameCustom"
                                                                value={formData.brandNameCustom}
                                                                onChange={handleInputChange}
                                                                className="input-field mt-2 animate-in slide-in-from-top-1 duration-200"
                                                                placeholder="Type Brand Name..."
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model</label>
                                                        {(formData.category === 'ICT Asset' && formData.subType === 'Computers' && COMPUTER_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {COMPUTER_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., EliteBook 840 G5, Latitude 5490" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input
                                                                name="modelCustom"
                                                                value={formData.modelCustom}
                                                                onChange={handleInputChange}
                                                                className="input-field mt-2 animate-in slide-in-from-top-1 duration-200"
                                                                placeholder="Type Model Name..."
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Size (inches)</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Screen Size...</option>
                                                            {COMPUTER_DISPLAY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Color</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Color...</option>
                                                            {COMPUTER_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Memory/RAM</label>
                                                        <select name="memorySize" value={formData.memorySize} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select RAM...</option>
                                                            {MEMORY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Processor</label>
                                                        <select name="processor" value={formData.processor} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Processor...</option>
                                                            {PROCESSORS.map(p => <option key={p} value={p}>{p}</option>)}
                                                        </select>
                                                        {formData.processor === 'Others' && (
                                                            <input
                                                                name="processorCustom"
                                                                value={formData.processorCustom}
                                                                onChange={handleInputChange}
                                                                className="input-field mt-2 animate-in slide-in-from-top-1 duration-200"
                                                                placeholder="Type Processor Name..."
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Generation</label>
                                                        <select name="generation" value={formData.generation} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Generation...</option>
                                                            {GENERATIONS.map(gen => <option key={gen} value={gen}>{gen}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Storage Size</label>
                                                        <select name="storageSize" value={formData.storageSize} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Storage...</option>
                                                            <optgroup label="SSD">
                                                                <option>128GB SSD</option>
                                                                <option>256GB SSD</option>
                                                                <option>512GB SSD</option>
                                                                <option>1TB SSD</option>
                                                                <option>2TB SSD</option>
                                                                <option>4TB SSD</option>
                                                            </optgroup>
                                                            <optgroup label="HDD">
                                                                <option>320GB HDD</option>
                                                                <option>500GB HDD</option>
                                                                <option>1TB HDD</option>
                                                                <option>2TB HDD</option>
                                                                <option>4TB HDD</option>
                                                            </optgroup>
                                                            <optgroup label="SSD + HDD">
                                                                <option>256GB SSD + 1TB HDD</option>
                                                                <option>512GB SSD + 1TB HDD</option>
                                                                <option>512GB SSD + 2TB HDD</option>
                                                            </optgroup>
                                                            <option>Others</option>
                                                        </select>
                                                        {formData.storageSize === 'Others' && (
                                                            <input name="storageSizeCustom" value={formData.storageSizeCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="e.g., 256GB SSD, 1TB HDD" />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="label">Serial Number</label>
                                                        <input name="serial" value={formData.serial} onChange={handleInputChange} className="input-field" placeholder="Manufacturer Serial" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}


                                    </div>
                                )}

                                {formData.assetType === 'Non Moveable' && (
                                    <div className="p-5 rounded-2xl bg-indigo-500/8 border-2 border-indigo-400/25 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
                                                Property Details & Specifications
                                            </div>
                                            {(formData.category === 'Land and Buildings' || formData.category === 'Installed Infrastructure & Utility System') && (
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <label className="relative w-40 h-40 rounded-xl bg-bg-card border border-border-color shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group bg-white">
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                        {formData.image ? (
                                                            <img src={formData.image} className="w-full h-full object-cover" alt="Custom Preview" />
                                                        ) : getDefaultImage(formData) ? (
                                                            <img
                                                                src={getDefaultImage(formData)}
                                                                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                                                alt="Asset Preview"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    if (formData.category === 'Installed Infrastructure & Utility System') {
                                                                        e.target.src = '/defaults/network_default.png';
                                                                    } else {
                                                                        e.target.src = formData.subType === 'Roads'
                                                                            ? '/defaults/land_buildings/road_infrastructure.png'
                                                                            : (formData.subType === 'Bridges' || formData.subType === 'Interchanges')
                                                                                ? '/defaults/land_buildings/bridge_infrastructure.png'
                                                                                : '/defaults/land_buildings/office_building.png';
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2 text-text-muted"><Camera size={28} /><span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photo</span></div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                                            <Camera size={22} className="text-white" />
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center leading-tight">
                                                                {formData.image ? 'Change Photo' : 'Upload Photo'}
                                                            </span>
                                                        </div>
                                                    </label>
                                                    {formData.image && (
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-[9px] font-bold text-danger/70 hover:text-danger uppercase tracking-widest flex items-center gap-1 transition-colors" title="Reset to default image">
                                                            <X size={10} /> Reset to Default
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {formData.category === 'Land and Buildings' && (
                                                <>
                                                    {!['Roads', 'Bridges', 'Interchanges'].includes(formData.subType) && (
                                                        <div>
                                                            <label className="label">Plot / Registration Number</label>
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Plot 234, Block B" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="label">Address / Location</label>
                                                        <input name="location" value={formData.location} onChange={handleInputChange} className="input-field" placeholder="e.g., Ministries, Accra" />
                                                    </div>
                                                    {!['Roads', 'Bridges', 'Interchanges'].includes(formData.subType) && (
                                                        <>
                                                            <div>
                                                                <label className="label">Land / Property Size</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field" placeholder="e.g., 2.5 Acres, 400 sqm" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Property Scale (No. of Floors)</label>
                                                                <select name="numberOfFloors" value={formData.numberOfFloors} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select No. of Floors...</option>
                                                                    {FLOOR_COUNTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                                </select>
                                                                {formData.numberOfFloors === 'Others' && (
                                                                    <input name="numberOfFloorsCustom" value={formData.numberOfFloorsCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify..." />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                    <div>
                                                        <label className="label">Ownership Status</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Status...</option>
                                                            <option>Owned (Freehold)</option>
                                                            <option>Leased</option>
                                                            <option>Rented</option>
                                                            <option>Government Allocated</option>
                                                        </select>
                                                    </div>
                                                    {/* GPS Coordinates — shared for all Land & Buildings sub-types */}
                                                    <div>
                                                        <label className="label">GPS Coordinates</label>
                                                        <input name="gpsCoordinates" value={formData.gpsCoordinates} onChange={handleInputChange} className="input-field" placeholder="e.g., 5.5502° N, 0.2174° W" />
                                                    </div>

                                                    {/* ── ADMINISTRATIVE OFFICE BUILDINGS ── */}
                                                    {formData.subType === 'Administrative Office Buildings' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Total Floor Area (sqm)</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 3500 sqm" />
                                                            </div>
                                                            <div>
                                                                <label className="label">No. of Offices / Rooms</label>
                                                                <input name="deskNo" value={formData.deskNo} onChange={handleInputChange} className="input-field" placeholder="e.g., 45" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year Built / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2030" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2010" />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── DEPARTMENTAL AND SECTIONAL BLOCKS ── */}
                                                    {formData.subType === 'Departmental and Sectional Blocks' && (
                                                        <>
                                                            <div>
                                                                <label className="label">No. of Blocks</label>
                                                                <input name="numUnits" type="number" value={formData.numUnits} onChange={handleInputChange} className="input-field" placeholder="e.g., 4" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Block Name / ID</label>
                                                                <input name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field" placeholder="e.g., Block A – Finance" />
                                                            </div>
                                                            <div>
                                                                <label className="label">No. of Offices per Block</label>
                                                                <input name="deskNo" value={formData.deskNo} onChange={handleInputChange} className="input-field" placeholder="e.g., 10" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year Built / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2030" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2008" />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── WAREHOUSES AND STORAGE FACILITIES ── */}
                                                    {formData.subType === 'Warehouses and Storage Facilities' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Storage Capacity</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 5000 m³, 200 Pallets" />
                                                            </div>
                                                            <div>
                                                                <label className="label">No. of Bays / Sections</label>
                                                                <input name="deskNo" value={formData.deskNo} onChange={handleInputChange} className="input-field" placeholder="e.g., 8" />
                                                            </div>
                                                            <div>
                                                                <label className="label">No. of Loading Docks</label>
                                                                <input name="numUnits" value={formData.numUnits} onChange={handleInputChange} className="input-field" placeholder="e.g., 4 Docks" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year Built / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2030" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2005" />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── PARKING LOT ── */}
                                                    {formData.subType === 'Parking Lot' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Parking Capacity (No. of Bays)</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 50" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Parking Type</label>
                                                                <select name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    <option>Open / Surface Parking</option>
                                                                    <option>Covered / Shade Parking</option>
                                                                    <option>Multi-Storey Car Park</option>
                                                                    <option>Underground Parking</option>
                                                                    <option>Others</option>
                                                                </select>
                                                                {formData.roomName === 'Others' && (
                                                                    <input name="typeCustom" value={formData.typeCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Please specify type..." />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── SERVICE CENTERS ── */}
                                                    {formData.subType === 'Service Centers' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Service Center Type</label>
                                                                <select name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    <option>Vehicle Maintenance</option>
                                                                    <option>Equipment Repair</option>
                                                                    <option>ICT Support Center</option>
                                                                    <option>General Maintenance</option>
                                                                    <option>Others</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">No. of Work Bays</label>
                                                                <input name="deskNo" value={formData.deskNo} onChange={handleInputChange} className="input-field" placeholder="e.g., 6" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Workshop / Service Capacity</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 10 Vehicles/day" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year Built / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2030" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2012" />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── HOTELS / GUEST HOUSES ── */}
                                                    {formData.subType === 'Hotels/Guest Houses' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Number of Rooms</label>
                                                                <input name="numRooms" type="number" value={formData.numRooms} onChange={handleInputChange} className="input-field" placeholder="e.g., 24" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Bed Capacity</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 48 Beds" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Star Rating</label>
                                                                <select name="starRating" value={formData.starRating} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Rating...</option>
                                                                    <option>1 Star</option>
                                                                    <option>2 Stars</option>
                                                                    <option>3 Stars</option>
                                                                    <option>4 Stars</option>
                                                                    <option>5 Stars</option>
                                                                    <option>Unrated / Budget</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Key Amenities</label>
                                                                <input name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field" placeholder="e.g., Restaurant, Pool, Gym" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year Built / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2030" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2018" />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── STAFF QUARTERS ── */}
                                                    {formData.subType === 'Staff Quarters' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Number of Units / Apartments</label>
                                                                <input name="numUnits" type="number" value={formData.numUnits} onChange={handleInputChange} className="input-field" placeholder="e.g., 12" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Total Occupancy Capacity</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 48 Persons" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Accommodation Type</label>
                                                                <select name="accommodationType" value={formData.accommodationType} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    <option>Single Room</option>
                                                                    <option>Self-Contained (1 Bedroom)</option>
                                                                    <option>2-Bedroom Apartment</option>
                                                                    <option>3-Bedroom Apartment</option>
                                                                    <option>Bungalow</option>
                                                                    <option>Semi-Detached House</option>
                                                                    <option>Detached House</option>
                                                                    <option>Mixed Types</option>
                                                                    <option>Others</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Year Built / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2030" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2005" />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── STAFF CANTEENS ── */}
                                                    {formData.subType === 'Staff Canteens' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Seating Capacity</label>
                                                                <input name="seatingCapacity" type="number" value={formData.seatingCapacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 150" />
                                                            </div>
                                                            <div>
                                                                <label className="label">No. of Kitchens / Serving Areas</label>
                                                                <input name="deskNo" value={formData.deskNo} onChange={handleInputChange} className="input-field" placeholder="e.g., 2" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Total Floor Area (sqm)</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 500 sqm" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year Built / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2030" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2016" />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── ROADS ── */}
                                                    {formData.subType === 'Roads' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Road Length (km)</label>
                                                                <input name="roadLength" value={formData.roadLength} onChange={handleInputChange} className="input-field" placeholder="e.g., 12.5" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Road Width (m)</label>
                                                                <input name="roadWidth" value={formData.roadWidth} onChange={handleInputChange} className="input-field" placeholder="e.g., 7.3" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Road Classification</label>
                                                                <select name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Class...</option>
                                                                    <option>National Highway</option>
                                                                    <option>Regional / Trunk Road</option>
                                                                    <option>Urban Road</option>
                                                                    <option>Feeder / Rural Road</option>
                                                                    <option>Access Road</option>
                                                                    <option>Others</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Surface Type</label>
                                                                <select name="surfaceType" value={formData.surfaceType} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Surface...</option>
                                                                    <option>Asphalt / Bitumen</option>
                                                                    <option>Concrete</option>
                                                                    <option>Gravel</option>
                                                                    <option>Earth / Unpaved</option>
                                                                    <option>Block Paving</option>
                                                                    <option>Others</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">No. of Lanes</label>
                                                                <select name="numLanes" value={formData.numLanes} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select No. of Lanes...</option>
                                                                    {LANE_COUNTS.map(l => <option key={l} value={l}>{l}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Start Point – End Point</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., Accra – Kumasi" />
                                                            </div>
                                                            {/* Project Data */}
                                                            <div>
                                                                <label className="label">Year of Commencement</label>
                                                                <input name="yearOfCommencement" type="number" min="1900" max="2050" value={formData.yearOfCommencement} onChange={handleInputChange} className="input-field" placeholder="e.g., 2012" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year of Completion / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2050" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2015" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Contractor</label>
                                                                <input name="contractor" value={formData.contractor} onChange={handleInputChange} className="input-field" placeholder="Contracting Company" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Supervisors</label>
                                                                <input name="supervisors" value={formData.supervisors} onChange={handleInputChange} className="input-field" placeholder="e.g., GHA Supervision Team" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Commissioned By</label>
                                                                <input name="commissionedBy" value={formData.commissionedBy} onChange={handleInputChange} className="input-field" placeholder="e.g., H.E. The President" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Last Maintenance (Type)</label>
                                                                <select name="lastMaintenanceType" value={formData.lastMaintenanceType} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Maintenance Type...</option>
                                                                    <option>Routine Maintenance</option>
                                                                    <option>Periodic Maintenance</option>
                                                                    <option>Emergency Maintenance</option>
                                                                    <option>Minor Rehabilitation</option>
                                                                    <option>Major Rehabilitation</option>
                                                                    <option>Resurfacing / Overlay</option>
                                                                    <option>Pothole Patching</option>
                                                                    <option>Reconstruction</option>
                                                                    <option>Others</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Last Maintenance (Date)</label>
                                                                <input name="lastMaintenanceDate" type="date" value={formData.lastMaintenanceDate} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Estimated Residual Life (Years)</label>
                                                                <input name="estimatedResidualLife" type="number" min="0" max="100" value={formData.estimatedResidualLife} onChange={handleInputChange} className="input-field" placeholder="e.g., 10" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Layer Thickness (mm)</label>
                                                                <select name="layerThickness" value={formData.layerThickness} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Thickness...</option>
                                                                    {LAYER_THICKNESSES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── BRIDGES ── */}
                                                    {formData.subType === 'Bridges' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Bridge Length (m)</label>
                                                                <input name="bridgeLength" value={formData.bridgeLength} onChange={handleInputChange} className="input-field" placeholder="e.g., 120" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Bridge Width (m)</label>
                                                                <input name="bridgeWidth" value={formData.bridgeWidth} onChange={handleInputChange} className="input-field" placeholder="e.g., 9" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Load Capacity</label>
                                                                <input name="loadCapacity" value={formData.loadCapacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 40 Tonnes" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Bridge Type</label>
                                                                <select name="bridgeType" value={formData.bridgeType} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    <option>Beam Bridge</option>
                                                                    <option>Arch Bridge</option>
                                                                    <option>Suspension Bridge</option>
                                                                    <option>Cable-Stayed Bridge</option>
                                                                    <option>Box Girder Bridge</option>
                                                                    <option>Culvert</option>
                                                                    <option>Footbridge</option>
                                                                    <option>Others</option>
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="label">No. of Lanes / Spans</label>
                                                                <select name="numLanes" value={formData.numLanes} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Lanes / Spans...</option>
                                                                    {LANE_COUNTS.map(l => <option key={l} value={l}>{l}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Waterway / Route Served</label>
                                                                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., Volta River – Kpong" />
                                                            </div>
                                                            {/* Project Data */}
                                                            <div>
                                                                <label className="label">Year of Commencement</label>
                                                                <input name="yearOfCommencement" type="number" min="1900" max="2050" value={formData.yearOfCommencement} onChange={handleInputChange} className="input-field" placeholder="e.g., 2012" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year of Completion / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2050" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2015" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Contractor</label>
                                                                <input name="contractor" value={formData.contractor} onChange={handleInputChange} className="input-field" placeholder="Contracting Company" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Supervisors</label>
                                                                <input name="supervisors" value={formData.supervisors} onChange={handleInputChange} className="input-field" placeholder="e.g., GHA Supervision Team" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Commissioned By</label>
                                                                <input name="commissionedBy" value={formData.commissionedBy} onChange={handleInputChange} className="input-field" placeholder="e.g., H.E. The President" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Last Maintenance (Type)</label>
                                                                <select name="lastMaintenanceType" value={formData.lastMaintenanceType} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Maintenance Type...</option>
                                                                    <option>Routine Maintenance</option>
                                                                    <option>Periodic Maintenance</option>
                                                                    <option>Emergency Maintenance</option>
                                                                    <option>Minor Rehabilitation</option>
                                                                    <option>Major Rehabilitation</option>
                                                                    <option>Resurfacing / Overlay</option>
                                                                    <option>Pothole Patching</option>
                                                                    <option>Reconstruction</option>
                                                                    <option>Others</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Last Maintenance (Date)</label>
                                                                <input name="lastMaintenanceDate" type="date" value={formData.lastMaintenanceDate} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Estimated Residual Life (Years)</label>
                                                                <input name="estimatedResidualLife" type="number" min="0" max="100" value={formData.estimatedResidualLife} onChange={handleInputChange} className="input-field" placeholder="e.g., 10" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Layer Thickness (mm)</label>
                                                                <select name="layerThickness" value={formData.layerThickness} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Thickness...</option>
                                                                    {LAYER_THICKNESSES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── INTERCHANGES ── */}
                                                    {formData.subType === 'Interchanges' && (
                                                        <>
                                                            <div>
                                                                <label className="label">Interchange Type</label>
                                                                <select name="interchangeType" value={formData.interchangeType} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    <option>Full Cloverleaf</option>
                                                                    <option>Partial Cloverleaf</option>
                                                                    <option>Diamond</option>
                                                                    <option>Trumpet</option>
                                                                    <option>Roundabout / Grade-Separated</option>
                                                                    <option>Stack / Multi-Level</option>
                                                                    <option>Others</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Total No. of Ramps / Lanes</label>
                                                                <select name="numLanes" value={formData.numLanes} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Ramps / Lanes...</option>
                                                                    {LANE_COUNTS.map(l => <option key={l} value={l}>{l}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Total Area / Footprint</label>
                                                                <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Area...</option>
                                                                    {INTERCHANGE_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Roads / Routes Connected</label>
                                                                <input name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field" placeholder="e.g., N1 – Accra–Tema Motorway" />
                                                            </div>
                                                            {/* Project Data */}
                                                            <div>
                                                                <label className="label">Year of Commencement</label>
                                                                <input name="yearOfCommencement" type="number" min="1900" max="2050" value={formData.yearOfCommencement} onChange={handleInputChange} className="input-field" placeholder="e.g., 2012" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Year of Completion / Commissioned</label>
                                                                <input name="yearBuilt" type="number" min="1900" max="2050" value={formData.yearBuilt} onChange={handleInputChange} className="input-field" placeholder="e.g., 2015" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Contractor</label>
                                                                <input name="contractor" value={formData.contractor} onChange={handleInputChange} className="input-field" placeholder="Contracting Company" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Supervisors</label>
                                                                <input name="supervisors" value={formData.supervisors} onChange={handleInputChange} className="input-field" placeholder="e.g., GHA Supervision Team" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Commissioned By</label>
                                                                <input name="commissionedBy" value={formData.commissionedBy} onChange={handleInputChange} className="input-field" placeholder="e.g., H.E. The President" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Last Maintenance (Type)</label>
                                                                <input name="lastMaintenanceType" value={formData.lastMaintenanceType} onChange={handleInputChange} className="input-field" placeholder="e.g., Resurfacing, Patching" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Last Maintenance (Date)</label>
                                                                <input name="lastMaintenanceDate" type="date" value={formData.lastMaintenanceDate} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Estimated Residual Life (Years)</label>
                                                                <input name="estimatedResidualLife" type="number" min="0" max="100" value={formData.estimatedResidualLife} onChange={handleInputChange} className="input-field" placeholder="e.g., 10" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Layer Thickness (mm)</label>
                                                                <select name="layerThickness" value={formData.layerThickness} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Thickness...</option>
                                                                    {LAYER_THICKNESSES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* ── OTHERS ── */}
                                                    {formData.subType === 'Others' && (
                                                        <div className="col-span-2">
                                                            <label className="label">Description / Additional Details</label>
                                                            <input name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field" placeholder="Describe the property or facility..." />
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {formData.category === 'Installed Infrastructure & Utility System' && formData.subType !== 'Air conditioning Systems' && formData.subType !== 'Electrical Wiring and Installation' && formData.subType !== 'Fire Detection and Alarm System' && formData.subType !== 'Access Control Systems' && formData.subType !== 'CCTV' && formData.subType !== 'Plumbing System' && formData.subType !== 'Fans' && formData.subType !== 'Traffic Lights' && formData.subType !== 'Elevators / Lifts' && (
                                                <>
                                                    <div>
                                                        <label className="label">Installation Type / Brand</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS[formData.subType] ? INFRASTRUCTURE_BRANDS[formData.subType].map(b => <option key={b} value={b}>{b}</option>) : <option value="Others">Others</option>}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model / Part Number</label>
                                                        {(INFRASTRUCTURE_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {INFRASTRUCTURE_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., XYZ-100" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">System Capacity / Coverage</label>
                                                        <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 2000 Sqm, 15 Zones" />
                                                    </div>

                                                    <div>
                                                        <label className="label">Warranty End Date</label>
                                                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Installer / Contractor Name</label>
                                                        <input name="vendor" value={formData.vendor} onChange={handleInputChange} className="input-field" placeholder="e.g., Eltel Engineering" />
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'Fans' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS['Fans'].map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Fan Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Fan Type...</option>
                                                            {FAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        {formData.type === 'Others' && (
                                                            <input name="typeCustom" value={formData.typeCustom || ''} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Custom Fan Type..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Blade Size / Sweep</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Blade Size...</option>
                                                            {FAN_BLADE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Power Consumption / Motor</label>
                                                        <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Motor/Power...</option>
                                                            <option>Standard AC Motor (70W - 80W)</option>
                                                            <option>BLDC Energy Efficient (28W - 35W)</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Energy Efficiency Rating</label>
                                                        <select name="starRating" value={formData.starRating} onChange={handleInputChange} className="input-field text-yellow-500">
                                                            <option value="" className="text-gray-900">Select Rating...</option>
                                                            <option value="1 Star">⭐</option>
                                                            <option value="2 Stars">⭐⭐</option>
                                                            <option value="3 Stars">⭐⭐⭐</option>
                                                            <option value="4 Stars">⭐⭐⭐⭐</option>
                                                            <option value="5 Stars">⭐⭐⭐⭐⭐</option>
                                                            <option value="Unrated" className="text-gray-900">Unrated</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Room / Area Installed</label>
                                                        <input name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field" placeholder="e.g., Reception, Office 2" />
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'Traffic Lights' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS['Traffic Lights'].map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">System Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select System...</option>
                                                            <option>Fixed Time Control</option>
                                                            <option>Vehicle Actuated</option>
                                                            <option>Pedestrian Crossing</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Intersection / Location</label>
                                                        <input name="roomName" value={formData.roomName} onChange={handleInputChange} className="input-field" placeholder="e.g., Shiashie Intersection" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Energy Source</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Power...</option>
                                                            <option>National Grid</option>
                                                            <option>Solar Powered</option>
                                                            <option>Hybrid</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'Elevators / Lifts' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {ELEVATOR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand/Manufacturer..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Elevator Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Lift Type...</option>
                                                            <option>Passenger Lift</option>
                                                            <option>Service / Goods Lift</option>
                                                            <option>Hospital Bed Lift</option>
                                                            <option>Dumbwaiter</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Load Capacity / Persons</label>
                                                        <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Capacity...</option>
                                                            {ELEVATOR_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Number of Floors Served</label>
                                                        <select name="numberOfFloors" value={formData.numberOfFloors} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select No. of Floors...</option>
                                                            {FLOOR_COUNTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Installer / Contractor Name</label>
                                                        <input name="vendor" value={formData.vendor} onChange={handleInputChange} className="input-field" placeholder="e.g., CFAO Equipment" />
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'Plumbing System' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS['Plumbing System'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            {!INFRASTRUCTURE_BRANDS['Plumbing System'].includes('Others') && <option value="Others">Others</option>}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="label">Fixture / Component Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Fixture Type...</option>
                                                            <option>Water Supply Piping (Lot)</option>
                                                            <option>Drainage & Sewerage (Lot)</option>
                                                            <option>Sanitary Fixtures (WC, Basin, Urinal)</option>
                                                            <option>Water Storage Tanks</option>
                                                            <option>Pumps & Booster Sets</option>
                                                            <option>Water Treatment Units</option>
                                                            <option>Hot Water System</option>
                                                            <option>Fire Hydrant / Sprinkler (Plumbing)</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Pipe Material</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Material...</option>
                                                            <option>uPVC</option>
                                                            <option>CPVC</option>
                                                            <option>PPR (Polypropylene)</option>
                                                            <option>Galvanized Steel (GS)</option>
                                                            <option>Copper</option>
                                                            <option>HDPE</option>
                                                            <option>Cast Iron</option>
                                                            <option>Stainless Steel</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Water Supply Type</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Supply Type...</option>
                                                            <option>Mains / Municipal Supply</option>
                                                            <option>Borehole / Well</option>
                                                            <option>Overhead Tank Feed</option>
                                                            <option>Pressurised (Booster Pump)</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">System Coverage / No. of Fixtures</label>
                                                        <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 3 Floors, 20 Fixtures" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Warranty End Date</label>
                                                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Installer / Contractor Name</label>
                                                        <input name="vendor" value={formData.vendor} onChange={handleInputChange} className="input-field" placeholder="e.g., Ghana Plumbing Works Ltd." />
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'CCTV' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS['CCTV'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            {!INFRASTRUCTURE_BRANDS['CCTV'].includes('Others') && <option value="Others">Others</option>}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="label">Camera Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Camera Type...</option>
                                                            <option>Dome Camera</option>
                                                            <option>Bullet Camera</option>
                                                            <option>PTZ Camera</option>
                                                            <option>Turret Camera</option>
                                                            <option>Fisheye / 360° Camera</option>
                                                            <option>Box Camera</option>
                                                            <option>Network Video Recorder (NVR)</option>
                                                            <option>Digital Video Recorder (DVR)</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Resolution</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Resolution...</option>
                                                            <option>1MP (720p)</option>
                                                            <option>2MP (1080p Full HD)</option>
                                                            <option>4MP (2K)</option>
                                                            <option>5MP (Super HD)</option>
                                                            <option>8MP (4K Ultra HD)</option>
                                                            <option>12MP+</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Night Vision / IR Range</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select IR Range...</option>
                                                            <option>No Night Vision</option>
                                                            <option>Up to 20m IR</option>
                                                            <option>Up to 30m IR</option>
                                                            <option>Up to 50m IR</option>
                                                            <option>Up to 80m IR</option>
                                                            <option>100m+ IR</option>
                                                            <option>Full Colour Night Vision</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Storage / Recording Type</label>
                                                        <select name="storageType" value={formData.storageType} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Storage Type...</option>
                                                            <option>NVR (Network Video Recorder)</option>
                                                            <option>DVR (Digital Video Recorder)</option>
                                                            <option>Cloud Storage</option>
                                                            <option>SD Card (Edge Storage)</option>
                                                            <option>Hybrid (Local + Cloud)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">No. of Cameras</label>
                                                        <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 16 Cameras" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Warranty End Date</label>
                                                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Installer / Contractor Name</label>
                                                        <input name="vendor" value={formData.vendor} onChange={handleInputChange} className="input-field" placeholder="e.g., SecureTech Ghana Ltd." />
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'Access Control Systems' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS['Access Control Systems'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            {!INFRASTRUCTURE_BRANDS['Access Control Systems'].includes('Others') && <option value="Others">Others</option>}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model / Series</label>
                                                        {(INFRASTRUCTURE_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {INFRASTRUCTURE_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., F18, iClock 880" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Controller Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Controller Type...</option>
                                                            <option>Standalone Controller</option>
                                                            <option>Networked / IP Controller</option>
                                                            <option>Cloud-Based Controller</option>
                                                            <option>Panel-Based Controller</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Authentication Method</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Method...</option>
                                                            <option>Card / RFID</option>
                                                            <option>Fingerprint (Biometric)</option>
                                                            <option>Face Recognition</option>
                                                            <option>PIN / Keypad</option>
                                                            <option>Card + PIN (Multi-Factor)</option>
                                                            <option>Mobile / NFC</option>
                                                            <option>Retina / Iris Scan</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Connectivity</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Connectivity...</option>
                                                            <option>TCP/IP (Wired)</option>
                                                            <option>Wi-Fi</option>
                                                            <option>RS-485</option>
                                                            <option>Wiegand</option>
                                                            <option>4G / LTE</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">No. of Doors / Entry Points</label>
                                                        <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 4 Doors, 2 Entry Points" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Warranty End Date</label>
                                                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Installer / Contractor Name</label>
                                                        <input name="vendor" value={formData.vendor} onChange={handleInputChange} className="input-field" placeholder="e.g., SecureTech Ghana Ltd." />
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'Fire Detection and Alarm System' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS['Fire Detection and Alarm System'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            {!INFRASTRUCTURE_BRANDS['Fire Detection and Alarm System'].includes('Others') && <option value="Others">Others</option>}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model / Part Number</label>
                                                        {(INFRASTRUCTURE_MODELS[formData.brandName]) ? (
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Model...</option>
                                                                {INFRASTRUCTURE_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., DXc1, FPA-1000" />
                                                        )}
                                                        {formData.model === 'Others' && (
                                                            <input name="modelCustom" value={formData.modelCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Model Name..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">System Technology</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Technology...</option>
                                                            <option>Addressable System</option>
                                                            <option>Conventional System</option>
                                                            <option>Wireless System</option>
                                                            <option>Hybrid System</option>
                                                            <option>Aspirating Smoke Detection</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Number of Zones / Loops</label>
                                                        <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 4 Zones, 2 Loops" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Total Devices Capacity</label>
                                                        <input name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field" placeholder="e.g., 250 Devices, 100 Detectors" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Battery Backup Details</label>
                                                        <input name="color" value={formData.color} onChange={handleInputChange} className="input-field" placeholder="e.g., 2x 12V 7Ah" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Warranty End Date</label>
                                                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Installer / Contractor Name</label>
                                                        <input name="vendor" value={formData.vendor} onChange={handleInputChange} className="input-field" placeholder="e.g., Safety First Corp." />
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'Electrical Wiring and Installation' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS['Electrical Wiring and Installation'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            {!INFRASTRUCTURE_BRANDS['Electrical Wiring and Installation'].includes('Others') && <option value="Others">Others</option>}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="label">Component Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Component...</option>
                                                            <option>Switchgear / Distribution Board</option>
                                                            <option>Circuit Breaker / MCCB</option>
                                                            <option>Transformers</option>
                                                            <option>Power Cables / Wiring (Lot)</option>
                                                            <option>Control Panels</option>
                                                            <option>Lighting Fixtures & Controls</option>
                                                            <option>Earthing & Lightning Protection</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Power Rating / Capacity</label>
                                                        <input name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field" placeholder="e.g., 400A, 100kVA, 50Hz" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Number of Phases</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Phase...</option>
                                                            <option>Single Phase (1Φ)</option>
                                                            <option>Three Phase (3Φ)</option>
                                                            <option>DC / Special</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Voltage Class</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Voltage...</option>
                                                            <option>Low Voltage (230V / 400V)</option>
                                                            <option>Medium Voltage (11kV / 33kV)</option>
                                                            <option>High Voltage</option>
                                                            <option>Extra Low Voltage (Data/Comm)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Warranty End Date</label>
                                                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Installer / Contractor Name</label>
                                                        <input name="vendor" value={formData.vendor} onChange={handleInputChange} className="input-field" placeholder="e.g., Eltel Engineering" />
                                                    </div>
                                                </>
                                            )}

                                            {formData.subType === 'Air conditioning Systems' && (
                                                <>
                                                    <div>
                                                        <label className="label">Brand</label>
                                                        <select name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Brand...</option>
                                                            {INFRASTRUCTURE_BRANDS['Air conditioning Systems'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            {!INFRASTRUCTURE_BRANDS['Air conditioning Systems'].includes('Others') && <option value="Others">Others</option>}
                                                        </select>
                                                        {formData.brandName === 'Others' && (
                                                            <input name="brandNameCustom" value={formData.brandNameCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Brand..." />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="label">AC Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select AC Type...</option>
                                                            <option>Split AC</option>
                                                            <option>Cassette AC</option>
                                                            <option>Standing AC</option>
                                                            <option>Window AC</option>
                                                            <option>VRV/VRF System</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Cooling Capacity (HP / BTU)</label>
                                                        <select name="capacity" value={formData.capacity} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Capacity...</option>
                                                            <option>1.0 HP (9,000 BTU)</option>
                                                            <option>1.5 HP (12,000 BTU)</option>
                                                            <option>2.0 HP (18,000 BTU)</option>
                                                            <option>2.5 HP (22,000 BTU)</option>
                                                            <option>3.0 HP (24,000 BTU)</option>
                                                            <option>4.0 HP (36,000 BTU)</option>
                                                            <option>5.0 HP (48,000 BTU)</option>
                                                            <option>Others</option>
                                                        </select>
                                                        {formData.capacity === 'Others' && (
                                                            <input name="capacityCustom" value={formData.capacityCustom} onChange={handleInputChange} className="input-field mt-2 animate-in slide-in-from-top-1 duration-200" placeholder="Type Capacity..." />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">Energy Efficiency Rating</label>
                                                        <select name="starRating" value={formData.starRating} onChange={handleInputChange} className="input-field text-yellow-500">
                                                            <option value="" className="text-gray-900">Select Rating...</option>
                                                            <option value="1 Star">⭐</option>
                                                            <option value="2 Stars">⭐⭐</option>
                                                            <option value="3 Stars">⭐⭐⭐</option>
                                                            <option value="4 Stars">⭐⭐⭐⭐</option>
                                                            <option value="5 Stars">⭐⭐⭐⭐⭐</option>
                                                            <option value="Unrated" className="text-gray-900">Unrated</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Technology / Inverter</label>
                                                        <select name="sizes" value={formData.sizes} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Technology...</option>
                                                            <option>Inverter</option>
                                                            <option>Non-Inverter</option>
                                                            <option>Dual Inverter</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Refrigerant Type</label>
                                                        <select name="color" value={formData.color} onChange={handleInputChange} className="input-field">
                                                            <option value="">Select Refrigerant...</option>
                                                            <option>R32</option>
                                                            <option>R410A</option>
                                                            <option>R22</option>
                                                            <option>R290</option>
                                                            <option>Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label">Warranty End Date</label>
                                                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Installer / Contractor Name</label>
                                                        <input name="vendor" value={formData.vendor} onChange={handleInputChange} className="input-field" placeholder="e.g., Eltel Engineering" />
                                                    </div>
                                                </>
                                            )}

                                            {/* Shared Fields */}
                                            <div>
                                                <label className="label">Does the asset have an Asset Tag / Reg Tag?</label>
                                                <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-4">
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                                {formData.hasAssetTag === 'Yes' && (
                                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                                        <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                        {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* IMAGE UPLOADER — Non Fixed Asset (above Product Details) */}
                                {formData.majorCategory === 'Non Fixed Asset' && (
                                    <div className="p-5 rounded-2xl bg-primary/5 border-2 border-primary/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-extrabold text-primary uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-4 bg-primary rounded-full inline-block"></span>
                                                Asset Image / Photo
                                            </div>
                                            {formData.image && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                                    className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                                                >
                                                    Remove Photo
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-5 items-center">
                                            <div className="w-32 h-32 rounded-2xl bg-bg-card border-2 border-dashed border-border-color/60 flex flex-col items-center justify-center overflow-hidden shadow-inner group transition-all hover:border-primary/40 relative">
                                                {formData.image ? (
                                                    <img src={formData.image} className="w-full h-full object-cover" alt="Asset Upload" />
                                                ) : getDefaultImage(formData) ? (
                                                    <img src={getDefaultImage(formData)} className="w-full h-full object-cover opacity-80" alt="Default Asset" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-text-muted group-hover:text-primary transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter">No Image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="text-xs text-text-muted leading-relaxed">
                                                    Upload a clear photo of the asset for better identification.
                                                    <br />Support: JPG, PNG, GIF (Max 5MB)
                                                </div>
                                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-[11px] font-extrabold uppercase tracking-widest rounded-xl cursor-pointer hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                    {formData.image ? 'Change Photo' : 'Choose Photo'}
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.majorCategory === 'Non Fixed Asset' && (
                                    <div className="p-5 rounded-2xl bg-teal-500/8 border-2 border-teal-400/25 space-y-4">
                                        <div className="text-xs font-extrabold text-teal-500 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1 h-4 bg-teal-500 rounded-full inline-block"></span>
                                            {formData.category === 'Cash and bank balance' ? 'Account Details' : 'Product Details & Specifications'}
                                        </div>

                                        {formData.category === 'Cash and bank balance' ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="label">Bank Name</label>
                                                    <input name="bankName" value={formData.bankName || ''} onChange={handleInputChange} className={`input-field ${errors.bankName ? 'border-red-500' : ''}`} placeholder="e.g., GCB Bank, Ecobank" />
                                                    {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                                                </div>
                                                <div>
                                                    <label className="label">Account Number</label>
                                                    <input name="accountNumber" value={formData.accountNumber || ''} onChange={handleInputChange} className={`input-field ${errors.accountNumber ? 'border-red-500' : ''}`} placeholder="00000000000" />
                                                    {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                                                </div>
                                                <div>
                                                    <label className="label">Account Type</label>
                                                    <select name="accountType" value={formData.accountType || ''} onChange={handleInputChange} className="input-field">
                                                        <option value="">Select Type...</option>
                                                        <option value="Current">Current</option>
                                                        <option value="Savings">Savings</option>
                                                        <option value="Fixed Deposit">Fixed Deposit</option>
                                                        <option value="Petty Cash">Petty Cash</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="label">Branch</label>
                                                    <input name="branch" value={formData.branch || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., High Street Branch" />
                                                </div>
                                                <div>
                                                    <label className="label">Currency</label>
                                                    <select name="currency" value={formData.currency || 'GHS'} onChange={handleInputChange} className="input-field">
                                                        <option value="GHS">GHS - Ghana Cedi</option>
                                                        <option value="USD">USD - US Dollar</option>
                                                        <option value="EUR">EUR - Euro</option>
                                                        <option value="GBP">GBP - British Pound</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="label">Balance Amount</label>
                                                    <input name="balanceAmount" type="number" step="0.01" value={formData.balanceAmount || ''} onChange={handleInputChange} className={`input-field ${errors.balanceAmount ? 'border-red-500' : ''}`} placeholder="0.00" />
                                                    {errors.balanceAmount && <p className="text-red-500 text-xs mt-1">{errors.balanceAmount}</p>}
                                                </div>
                                            </div>
                                        ) : formData.category === 'Office Consumables' ? (
                                            /* ── OFFICE CONSUMABLES: sub-type aware form ── */
                                            <div className="space-y-4">
                                                {/* Printing Papers */}
                                                {formData.subType === 'Printing Papers' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {PRINTING_PAPER_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify brand..." />}
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Paper Size</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Size...</option>
                                                                {PAPER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Paper Weight (GSM)</label>
                                                            <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Weight...</option>
                                                                {PAPER_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                                                            </select>
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity (Reams / Boxes)</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 10" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Expiry Date (if applicable)</label>
                                                            <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Batch / Serial Number</label>
                                                            <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="Batch No." />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Toner and Ink Cartridges */}
                                                {formData.subType === 'Toner and ink Cartridges' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {CARTRIDGE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify brand..." />}
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Cartridge Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Type...</option>
                                                                {CARTRIDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Color / Channel</label>
                                                            <select name="color" value={formData.color || ''} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Color...</option>
                                                                {CARTRIDGE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Compatible Printer Model</label>
                                                            <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., HP LaserJet M428" />
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Part Number</label>
                                                            <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., CF256A" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 5" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Stationery Items */}
                                                {formData.subType === 'Stationery items' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Item Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Item Type...</option>
                                                                {STATIONERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {STATIONERY_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify brand..." />}
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Unit of Measure</label>
                                                            <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., Boxes, Packs, Pieces" />
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 20" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Shared: no sub-type selected yet */}
                                                {!formData.subType && (
                                                    <p className="text-text-muted text-xs italic py-2">← Select a sub-type in General Info to see specific fields.</p>
                                                )}

                                                {/* Shared bottom section */}
                                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-color/30">
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-2">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : formData.category === 'Safety and Productive Equipment' ? (
                                            /* ── SAFETY & PRODUCTIVE EQUIPMENT: sub-type aware form ── */
                                            <div className="space-y-4">
                                                {/* Helmet / Hard Hat */}
                                                {formData.subType === 'Helmet / Hard Hat' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['MSA', '3M', 'JSP', 'Uvex', 'Delta Plus', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Color</label>
                                                            <select name="color" value={formData.color || ''} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Color...</option>
                                                                {HELMET_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Safety Class</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Class...</option>
                                                                {HELMET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Standard / Certification</label>
                                                            <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Standard...</option>
                                                                {HELMET_STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 20" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Expiry / Replace-by Date</label>
                                                            <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Reflective Jacket / Vest */}
                                                {formData.subType === 'Reflective Jacket / Vest' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['Delta Plus', 'JSP', 'Uvex', 'Honeywell', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Visibility Class</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Class...</option>
                                                                {VEST_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Color</label>
                                                            <select name="color" value={formData.color || ''} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Color...</option>
                                                                {VEST_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Size</label>
                                                            <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Size...</option>
                                                                {PPE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 50" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Safety Gloves */}
                                                {formData.subType === 'Safety Gloves' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['3M', 'Honeywell', 'Uvex', 'Delta Plus', 'Kimberly-Clark', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Glove Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Type...</option>
                                                                {GLOVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Size</label>
                                                            <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Size...</option>
                                                                {GLOVE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity (Pairs / Packs)</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 100" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Safety Boots */}
                                                {formData.subType === 'Safety Boots / Footwear' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['Caterpillar (CAT)', 'Delta Plus', 'Uvex', 'cofra', 'Honeywell', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Boot Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Type...</option>
                                                                {BOOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Shoe Size (EU)</label>
                                                            <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Size...</option>
                                                                {BOOT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity (Pairs)</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 10" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Protective Wear / Coveralls */}
                                                {formData.subType === 'Protective Wear / Coveralls' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['Honeywell', 'Delta Plus', 'Kimberly-Clark', '3M', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Type / Model</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Type...</option>
                                                                {['Disposable Coverall', 'Chemical Suit', 'Fire Retardant Coverall', 'High-Visibility Coverall', 'Others'].map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Size</label>
                                                            <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Size...</option>
                                                                {PPE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 30" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Eye and Face Protection */}
                                                {formData.subType === 'Eye and Face Protection' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['3M', 'Honeywell', 'Uvex', 'JSP', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Protection Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Type...</option>
                                                                {EYE_PROTECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 15" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Unit of Measure</label>
                                                            <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., Pieces, Boxes" />
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Respiratory Protection */}
                                                {formData.subType === 'Respiratory Protection' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['3M', 'Honeywell', 'Draeger', 'Scott Safety', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Respirator Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Type...</option>
                                                                {RESP_PROTECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 50" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Unit of Measure</label>
                                                            <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., Boxes, Pieces" />
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Fall Protection / Harness */}
                                                {formData.subType === 'Fall Protection / Harness' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['MSA', 'Honeywell', 'Delta Plus', 'JSP', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Harness / Equipment Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Type...</option>
                                                                {HARNESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Size</label>
                                                            <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Size...</option>
                                                                {PPE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 5" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Next Inspection Date</label>
                                                            <input type="date" name="warrantyExpiry" value={formData.warrantyExpiry || ''} onChange={handleInputChange} className="input-field" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Fire Extinguisher */}
                                                {formData.subType === 'Fire Extinguisher' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {['Amerex', 'Kidde', 'Ansul', 'Britannia', 'Gloria', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Agent Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Agent...</option>
                                                                {EXTINGUISHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Capacity / Size</label>
                                                            <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Capacity...</option>
                                                                {EXTINGUISHER_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 4" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Last Service / Inspection Date</label>
                                                            <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Next Service Due</label>
                                                            <input type="date" name="warrantyExpiry" value={formData.warrantyExpiry || ''} onChange={handleInputChange} className="input-field" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Serial Number</label>
                                                            <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., FE-20241010-01" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Location / Mounted At</label>
                                                            <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Server Room Door" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* First Aid Kit */}
                                                {formData.subType === 'First Aid Kit' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Kit Type</label>
                                                            <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                <option value="">Select Type...</option>
                                                                {FIRST_AID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="label">Brand / Supplier</label>
                                                            <input name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="e.g., St John Ambulance" />
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 3" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Expiry / Restock Date</label>
                                                            <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                        </div>
                                                        <div>
                                                            <label className="label">Contents / Spec</label>
                                                            <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., 150-item kit, BS 8599-1" />
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Others / no sub-type */}
                                                {(formData.subType === 'Others' || !formData.subType) && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label">Brand / Manufacturer</label>
                                                            <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                <option value="">Select Brand...</option>
                                                                {SAFETY_EQUIPMENT_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                            </select>
                                                            {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify brand..." />}
                                                            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Model / Description</label>
                                                            {SAFETY_EQUIPMENT_MODELS[formData.brandName] ? (
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Model...</option>
                                                                    {SAFETY_EQUIPMENT_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                                </select>
                                                            ) : (
                                                                <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Hard Hat, Safety Harness" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="label">Unit of Measure / Size</label>
                                                            <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., Pieces, Pairs" />
                                                            {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="label">Quantity</label>
                                                            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 10" />
                                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Shared bottom */}
                                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-color/30">
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-2">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* ── IT CONSUMABLES ── */
                                            formData.category === 'IT and Technical Consumables' ? (
                                                <div className="space-y-4">
                                                    {/* USB / Flash Drives */}
                                                    {formData.subType === 'USB / Flash Drives' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Brand...</option>
                                                                    {['SanDisk', 'Kingston', 'Samsung', 'HP', 'Verbatim', 'PNY', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Storage Capacity</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Capacity...</option>
                                                                    {USB_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Interface Standard</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Standard...</option>
                                                                    {USB_STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 10" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Serial / Batch Number</label>
                                                                <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="Batch No." />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* External Hard Drives */}
                                                    {formData.subType === 'External Hard Drives' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* Row 1: Brand | Drive Type */}
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Brand...</option>
                                                                    {['Western Digital (WD)', 'Seagate', 'Samsung', 'SanDisk', 'Toshiba', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Drive Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    {['HDD (Hard Disk)', 'SSD (Solid State)', 'Portable SSD', 'NVMe SSD', 'Others'].map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            {/* Row 2: Storage Capacity | Compatible With */}
                                                            <div>
                                                                <label className="label">Storage Capacity</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Capacity...</option>
                                                                    {HDD_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Compatible With</label>
                                                                <select name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Device Type...</option>
                                                                    <option value="Laptop">Laptop</option>
                                                                    <option value="Desktop">Desktop</option>
                                                                    <option value="All-in-One">All-in-One</option>
                                                                    <option value="Universal (All Devices)">Universal (All Devices)</option>
                                                                </select>
                                                            </div>
                                                            {/* Row 3: Serial Number | Warranty Expiry */}
                                                            <div>
                                                                <label className="label">Serial Number</label>
                                                                <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., SN-1234567" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Warranty Expiry</label>
                                                                <input type="date" name="warrantyExpiry" value={formData.warrantyExpiry || ''} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                            {/* Row 4: Quantity */}
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 5" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Network Cables */}
                                                    {formData.subType === 'Network Cables' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Cable Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    {['Ethernet (Cat5e)', 'Ethernet (Cat6)', 'Ethernet (Cat6a)', 'Fibre Optic (Single Mode)', 'Fibre Optic (Multi Mode)', 'Patch Cable', 'Others'].map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Length</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., 1m, 5m, 100m roll" />
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Brand...</option>
                                                                    {['Cisco', 'TP-Link', 'AMP', 'Legrand', 'D-Link', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 20" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Power Cables / Adapters */}
                                                    {formData.subType === 'Power Cables / Adapters' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Adapter / Cable Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    {ADAPTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Compatible / For Device</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., HP Laptop, Dell Laptop" />
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <input name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="e.g., Anker, Belkin, HP" />
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 8" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* UPS Batteries */}
                                                    {formData.subType === 'UPS Batteries' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Brand...</option>
                                                                    {['APC', 'Eaton', 'Yuasa', 'CSB', 'Vision', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Compatible UPS Model</label>
                                                                <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., APC Back-UPS 1000" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Voltage / Rating</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., 12V 7Ah" />
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 4" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Install / Replace Date</label>
                                                                <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Wireless Peripherals */}
                                                    {formData.subType === 'Wireless Peripherals' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Peripheral Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    {PERIPHERAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Brand...</option>
                                                                    {['Logitech', 'HP', 'Dell', 'Microsoft', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Connectivity</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select...</option>
                                                                    {['Wireless (USB Dongle)', 'Bluetooth', 'Both', 'Others'].map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 5" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* RAM / Memory Modules */}
                                                    {formData.subType === 'RAM / Memory Modules' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* Row 1: Brand | RAM Type */}
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Brand...</option>
                                                                    {['Kingston', 'Corsair', 'Crucial', 'G.Skill', 'Samsung', 'Hynix', 'Adata', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">RAM Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    {RAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            {/* Row 2: Capacity | Compatible With */}
                                                            <div>
                                                                <label className="label">Capacity</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Capacity...</option>
                                                                    {RAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Compatible With</label>
                                                                <select name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Device Type...</option>
                                                                    <option value="Laptop">Laptop</option>
                                                                    <option value="Desktop">Desktop</option>
                                                                    <option value="All-in-One">All-in-One</option>
                                                                    <option value="Server">Server</option>
                                                                </select>
                                                            </div>
                                                            {/* Row 3: Quantity */}
                                                            <div>
                                                                <label className="label">Quantity (Sticks)</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 4" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Others / no sub-type selected */}
                                                    {(formData.subType === 'Others' || !formData.subType) && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Brand...</option>
                                                                    {IT_CONSUMABLES_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify brand..." />}
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Model / Part Number</label>
                                                                {IT_CONSUMABLES_MODELS[formData.brandName] ? (
                                                                    <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                        <option value="">Select Model...</option>
                                                                        {IT_CONSUMABLES_MODELS[formData.brandName].map(m => <option key={m} value={m}>{m}</option>)}
                                                                    </select>
                                                                ) : (
                                                                    <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="Model / part number" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="label">Unit of Measure</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., Pieces, Boxes" />
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 10" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Serial / Batch Number</label>
                                                                <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="Batch / Serial No." />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Shared bottom: Asset Tag */}
                                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-color/30">
                                                        <div>
                                                            <label className="label">Does the asset have an Asset Tag?</label>
                                                            <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-2">
                                                                <option value="No">No</option>
                                                                <option value="Yes">Yes</option>
                                                            </select>
                                                            {formData.hasAssetTag === 'Yes' && (
                                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                                    <label className="label">Asset Tag Number</label>
                                                                    <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="e.g. GHA-XYZ" />
                                                                    {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                            ) : formData.category === 'Fuel and Energy Supplies' ? (
                                                /* ── FUEL & ENERGY SUPPLIES: sub-type aware form ── */
                                                <div className="space-y-4">
                                                    {/* Petrol */}
                                                    {formData.subType === 'Petrol' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Octane Rating</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Grade...</option>
                                                                    {FUEL_OCTANE.map(g => <option key={g} value={g}>{g}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Supplier / Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Supplier...</option>
                                                                    {['Shell', 'Total (TotalEnergies)', 'Goil', 'Puma Energy', 'Star Oil', 'Zen Petroleum', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify supplier..." />}
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Volume / Quantity</label>
                                                                <input name="capacity" type="number" min="0" step="0.1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 200" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Unit of Measure</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Unit...</option>
                                                                    {FUEL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Delivery / Fill Date</label>
                                                                <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Storage Location / Tank</label>
                                                                <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., Main Generator Tank" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Diesel */}
                                                    {formData.subType === 'Diesel' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Diesel Grade</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Grade...</option>
                                                                    {DIESEL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Supplier / Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Supplier...</option>
                                                                    {['Shell', 'Total (TotalEnergies)', 'Goil', 'Puma Energy', 'Star Oil', 'Zen Petroleum', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify supplier..." />}
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Volume / Quantity</label>
                                                                <input name="capacity" type="number" min="0" step="0.1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 500" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Unit of Measure</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Unit...</option>
                                                                    {FUEL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Delivery / Fill Date</label>
                                                                <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Storage Location / Tank</label>
                                                                <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., Heavy Equipment Tank" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Liquefied Gas / Others */}
                                                    {(formData.subType === 'Liquefied Gas (LPG)' || formData.subType === 'Lubricating Grease' || formData.subType === 'Engine Oil' || formData.subType === 'Others' || !formData.subType) && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Supplier / Brand</label>
                                                                <select name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Supplier...</option>
                                                                    {['Shell', 'Total (TotalEnergies)', 'Goil', 'Puma Energy', 'Star Oil', 'Zen Petroleum', 'Others'].map(b => <option key={b} value={b}>{b}</option>)}
                                                                </select>
                                                                {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify supplier..." />}
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Specific Description / Grade</label>
                                                                <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Propane, 15W-40" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Volume / Quantity</label>
                                                                <input name="capacity" type="number" min="0" step="0.1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 50" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Unit of Measure</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Unit...</option>
                                                                    {FUEL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Delivery / Fill Date</label>
                                                                <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Storage Location / Cylinder</label>
                                                                <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., Main Kitchen Cylinder" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                            ) : formData.category === 'Maintenance and Workshop Supplies' ? (
                                                /* ── MAINTENANCE & WORKSHOP SUPPLIES: sub-type aware form ── */
                                                <div className="space-y-4">
                                                    {/* Spare Parts for Machinery */}
                                                    {formData.subType === 'Spare Parts for Machinery' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <datalist id="spare-parts-brands">
                                                                {SPARE_PARTS_BRANDS.map(brand => <option key={brand} value={brand} />)}
                                                            </datalist>
                                                            <div>
                                                                <label className="label">Brand / Manufacturer</label>
                                                                <input list="spare-parts-brands" name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="Select or type brand..." />
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Part Name / Description</label>
                                                                <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Alternator, Fuel Filter" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Part / OEM Number</label>
                                                                <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., OEM-12345" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Compatible Machine / Asset</label>
                                                                <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., Generator G-100" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 10" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Unit of Measure</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., Pieces, Sets" />
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Lubricants and Oil */}
                                                    {formData.subType === 'Lubricants and Oil' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <datalist id="lubricant-brands">
                                                                {LUBRICANT_BRANDS.map(brand => <option key={brand} value={brand} />)}
                                                            </datalist>
                                                            <div>
                                                                <label className="label">Brand / Manufacturer</label>
                                                                <input list="lubricant-brands" name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="Select or type brand..." />
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Lubricant Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    {LUBRICANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Grade / Viscosity</label>
                                                                <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., 15W-40, ISO 68" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Capacity / Size per Unit</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Capacity...</option>
                                                                    {LUBRICANT_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 5" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Hand Tools */}
                                                    {formData.subType === 'Hand Tools' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <datalist id="hand-tools-brands">
                                                                {HAND_TOOL_BRANDS.map(brand => <option key={brand} value={brand} />)}
                                                            </datalist>
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <input list="hand-tools-brands" name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="Select or type brand..." />
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Tool Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Tool Type...</option>
                                                                    {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Specifications / Size</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., 10mm, Set of 10" />
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 2" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Power Tools */}
                                                    {formData.subType === 'Power Tools' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <datalist id="power-tools-brands">
                                                                {POWER_TOOL_BRANDS.map(brand => <option key={brand} value={brand} />)}
                                                            </datalist>
                                                            <div>
                                                                <label className="label">Brand</label>
                                                                <input list="power-tools-brands" name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="Select or type brand..." />
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Tool Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Tool Type...</option>
                                                                    {POWER_TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="label">Power Source</label>
                                                                <select name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`}>
                                                                    <option value="">Select Power Source...</option>
                                                                    <option value="Battery Powered (Cordless)">Battery Powered (Cordless)</option>
                                                                    <option value="Corded Electric (220V)">Corded Electric (220V)</option>
                                                                    <option value="Pneumatic (Air Powered)">Pneumatic (Air Powered)</option>
                                                                    <option value="Fuel (Gas/Petrol)">Fuel (Gas/Petrol)</option>
                                                                </select>
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 2" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Serial Number</label>
                                                                <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., SN-8890" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Power Specs (Voltage / Wattage)</label>
                                                                <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field" placeholder="e.g., 500W, 18V, 24V" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Warranty Expiry / Next Service</label>
                                                                <input type="date" name="warrantyExpiry" value={formData.warrantyExpiry || ''} onChange={handleInputChange} className="input-field" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Fasteners / Fixings */}
                                                    {formData.subType === 'Fasteners / Fixings' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Type</label>
                                                                <select name="model" value={formData.model} onChange={handleInputChange} className="input-field">
                                                                    <option value="">Select Type...</option>
                                                                    {FASTENER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <datalist id="fastener-brands">
                                                                {FASTENER_BRANDS.map(brand => <option key={brand} value={brand} />)}
                                                            </datalist>
                                                            <div>
                                                                <label className="label">Material / Brand</label>
                                                                <input list="fastener-brands" name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="Select or type..." />
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Size / Dimension</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., M8 x 50mm" />
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity (Boxes / Packs)</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 20" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Cleaning Supplies or Others */}
                                                    {(formData.subType === 'Cleaning Supplies' || formData.subType === 'Others' || !formData.subType) && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <datalist id="cleaning-supplies-brands">
                                                                {CLEANING_SUPPLIES_BRANDS.map(brand => <option key={brand} value={brand} />)}
                                                            </datalist>
                                                            <div>
                                                                <label className="label">Brand / Manufacturer</label>
                                                                <input list="cleaning-supplies-brands" name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="Select or type brand..." />
                                                                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Item Name / Description</label>
                                                                <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="e.g., Floor Cleaner, Mop" />
                                                            </div>
                                                            <div>
                                                                <label className="label">Quantity</label>
                                                                <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 10" />
                                                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="label">Unit of Measure / Size</label>
                                                                <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., Litres, Pieces" />
                                                                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Shared Bottom for Maintenance */}
                                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-color/30">
                                                        <div>
                                                            <label className="label">Does the asset have an Asset Tag?</label>
                                                            <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-2">
                                                                <option value="No">No</option>
                                                                <option value="Yes">Yes</option>
                                                            </select>
                                                            {formData.hasAssetTag === 'Yes' && (
                                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                                    <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                    {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                            ) : (
                                                /* ── GENERIC FALLBACK ── */
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">Brand / Manufacturer</label>
                                                        <input name="brandName" value={formData.brandName} onChange={handleInputChange} className={`input-field ${errors.brandName ? 'border-red-500' : ''}`} placeholder="Brand" />
                                                        {formData.brandName === 'Others' && <input name="brandNameCustom" value={formData.brandNameCustom || ''} onChange={handleInputChange} className="input-field mt-2" placeholder="Specify brand..." />}
                                                        {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="label">Quantity</label>
                                                        <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} className={`input-field ${errors.capacity ? 'border-red-500' : ''}`} placeholder="e.g., 10" />
                                                        {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="label">Model / Description</label>
                                                        <input name="model" value={formData.model} onChange={handleInputChange} className="input-field" placeholder="Model / Description" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Unit of Measure</label>
                                                        <input name="sizes" value={formData.sizes} onChange={handleInputChange} className={`input-field ${errors.sizes ? 'border-red-500' : ''}`} placeholder="e.g., Pieces" />
                                                        {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="label">Serial / Batch Number</label>
                                                        <input name="serial" value={formData.serial || ''} onChange={handleInputChange} className="input-field" placeholder="Batch / Serial No." />
                                                    </div>
                                                    <div>
                                                        <label className="label">Expiry Date (if applicable)</label>
                                                        <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label">Does the asset have an Asset Tag?</label>
                                                        <select name="hasAssetTag" value={formData.hasAssetTag} onChange={handleInputChange} className="input-field mb-2">
                                                            <option value="No">No</option>
                                                            <option value="Yes">Yes</option>
                                                        </select>
                                                        {formData.hasAssetTag === 'Yes' && (
                                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                                <input name="assetTag" value={formData.assetTag} onChange={handleInputChange} className={`input-field ${errors.assetTag ? 'border-red-500' : ''}`} placeholder="Enter Asset Tag... (e.g. GHA-XYZ)" />
                                                                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}



                                <div>
                                    <label className="label text-text-primary font-bold">Notes / Additional Specifications</label>
                                    <textarea name="details" value={formData.details} onChange={handleInputChange} className="input-field h-24 resize-none" placeholder="Enter technical specs, model numbers, etc."></textarea>
                                </div>

                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="px-6 py-4 flex justify-between items-center gap-3 border-t border-border-color shrink-0 bg-bg-card">
                        <div>
                            {activeTab !== 'General Info' && (
                                <button type="button" onClick={() => handleTabChange(TABS[TABS.indexOf(activeTab) - 1])} className="px-5 py-2 text-sm font-bold text-text-secondary bg-border-color/20 rounded-xl hover:bg-border-color/40 transition-colors">Previous Step</button>
                            )}
                        </div>
                        <div className="flex gap-3 items-center">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
                            {activeTab !== 'Financials' ? (
                                <button type="button" onClick={() => handleTabChange(TABS[TABS.indexOf(activeTab) + 1])} className="btn-primary">Next Step</button>
                            ) : (
                                <button type="submit" className="btn-primary">{assetToEdit ? "Update Asset" : "Register Asset"}</button>
                            )}
                        </div>
                    </div>
                </form>
            </div >
        </Modal >
    );
};


export default AddAssetModal;




