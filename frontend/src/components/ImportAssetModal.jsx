import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, FileText, Download } from 'lucide-react';
import Papa from 'papaparse';
import Modal from './Modal';
import { useToast } from './Toast';
import { bulkImportAssets } from '../services/api';
import { useAssets } from '../context/AssetContext';

// ─── Field mapping: CSV column header → frontend field name ───────────────────
// These must match the field names used in AddAssetModal / Asset model mapping.
const FIELD_MAPPING = {
    // ── General Info ─────────────────────────────────────────────────────────
    'Asset Name':           'name',           // REQUIRED
    'Major Category':       'majorCategory',  // REQUIRED: Fixed Asset | Non Fixed Asset
    'Sub Category':         'assetType',      // REQUIRED: Moveable | Non Moveable | General
    'Specific Category':    'category',       // REQUIRED: Fleet | ICT Asset | Furniture and Office Equipment | etc.
    'Asset Type (Sub)':     'subType',        // e.g. SUV | Laptop | Chair | Saloon Cars
    'Reporting Division':   'division',       // REQUIRED
    'Operational Status':   'status',         // Active | Inactive | Maintenance | Disposed | Good | Fair | Poor
    'Description / Notes':  'details',        // Free text notes

    // ── Specifications ───────────────────────────────────────────────────────
    'Brand Name':           'brandName',
    'Model':                'model',
    'Serial Number':        'serial',
    'Plate Number':         'plate',          // Fleet vehicles
    'Chassis Number':       'chassis',        // Fleet vehicles
    'Engine Number':        'engine',         // Fleet vehicles
    'Year of Manufacture':  'yearOfManufacture',
    'Fuel Type':            'fuelType',       // Petrol | Diesel | Hybrid | Electric
    'Transmission':         'transmission',   // Automatic | Manual | CVT
    'Engine Size':          'engineSize',     // e.g. 2.0L
    'Mileage':              'mileage',
    'Color':                'color',
    'Size':                 'sizes',          // Dimensions or unit of measure
    'Capacity':             'capacity',       // UPS kVA / Quantity / Floor area
    'Processor':            'processor',      // Computers
    'Generation':           'generation',     // Computers
    'Memory Size':          'memorySize',     // Computers: 8G | 16G
    'Storage Size':         'storageSize',    // Computers: 256GB SSD etc.
    'Equipment Type':       'type',           // Network Equipment: Router | Switch | Furniture: Chair type etc.
    'IP Address':           'ipAddress',      // Network Equipment
    'Port Count':           'portCount',      // Network Equipment
    'Printer Type':         'printerType',    // Printers
    'Scanner Type':         'scannerType',    // Scanners
    'Has Asset Tag':        'hasAssetTag',    // Yes | No
    'Asset Tag':            'assetTag',
    'Warranty Expiry':      'warrantyExpiry', // YYYY-MM-DD
    'Vendor':               'vendor',         // Intangible assets
    'License Type':         'licenseType',    // Intangible assets
    'Software Version':     'softwareVersion',
    'License Key':          'licenseKey',
    'Expiry Date':          'expiryDate',     // YYYY-MM-DD

    // ── Location & Ownership ─────────────────────────────────────────────────
    'Location':             'location',       // REQUIRED: Head Office, Accra | etc.
    'Owner Division':       'ownerDivision',
    'Room No':              'roomNo',
    'Room Name':            'roomName',
    'Custodian Name':       'custodianName',
    'Custodian ID':         'custodianID',
    'Custodian Address':    'custodianAddress',
    'Custodian Mobile':     'custodianMobile',

    // ── Financials ───────────────────────────────────────────────────────────
    'Purchase Cost':        'cost',           // REQUIRED (numeric)
    'Purchase Date':        'purchaseDate',   // REQUIRED: YYYY-MM-DD
    'Useful Life (Yrs)':    'usefulLife',     // Numeric, default 5
    'Residual Value':       'residualValue',  // Numeric, default 0
};

const TEMPLATE_SCHEMAS = {
    all: {
        label: "General Template (All Fields)",
        filename: "GHA_Asset_Import_Template_General.csv",
        fields: Object.keys(FIELD_MAPPING),
        samples: [
            {
                'Asset Name':           'Toyota Land Cruiser V8',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'Fleet',
                'Asset Type (Sub)':     'SUV',
                'Reporting Division':   'Chief Executive',
                'Operational Status':   'Active',
                'Description / Notes':  'Official executive vehicle',
                'Brand Name':           'Toyota',
                'Model':                'Land Cruiser V8',
                'Serial Number':        'TLC-2024-00123',
                'Plate Number':         'GR-1234-24',
                'Chassis Number':       'JTMHV05J704123456',
                'Engine Number':        'ENG-2024-001',
                'Year of Manufacture':  '2024',
                'Fuel Type':            'Diesel',
                'Transmission':         'Automatic',
                'Engine Size':          '4.5L',
                'Mileage':              '0 km',
                'Color':                'White',
                'Has Asset Tag':        'Yes',
                'Asset Tag':            'GHA-TAG-00123',
                'Warranty Expiry':      '2027-01-15',
                'Location':             'Head Office, Accra',
                'Owner Division':       'Chief Executive',
                'Custodian Name':       'John Mensah',
                'Custodian ID':         'GHA-00045-A',
                'Custodian Address':    'East Legon, Accra',
                'Custodian Mobile':     '024-000-0000',
                'Purchase Cost':        '180000',
                'Purchase Date':        '2024-01-15',
                'Useful Life (Yrs)':    '10',
                'Residual Value':       '5000',
            },
            {
                'Asset Name':           'HP EliteBook Laptop',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'ICT Asset',
                'Asset Type (Sub)':     'Computers',
                'Reporting Division':   'MIS',
                'Operational Status':   'Active',
                'Description / Notes':  'MIS developer laptop',
                'Brand Name':           'HP',
                'Model':                'EliteBook 840 G9',
                'Serial Number':        'HP-ELITE-99281',
                'Processor':            'Intel Core i7',
                'Generation':           '12th Gen',
                'Memory Size':          '16G',
                'Storage Size':         '512GB SSD',
                'Has Asset Tag':        'Yes',
                'Asset Tag':            'GHA-TAG-00824',
                'Warranty Expiry':      '2025-06-30',
                'Location':             'Head Office, Accra',
                'Owner Division':       'MIS',
                'Custodian Name':       'Jane Doe',
                'Custodian ID':         'GHA-00192-M',
                'Purchase Cost':        '7500',
                'Purchase Date':        '2023-07-01',
                'Useful Life (Yrs)':    '4',
                'Residual Value':       '200',
            },
            {
                'Asset Name':           'Executive L-Shaped Desk',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'Furniture and Office Equipment',
                'Asset Type (Sub)':     'Office Desk',
                'Reporting Division':   'HR',
                'Operational Status':   'Active',
                'Description / Notes':  'Manager desk in HR office',
                'Brand Name':           'Generic',
                'Model':                'Mahogany L-Shape',
                'Serial Number':        'DSK-HR-002',
                'Color':                'Brown',
                'Size':                 '180x160 cm',
                'Has Asset Tag':        'No',
                'Location':             'Head Office, Accra',
                'Owner Division':       'HR',
                'Custodian Name':       'Kofi Anan',
                'Custodian ID':         'GHA-00088-H',
                'Purchase Cost':        '4500',
                'Purchase Date':        '2024-02-10',
                'Useful Life (Yrs)':    '7',
                'Residual Value':       '0',
            }
        ]
    },
    fleet: {
        label: "Fleet Template",
        filename: "GHA_Asset_Import_Template_Fleet.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Serial Number', 'Plate Number', 'Chassis Number', 'Engine Number', 'Year of Manufacture',
            'Fuel Type', 'Transmission', 'Engine Size', 'Mileage', 'Color', 'Has Asset Tag', 'Asset Tag',
            'Warranty Expiry', 'Location', 'Owner Division', 'Custodian Name', 'Custodian ID',
            'Custodian Address', 'Custodian Mobile', 'Purchase Cost', 'Purchase Date', 'Useful Life (Yrs)',
            'Residual Value'
        ],
        samples: [
            {
                'Asset Name':           'Toyota Land Cruiser V8',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'Fleet',
                'Asset Type (Sub)':     'SUV',
                'Reporting Division':   'Chief Executive',
                'Operational Status':   'Active',
                'Description / Notes':  'Official executive vehicle',
                'Brand Name':           'Toyota',
                'Model':                'Land Cruiser V8',
                'Serial Number':        'TLC-2024-00123',
                'Plate Number':         'GR-1234-24',
                'Chassis Number':       'JTMHV05J704123456',
                'Engine Number':        'ENG-2024-001',
                'Year of Manufacture':  '2024',
                'Fuel Type':            'Diesel',
                'Transmission':         'Automatic',
                'Engine Size':          '4.5L',
                'Mileage':              '0 km',
                'Color':                'White',
                'Has Asset Tag':        'Yes',
                'Asset Tag':            'GHA-TAG-00123',
                'Warranty Expiry':      '2027-01-15',
                'Location':             'Head Office, Accra',
                'Owner Division':       'Chief Executive',
                'Custodian Name':       'John Mensah',
                'Custodian ID':         'GHA-00045-A',
                'Custodian Address':    'East Legon, Accra',
                'Custodian Mobile':     '024-000-0000',
                'Purchase Cost':        '180000',
                'Purchase Date':        '2024-01-15',
                'Useful Life (Yrs)':    '10',
                'Residual Value':       '5000',
            }
        ]
    },
    ict: {
        label: "ICT Asset Template",
        filename: "GHA_Asset_Import_Template_ICT.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Serial Number', 'Processor', 'Generation', 'Memory Size', 'Storage Size', 'IP Address',
            'Port Count', 'Printer Type', 'Scanner Type', 'Has Asset Tag', 'Asset Tag', 'Warranty Expiry',
            'Location', 'Owner Division', 'Room No', 'Room Name', 'Custodian Name', 'Custodian ID',
            'Purchase Cost', 'Purchase Date', 'Useful Life (Yrs)', 'Residual Value'
        ],
        samples: [
            {
                'Asset Name':           'HP EliteBook Laptop',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'ICT Asset',
                'Asset Type (Sub)':     'Computers',
                'Reporting Division':   'MIS',
                'Operational Status':   'Active',
                'Description / Notes':  'MIS developer laptop',
                'Brand Name':           'HP',
                'Model':                'EliteBook 840 G9',
                'Serial Number':        'HP-ELITE-99281',
                'Processor':            'Intel Core i7',
                'Generation':           '12th Gen',
                'Memory Size':          '16G',
                'Storage Size':         '512GB SSD',
                'Has Asset Tag':        'Yes',
                'Asset Tag':            'GHA-TAG-00824',
                'Warranty Expiry':      '2025-06-30',
                'Location':             'Head Office, Accra',
                'Owner Division':       'MIS',
                'Custodian Name':       'Jane Doe',
                'Custodian ID':         'GHA-00192-M',
                'Purchase Cost':        '7500',
                'Purchase Date':        '2023-07-01',
                'Useful Life (Yrs)':    '4',
                'Residual Value':       '200',
            }
        ]
    },
    furniture: {
        label: "Furniture & Office Equipment Template",
        filename: "GHA_Asset_Import_Template_Furniture.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Serial Number', 'Color', 'Size', 'Has Asset Tag', 'Asset Tag', 'Location', 'Owner Division',
            'Room No', 'Room Name', 'Custodian Name', 'Custodian ID', 'Purchase Cost', 'Purchase Date',
            'Useful Life (Yrs)', 'Residual Value'
        ],
        samples: [
            {
                'Asset Name':           'Executive L-Shaped Desk',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'Furniture and Office Equipment',
                'Asset Type (Sub)':     'Office Desk',
                'Reporting Division':   'HR',
                'Operational Status':   'Active',
                'Description / Notes':  'Manager desk in HR office',
                'Brand Name':           'Generic',
                'Model':                'Mahogany L-Shape',
                'Serial Number':        'DSK-HR-002',
                'Color':                'Brown',
                'Size':                 '180x160 cm',
                'Has Asset Tag':        'No',
                'Location':             'Head Office, Accra',
                'Owner Division':       'HR',
                'Custodian Name':       'Kofi Anan',
                'Custodian ID':         'GHA-00088-H',
                'Purchase Cost':        '4500',
                'Purchase Date':        '2024-02-10',
                'Useful Life (Yrs)':    '7',
                'Residual Value':       '0',
            }
        ]
    },
    intangible: {
        label: "Intangible Fixed Assets Template",
        filename: "GHA_Asset_Import_Template_Intangible.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Reporting Division',
            'Operational Status', 'Description / Notes', 'Vendor', 'License Type', 'Software Version',
            'License Key', 'Expiry Date', 'Location', 'Owner Division', 'Purchase Cost', 'Purchase Date',
            'Useful Life (Yrs)', 'Residual Value'
        ],
        samples: [
            {
                'Asset Name':           'Asset Management Software',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'Intangible Fixed Assets',
                'Reporting Division':   'MIS',
                'Operational Status':   'Active',
                'Description / Notes':  'Enterprise asset license',
                'Vendor':               'GHA Tech Solutions',
                'License Type':         'Enterprise',
                'Software Version':     'v2.4.1',
                'License Key':          'LIC-XXXX-YYYY-ZZZZ',
                'Expiry Date':          '2027-12-31',
                'Location':             'Head Office, Accra',
                'Owner Division':       'MIS',
                'Purchase Cost':        '25000',
                'Purchase Date':        '2024-01-01',
                'Useful Life (Yrs)':    '5',
                'Residual Value':       '0',
            }
        ]
    },
    land_buildings: {
        label: "Land and Buildings Template",
        filename: "GHA_Asset_Import_Template_Land_Buildings.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Reporting Division',
            'Operational Status', 'Description / Notes', 'Location', 'Size', 'Capacity', 'Purchase Cost',
            'Purchase Date', 'Useful Life (Yrs)', 'Residual Value'
        ],
        samples: [
            {
                'Asset Name':           'Regional Administrative Block',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Non Moveable',
                'Specific Category':    'Land and Buildings',
                'Reporting Division':   'Road Maintenance',
                'Operational Status':   'Active',
                'Description / Notes':  'Two-story office building',
                'Location':             'Kumasi Regional Office',
                'Size':                 '1200 sqm',
                'Capacity':             '50 staff',
                'Purchase Cost':        '1200000',
                'Purchase Date':        '2020-05-15',
                'Useful Life (Yrs)':    '50',
                'Residual Value':       '200000',
            }
        ]
    },
    infrastructure: {
        label: "Installed Infrastructure & Utility System Template",
        filename: "GHA_Asset_Import_Template_Infrastructure.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Serial Number', 'Capacity', 'Has Asset Tag', 'Asset Tag', 'Location', 'Owner Division',
            'Custodian Name', 'Purchase Cost', 'Purchase Date', 'Useful Life (Yrs)', 'Residual Value'
        ],
        samples: [
            {
                'Asset Name':           'CCTV Camera - Gate 1',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Non Moveable',
                'Specific Category':    'Installed Infrastructure & Utility System',
                'Asset Type (Sub)':     'CCTV',
                'Reporting Division':   'MIS',
                'Operational Status':   'Active',
                'Description / Notes':  'Main entrance surveillance camera',
                'Brand Name':           'Hikvision',
                'Model':                'DS-2CD2143G0-I',
                'Serial Number':        'CCTV-99812-E',
                'Capacity':             '4MP',
                'Has Asset Tag':        'Yes',
                'Asset Tag':            'GHA-TAG-CCTV01',
                'Location':             'Head Office, Accra',
                'Owner Division':       'MIS',
                'Custodian Name':       'Jane Doe',
                'Purchase Cost':        '1200',
                'Purchase Date':        '2024-03-10',
                'Useful Life (Yrs)':    '5',
                'Residual Value':       '0',
            }
        ]
    },
    plant_machinery: {
        label: "Plant and Machinery Template",
        filename: "GHA_Asset_Import_Template_Plant_Machinery.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Serial Number', 'Capacity', 'Has Asset Tag', 'Asset Tag', 'Location', 'Owner Division',
            'Custodian Name', 'Purchase Cost', 'Purchase Date', 'Useful Life (Yrs)', 'Residual Value'
        ],
        samples: [
            {
                'Asset Name':           '150kVA Standby Generator',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'Plant and Machinery',
                'Asset Type (Sub)':     'Power Generators',
                'Reporting Division':   'Plant & Equipment',
                'Operational Status':   'Active',
                'Description / Notes':  'Main back-up power supply generator',
                'Brand Name':           'Cummins',
                'Model':                'C150D5',
                'Serial Number':        'GEN-2023-887',
                'Capacity':             '150 kVA',
                'Has Asset Tag':        'Yes',
                'Asset Tag':            'GHA-TAG-GEN01',
                'Location':             'Head Office Yard',
                'Owner Division':       'Plant & Equipment',
                'Custodian Name':       'Kofi Mensah',
                'Purchase Cost':        '45000',
                'Purchase Date':        '2023-08-20',
                'Useful Life (Yrs)':    '15',
                'Residual Value':       '2000',
            }
        ]
    },
    office_consumables: {
        label: "Office Consumables Template",
        filename: "GHA_Asset_Import_Template_Office_Consumables.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Size', 'Location', 'Purchase Cost', 'Purchase Date'
        ],
        samples: [
            {
                'Asset Name':           'A4 Printing Paper Boxes',
                'Major Category':       'Non Fixed Asset',
                'Sub Category':         'General',
                'Specific Category':    'Office Consumables',
                'Asset Type (Sub)':     'Printing Papers',
                'Reporting Division':   'HR',
                'Operational Status':   'Active',
                'Description / Notes':  'Box of 5 reams A4 paper',
                'Brand Name':           'Double A',
                'Model':                'A4 80GSM',
                'Size':                 'Box of 5 reams',
                'Location':             'HR Store Room',
                'Purchase Cost':        '350',
                'Purchase Date':        '2024-05-01',
            }
        ]
    },
    it_consumables: {
        label: "IT & Technical Consumables Template",
        filename: "GHA_Asset_Import_Template_IT_Consumables.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Size', 'Capacity', 'Location', 'Purchase Cost', 'Purchase Date'
        ],
        samples: [
            {
                'Asset Name':           'External Hard Drive 2TB',
                'Major Category':       'Non Fixed Asset',
                'Sub Category':         'General',
                'Specific Category':    'IT and Technical Consumables',
                'Asset Type (Sub)':     'External Hard Drives',
                'Reporting Division':   'MIS',
                'Operational Status':   'Active',
                'Description / Notes':  'Backup external hard drives for project developers',
                'Brand Name':           'Seagate',
                'Model':                'Backup Plus',
                'Size':                 '2.5 inch',
                'Capacity':             '2TB',
                'Location':             'MIS IT Store',
                'Purchase Cost':        '750',
                'Purchase Date':        '2024-04-15',
            }
        ]
    },
    workshop_supplies: {
        label: "Maintenance & Workshop Supplies Template",
        filename: "GHA_Asset_Import_Template_Workshop_Supplies.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Size', 'Location', 'Purchase Cost', 'Purchase Date'
        ],
        samples: [
            {
                'Asset Name':           'Professional Cordless Drill Kit',
                'Major Category':       'Non Fixed Asset',
                'Sub Category':         'General',
                'Specific Category':    'Maintenance and Workshop Supplies',
                'Asset Type (Sub)':     'Power Tools',
                'Reporting Division':   'Plant & Equipment',
                'Operational Status':   'Active',
                'Description / Notes':  '18V Cordless hammer drill set',
                'Brand Name':           'Bosch',
                'Model':                'GSB 18V-50',
                'Size':                 'Medium Carry Case',
                'Location':             'Workshop Main Locker',
                'Purchase Cost':        '1850',
                'Purchase Date':        '2024-02-28',
            }
        ]
    },
    fuel_energy: {
        label: "Fuel and Energy Supplies Template",
        filename: "GHA_Asset_Import_Template_Fuel_Energy.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Location', 'Purchase Cost',
            'Purchase Date'
        ],
        samples: [
            {
                'Asset Name':           'Diesel Supply - Main Tank',
                'Major Category':       'Non Fixed Asset',
                'Sub Category':         'General',
                'Specific Category':    'Fuel and Energy Supplies',
                'Asset Type (Sub)':     'Diesel',
                'Reporting Division':   'Road Maintenance',
                'Operational Status':   'Active',
                'Description / Notes':  'Monthly fuel supply for depot generator and operations',
                'Location':             'Depot Fuel Tank',
                'Purchase Cost':        '15000',
                'Purchase Date':        '2024-08-01',
            }
        ]
    },
    safety_equipment: {
        label: "Safety & Productive Equipment Template",
        filename: "GHA_Asset_Import_Template_Safety_Equipment.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Size', 'Has Asset Tag', 'Asset Tag', 'Location', 'Purchase Cost', 'Purchase Date'
        ],
        samples: [
            {
                'Asset Name':           'Dry Powder Fire Extinguisher 6kg',
                'Major Category':       'Non Fixed Asset',
                'Sub Category':         'General',
                'Specific Category':    'Safety and Productive Equipment',
                'Asset Type (Sub)':     'Fire Extinguisher',
                'Reporting Division':   'HR',
                'Operational Status':   'Active',
                'Description / Notes':  'Office corridor safety equipment',
                'Brand Name':           'SafeGuard',
                'Model':                'ABC Powder 6kg',
                'Size':                 '6kg cylinder',
                'Has Asset Tag':        'Yes',
                'Asset Tag':            'GHA-TAG-SAFE09',
                'Location':             'Head Office Corridor A',
                'Purchase Cost':        '450',
                'Purchase Date':        '2024-01-20',
            }
        ]
    },
    utility_equipment: {
        label: "Utility Equipment Template",
        filename: "GHA_Asset_Import_Template_Utility_Equipment.csv",
        fields: [
            'Asset Name', 'Major Category', 'Sub Category', 'Specific Category', 'Asset Type (Sub)',
            'Reporting Division', 'Operational Status', 'Description / Notes', 'Brand Name', 'Model',
            'Serial Number', 'Capacity', 'Has Asset Tag', 'Asset Tag', 'Location', 'Purchase Cost',
            'Purchase Date', 'Useful Life (Yrs)', 'Residual Value'
        ],
        samples: [
            {
                'Asset Name':           'Office Double-Door Refrigerator',
                'Major Category':       'Fixed Asset',
                'Sub Category':         'Moveable',
                'Specific Category':    'Utility Equipment',
                'Asset Type (Sub)':     'Refrigerator',
                'Reporting Division':   'HR',
                'Operational Status':   'Active',
                'Description / Notes':  'Kitchen refrigerator for staff canteens',
                'Brand Name':           'Samsung',
                'Model':                'RT38K5030S8',
                'Serial Number':        'REF-REF-7728-B',
                'Capacity':             '384L',
                'Has Asset Tag':        'Yes',
                'Asset Tag':            'GHA-TAG-REF01',
                'Location':             'Staff Canteen Room 2',
                'Purchase Cost':        '5400',
                'Purchase Date':        '2024-03-05',
                'Useful Life (Yrs)':    '7',
                'Residual Value':       '100',
            }
        ]
    }
};

const ImportAssetModal = ({ isOpen, onClose }) => {
    const { addToast } = useToast();
    const { refreshAssets } = useAssets();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview
    const [isImporting, setIsImporting] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('all');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                addToast('Please select a CSV file', 'error');
                return;
            }
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const csvHeaders = Object.keys(results.data[0]);
                    setHeaders(csvHeaders);
                    setPreviewData(results.data);

                    // Initial auto-mapping
                    const initialMapping = {};
                    csvHeaders.forEach(header => {
                        const matchedField = Object.entries(FIELD_MAPPING).find(([label, key]) =>
                            header.toLowerCase().includes(label.toLowerCase()) ||
                            header.toLowerCase() === key.toLowerCase()
                        );
                        if (matchedField) {
                            initialMapping[header] = matchedField[1];
                        }
                    });
                    setMapping(initialMapping);
                    setStep(2);
                } else {
                    addToast('The CSV file is empty', 'error');
                }
            },
            error: (error) => {
                addToast('Error parsing CSV: ' + error.message, 'error');
            }
        });
    };

    const handleMappingChange = (header, field) => {
        setMapping(prev => ({ ...prev, [header]: field }));
    };

    const handleImport = async () => {
        setIsImporting(true);

        // Validate that required fields are mapped before sending
        const hasMappedField = (fieldKey) => Object.values(mapping).includes(fieldKey);
        if (!hasMappedField('name')) {
            addToast('Please map "Asset Name" column before importing', 'error');
            setIsImporting(false);
            return;
        }
        if (!hasMappedField('category')) {
            addToast('Please map "Category" column before importing', 'error');
            setIsImporting(false);
            return;
        }

        try {
            const mappedAssets = previewData.map(row => {
                const asset = {};
                Object.entries(mapping).forEach(([header, field]) => {
                    if (field) asset[field] = row[header];
                });
                // Default values if missing
                if (!asset.majorCategory) asset.majorCategory = 'Fixed Asset';
                if (!asset.assetType) asset.assetType = 'Moveable';
                if (!asset.status) asset.status = 'Active';
                asset.approvalStatus = 'Pending';
                return asset;
            });

            const result = await bulkImportAssets(mappedAssets);

            // The backend always returns success:true, so inspect the data payload
            const importData = result.data;
            const succeeded = importData?.success ?? 0;
            const failed = importData?.failed ?? 0;
            const errors = importData?.errors ?? [];

            if (succeeded === 0 && failed > 0) {
                // Separate duplicate-skipped rows from real failures
                const duplicateErrors = errors.filter(e => e.toLowerCase().includes('already exists'));
                const realErrors = errors.filter(e => !e.toLowerCase().includes('already exists'));

                if (duplicateErrors.length === failed) {
                    // All skips were duplicates
                    addToast(`Import skipped: All ${failed} row(s) already exist in the system.`, 'warning');
                } else {
                    const firstError = realErrors[0] || errors[0] || 'All rows failed to import. Check that Name, Major Category, and Category columns are mapped correctly.';
                    addToast(`Import failed: ${firstError}`, 'error');
                    if (duplicateErrors.length > 0) {
                        addToast(`${duplicateErrors.length} row(s) skipped — already exist in the system.`, 'warning');
                    }
                    if (realErrors.length > 1) {
                        console.error('Bulk import errors:', realErrors);
                        addToast(`${realErrors.length} rows failed. Check the browser console for details.`, 'warning');
                    }
                }
            } else if (failed > 0) {
                const duplicateErrors = errors.filter(e => e.toLowerCase().includes('already exists'));
                const realErrors = errors.filter(e => !e.toLowerCase().includes('already exists'));

                let msg = `Imported ${succeeded} asset(s).`;
                if (duplicateErrors.length > 0) msg += ` ${duplicateErrors.length} skipped (already exist).`;
                if (realErrors.length > 0) msg += ` ${realErrors.length} failed.`;

                addToast(msg, 'warning');
                if (realErrors.length > 0) console.warn('Bulk import partial errors:', realErrors);
                if (refreshAssets) await refreshAssets();
                onClose();
                resetState();
            } else {
                addToast(`Successfully imported ${succeeded} asset(s)`, 'success');
                if (refreshAssets) await refreshAssets();
                onClose();
                resetState();
            }
        } catch (error) {
            console.error('Import Error:', error);
            addToast('Error during import: ' + error.message, 'error');
        } finally {
            setIsImporting(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setPreviewData([]);
        setHeaders([]);
        setMapping({});
        setStep(1);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadTemplate = () => {
        const schema = TEMPLATE_SCHEMAS[selectedTemplateCategory] || TEMPLATE_SCHEMAS.all;
        const cols = schema.fields;

        // Helper: wrap a cell value in quotes and escape internal quotes
        const q = (v) => `"${String(v || '').replace(/"/g, '""')}"`;

        // Row 1 – column headers
        const headerRow = cols.map(q).join(',');

        // Sample rows
        const sampleRows = schema.samples.map(sample => {
            return cols.map(col => q(sample[col])).join(',');
        });

        const csvContent = [headerRow, ...sampleRows].join('\r\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = schema.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Asset Import" maxWidth="max-w-4xl">
            <div className="space-y-6 p-1">
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <div>
                                <h4 className="font-bold text-primary">Import Instructions</h4>
                                <p className="text-xs text-text-secondary mt-1">Upload a CSV file containing your asset records. Make sure the headers map correctly.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => setShowGuide(prev => !prev)}
                                    className="text-xs font-bold text-text-secondary hover:bg-bg-hover px-3 py-2 rounded-lg border border-border-color transition-all"
                                >
                                    {showGuide ? 'Hide Field Guide' : 'Show Field Guide'}
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Reference Guide */}
                        {showGuide && (
                            <div className="bg-bg-hover/30 border border-border-color rounded-xl p-4 space-y-3 animate-fadeIn">
                                <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">Required & Common Fields Reference</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-2 border-r border-border-color/50 pr-3">
                                        <div>
                                            <span className="font-bold text-primary">Asset Name *</span>
                                            <p className="text-text-muted mt-0.5">Required. The description name of the asset. E.g. <i>Toyota Land Cruiser V8</i></p>
                                        </div>
                                        <div>
                                            <span className="font-bold text-primary">Major Category *</span>
                                            <p className="text-text-muted mt-0.5">Required. Must be: <code>Fixed Asset</code> or <code>Non Fixed Asset</code></p>
                                        </div>
                                        <div>
                                            <span className="font-bold text-primary">Sub Category *</span>
                                            <p className="text-text-muted mt-0.5">Required. Must be: <code>Moveable</code>, <code>Non Moveable</code>, or <code>General</code></p>
                                        </div>
                                        <div>
                                            <span className="font-bold text-primary">Specific Category *</span>
                                            <p className="text-text-muted mt-0.5">Required. Options include: <code>Fleet</code>, <code>ICT Asset</code>, <code>Furniture and Office Equipment</code>, <code>Land and Buildings</code>, <code>Plant and Machinery</code>, etc.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-1">
                                        <div>
                                            <span className="font-bold text-primary">Reporting Division *</span>
                                            <p className="text-text-muted mt-0.5">Required. Options include: <code>Chief Executive</code>, <code>Finance</code>, <code>HR</code>, <code>MIS</code>, <code>Road Maintenance</code>, etc.</p>
                                        </div>
                                        <div>
                                            <span className="font-bold text-primary">Location *</span>
                                            <p className="text-text-muted mt-0.5">Required. The physical location. E.g. <i>Head Office, Accra</i></p>
                                        </div>
                                        <div>
                                            <span className="font-bold text-primary">Purchase Cost *</span>
                                            <p className="text-text-muted mt-0.5">Required. Numeric value without currency symbol. E.g. <code>180000</code></p>
                                        </div>
                                        <div>
                                            <span className="font-bold text-primary">Purchase Date *</span>
                                            <p className="text-text-muted mt-0.5">Required. Format must be <code>YYYY-MM-DD</code>. E.g. <code>2024-01-15</code></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border-color rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group"
                        >
                            <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="text-text-muted group-hover:text-primary transition-colors" size={32} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-text-primary">Click to upload CSV</p>
                                <p className="text-xs text-text-muted mt-1">or drag and drop file here</p>
                            </div>

                            <div 
                                className="w-full max-w-md border-t border-border-color/50 pt-4 mt-2 flex flex-col items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p className="text-xs text-text-muted">Or download a specific category import template:</p>
                                <div className="flex items-center gap-2 w-full justify-center">
                                    <select
                                        value={selectedTemplateCategory}
                                        onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                                        className="text-xs bg-bg-card border border-border-color rounded-lg px-3 py-2 focus:border-primary/50 focus:outline-none font-medium max-w-[260px] truncate"
                                    >
                                        {Object.entries(TEMPLATE_SCHEMAS).map(([key, schema]) => (
                                            <option key={key} value={key}>{schema.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={downloadTemplate}
                                        className="flex items-center gap-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 px-4 py-2 rounded-lg transition-all shadow-md shadow-primary/10 cursor-pointer whitespace-nowrap"
                                    >
                                        <Download size={14} /> Download Template
                                    </button>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".csv"
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 bg-warning/5 p-4 rounded-xl border border-warning/20">
                            <AlertCircle className="text-warning" size={20} />
                            <p className="text-xs font-medium text-text-secondary">
                                Match your CSV columns to the appropriate system fields. Unmapped columns will be ignored.
                            </p>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-bg-card border-b border-border-color">
                                    <tr>
                                        <th className="py-3 px-4 text-[10px] font-bold text-text-muted uppercase">CSV Column Header</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-text-muted uppercase">Maps To Field</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {headers.map(header => (
                                        <tr key={header} className="border-b border-border-color hover:bg-bg-hover/30">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-text-muted" />
                                                    <span className="font-semibold text-text-primary">{header}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <select
                                                    value={mapping[header] || ''}
                                                    onChange={(e) => handleMappingChange(header, e.target.value)}
                                                    className="w-full bg-bg-card border border-border-color rounded-lg px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                                                >
                                                    <option value="">-- Ignore this column --</option>
                                                    {Object.entries(FIELD_MAPPING).map(([label, value]) => (
                                                        <option key={value} value={value}>{label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
                            <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-bg-hover text-text-primary rounded-xl text-sm font-bold">Back</button>
                            <button
                                onClick={() => setStep(3)}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                            >
                                Preview Data
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-text-primary">Preview Data ({previewData.length} records)</h4>
                            <div className="flex items-center gap-2 text-xs text-success font-bold bg-success/10 px-3 py-1.5 rounded-full">
                                <Check size={14} strokeWidth={3} /> Ready to Import
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-border-color rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-bg-hover/50 border-b border-border-color">
                                    <tr>
                                        {Object.entries(mapping).filter(([_, field]) => field).map(([header, _]) => (
                                            <th key={header} className="py-3 px-4 font-bold text-text-muted uppercase">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 10).map((row, idx) => (
                                        <tr key={idx} className="border-b border-border-color">
                                            {Object.entries(mapping).filter(([_, field]) => field).map(([header, _]) => (
                                                <td key={header} className="py-3 px-4 text-text-secondary truncate max-w-[200px]">{row[header]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 10 && (
                                <div className="p-3 text-center text-[10px] text-text-muted font-bold bg-bg-hover/20">
                                    Showing first 10 of {previewData.length} records...
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
                            <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-bg-hover text-text-primary rounded-xl text-sm font-bold">Back to Mapping</button>
                            <button
                                onClick={handleImport}
                                disabled={isImporting}
                                className={`
                                    px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2
                                    ${isImporting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] transition-all'}
                                `}
                            >
                                {isImporting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} strokeWidth={3} /> Complete Import
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImportAssetModal;
