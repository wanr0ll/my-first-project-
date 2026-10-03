export const getDefaultImage = (asset) => {
    if (!asset) return null;

    const deskImages = {
        'sit stand (height-adjustable) desk': '/defaults/Ajustable desk.png',
        'computer desk': '/defaults/Computer desk.png',
        'conner desk': '/defaults/Corner desk.png',
        'drafting/art table': '/defaults/Drafting Desk.jpg',
        'executive desk': '/defaults/Executive desk.png',
        'l-shaped desk': '/defaults/L Share desk.png',
        'reception desk': '/defaults/Reception desk.png',
        'secretary desk': '/defaults/Secretary desk.png',
        'writing/laptop desk': '/defaults/Writing.png',
        'bench desk': '/defaults/banch desk.png',
        'wall-mounted/floating desk': '/defaults/wall mount desk.png'
    };

    const chairImages = {
        'executive chair': '/defaults/Executive Chair.png',
        'task / office chair': '/defaults/Office chair.png',
        'guest / visitor chair': '/defaults/Visitor Chair.png',
        'conference chair': '/defaults/Conference chair.png',
        'ergonomic chair': '/defaults/Ergonomic Chair.png',
        'gaming chair': '/defaults/Gaming Chair.png',
        'stacking chair': '/defaults/Stacking Chair.png',
        'folding chair': '/defaults/Folding Chair.png',
        'bar stool': '/defaults/Bar Stool.png'
    };

    const computerImages = {
        'all-in-one computer': '/defaults/computer/All-In-One Computer.png',
        'desktop': '/defaults/computer/Desktop.png',
        'laptop': '/defaults/computer/Laptop.png'
    };

    const typeLower = (asset.type || '').toLowerCase();
    const assetTypeLower = (asset.asset_type || '').toLowerCase();
    const subTypeLower = (asset.sub_type || asset.subType || '').toLowerCase();
    const catLower = (asset.category || '').toLowerCase();

    // Desk images — only for Furniture category
    if (catLower.includes('furniture')) {
        if (deskImages[typeLower]) return deskImages[typeLower];
        if (deskImages[subTypeLower]) return deskImages[subTypeLower];
    }

    // Chair images — only for Furniture category
    if (catLower.includes('furniture')) {
        if (chairImages[typeLower]) return chairImages[typeLower];
        if (chairImages[subTypeLower]) return chairImages[subTypeLower];
    }

    // Computer images — only for ICT/Computers category assets
    const isComputerAsset = catLower.includes('ict') || subTypeLower === 'computers';
    if (isComputerAsset) {
        if (computerImages[typeLower]) return computerImages[typeLower];
        if (computerImages[subTypeLower]) return computerImages[subTypeLower];
    }

    // Vehicle model images
    if (subTypeLower === 'saloon cars') {
        const img = getSaloonModelImage(asset.model || asset.brand_name || '');
        if (img) return img;
    }
    if (subTypeLower === 'suv') {
        const img = getSUVModelImage(asset.model || asset.brand_name || '');
        if (img) return img;
    }
    if (subTypeLower === 'pick-up') {
        const img = getPickupModelImage(asset.model || asset.brand_name || '');
        if (img) return img;
    }
    if (subTypeLower === 'van') {
        const img = getVanModelImage(asset.model || asset.brand_name || '');
        if (img) return img;
    }
    if (subTypeLower === 'buses') {
        const img = getBusModelImage(asset.model || asset.brand_name || '');
        if (img) return img;
    }
    if (subTypeLower === 'printers' || typeLower === 'printer') {
        const img = getPrinterModelImage(asset.model || asset.brand_name || '');
        if (img) return img;
    }
    if (subTypeLower === 'scanners' || typeLower === 'scanner') {
        const img = getScannerModelImage(asset.model || asset.brand_name || '');
        if (img) return img;
    }
    if (subTypeLower === 'photocopier' || typeLower === 'photocopier' || typeLower === 'copier') {
        const img = getPhotocopierModelImage(asset.model || asset.brand_name || '');
        if (img) return img;
    }

    if (subTypeLower === 'power backup / ups') {
        const img = getUpsBrandImage(asset.brand_name || asset.brandName || asset.brand || asset.model || '');
        if (img) return img;
    }

    if (subTypeLower === 'solar power system') {
        const img = getSolarBrandImage(asset.brand_name || asset.brandName || asset.brand || asset.model || '');
        if (img) return img;
    }

    if (subTypeLower === 'refrigerator') {
        const img = getRefrigeratorBrandImage(asset.brand_name || asset.brandName || asset.brand || asset.model || '');
        if (img) return img;
    }

    if (subTypeLower === 'microwave') {
        const img = getMicrowaveBrandImage(asset.brand_name || asset.brandName || asset.brand || asset.model || '');
        if (img) return img;
    }

    if (subTypeLower === 'kettle') {
        const img = getKettleBrandImage(asset.brand_name || asset.brandName || asset.brand || asset.model || '');
        if (img) return img;
    }

    if (subTypeLower === 'public address system') {
        // PA System images vary by equipment type, not brand
        const img = getPASystemEquipmentImage(asset.asset_type || asset.type || '');
        if (img) return img;
    }

    if (subTypeLower === 'display system') {
        // Display System images vary by equipment type
        const img = getDisplaySystemImage(asset.asset_type || asset.type || '');
        if (img) return img;
    }

    if (subTypeLower === 'fire suppression system') {
        const brandStr = asset.brand_name || asset.brandName || asset.brand || '';
        const modelStr = asset.model || '';
        const img = getFireSuppressionSystemImage(brandStr, modelStr);
        if (img) return img;
    }

    if (subTypeLower === 'fans') {
        const img = getFanTypeImage(asset.asset_type || asset.type || '');
        if (img) return img;
    }

    if (subTypeLower === 'elevators / lifts') {
        const img = getElevatorTypeImage(asset.asset_type || asset.type || '');
        if (img) return img;
    }

    if (subTypeLower === 'traffic lights') {
        const img = getTrafficLightTypeImage(asset.asset_type || asset.type || '');
        if (img) return img;
    }

    if (subTypeLower === 'electrical wiring and installation') {
        const img = getElectricalComponentImage(asset.asset_type || asset.type || '');
        if (img) return img;
    }

    if (subTypeLower === 'air conditioning systems') {
        const img = getACTypeImage(asset.asset_type || asset.type || '');
        if (img) return img;
    }

    // Network equipment fallbacks
    const networkImages = {
        'router': '/defaults/network/router.png',
        'switch': '/defaults/network/switch.png',
        'firewall': '/defaults/network/firewall.png',
        'access point': '/defaults/network/access_point.png',
        'network storage (nas)': '/defaults/network/nas.png',
        'network cable': '/defaults/network/network_cable.png',
        'patch panel': '/defaults/network/patch_panel.png',
        'server': '/defaults/network/server.png'
    };

    // Land and Buildings image fallbacks
    const landBuildingImages = {
        'office building': '/defaults/land_buildings/office_building.png',
        'administrative block': '/defaults/land_buildings/office_building.png',
        'departmental office': '/defaults/land_buildings/office_building.png',
        'warehouse': '/defaults/land_buildings/warehouse_facility.png',
        'store': '/defaults/land_buildings/warehouse_facility.png',
        'storage facility': '/defaults/land_buildings/warehouse_facility.png',
        'parking lot': '/defaults/land_buildings/parking_lot.png',
        'service center': '/defaults/land_buildings/parking_lot.png',
        'hotel': '/defaults/land_buildings/hotel_quarters.png',
        'guest house': '/defaults/land_buildings/hotel_quarters.png',
        'staff quarters': '/defaults/land_buildings/hotel_quarters.png',
        'staff accommodation': '/defaults/land_buildings/hotel_quarters.png',
        'roads': '/defaults/land_buildings/road_infrastructure.png',
        'road': '/defaults/land_buildings/road_infrastructure.png',
        'bridges': '/defaults/land_buildings/bridge_infrastructure.png',
        'bridge': '/defaults/land_buildings/bridge_infrastructure.png',
        'interchanges': '/defaults/land_buildings/bridge_infrastructure.png',
        'interchange': '/defaults/land_buildings/bridge_infrastructure.png',
    };

    if (subTypeLower === 'network equipment' || [
        'router', 'switch', 'firewall', 'network cable', 'access point', 'patch panel', 'network storage (nas)', 'server'
    ].includes(typeLower)) {
        return networkImages[typeLower] || '/defaults/network_default.png';
    }

    // Plumbing System – fixture / component type images
    if (subTypeLower === 'plumbing system') {
        const plumbingImages = {
            'water supply piping (lot)': '/defaults/plumbing/water_supply_piping.png',
            'drainage & sewerage (lot)': '/defaults/plumbing/drainage_sewerage.png',
            'sanitary fixtures (wc, basin, urinal)': '/defaults/plumbing/sanitary_fixtures.png',
            'water storage tanks': '/defaults/plumbing/water_storage_tank.png',
            'pumps & booster sets': '/defaults/plumbing/pump_booster.png',
            'water treatment units': '/defaults/plumbing/water_treatment.png',
            'hot water system': '/defaults/plumbing/water_supply_piping.png',
            'fire hydrant / sprinkler (plumbing)': '/defaults/plumbing/pump_booster.png',
        };
        const fixtureLower = (asset.type || asset.asset_type || '').toLowerCase();
        return plumbingImages[fixtureLower] || '/defaults/plumbing/water_supply_piping.png';
    }

    // CCTV System fallback
    if (subTypeLower === 'cctv') {
        const cctvImages = {
            'dome camera': '/defaults/cctv/cctv_dome_camera.png',
            'bullet camera': '/defaults/cctv/cctv_bullet_camera.png',
            'ptz camera': '/defaults/cctv/cctv_ptz_camera.png',
            'turret camera': '/defaults/cctv/cctv_turret_camera.png',
            'fisheye / 360° camera': '/defaults/cctv/cctv_fisheye_camera.png',
            'box camera': '/defaults/cctv/cctv_box_camera.png',
            'network video recorder (nvr)': '/defaults/cctv/NVR.png',
            'digital video recorder (dvr)': '/defaults/cctv/DVR.png',
        };
        const cctvLower = (asset.type || asset.asset_type || '').toLowerCase();
        return cctvImages[cctvLower] || '/defaults/cctv/cctv_dome_camera.png';
    }

    // Access Control Systems fallback
    if (subTypeLower === 'access control systems') {
        const accessImages = {
            'standalone controller': '/defaults/access_control/standalone_controller.png',
            'networked / ip controller': '/defaults/access_control/networked_ip_controller.png',
            'cloud-based controller': '/defaults/access_control/cloud_based_controller.png',
            'panel-based controller': '/defaults/access_control/panel_based_controller.png'
        };
        const accessLower = (asset.type || asset.asset_type || '').toLowerCase();
        return accessImages[accessLower] || '/defaults/network_default.png';
    }

    // Land and Buildings fallback
    if (catLower.includes('land') || catLower.includes('building')) {
        if (subTypeLower === 'interchanges' && asset.interchangeType) {
            const interchangeTypeLower = asset.interchangeType.toLowerCase();
            if (interchangeTypeLower.includes('full cloverleaf')) return '/defaults/land_buildings/interchange_full_cloverleaf.png';
            if (interchangeTypeLower.includes('partial cloverleaf')) return '/defaults/land_buildings/interchange_partial_cloverleaf.png';
            if (interchangeTypeLower.includes('diamond')) return '/defaults/land_buildings/interchange_diamond.png';
            if (interchangeTypeLower.includes('trumpet')) return '/defaults/land_buildings/interchange_trumpet.png';
            if (interchangeTypeLower.includes('roundabout')) return '/defaults/land_buildings/interchange_roundabout.png';
            if (interchangeTypeLower.includes('stack') || interchangeTypeLower.includes('multi-level')) return '/defaults/land_buildings/interchange_stack.png';
        }

        if (subTypeLower === 'bridges' && asset.bridgeType) {
            const bridgeTypeLower = asset.bridgeType.toLowerCase();
            if (bridgeTypeLower.includes('beam bridge')) return '/defaults/land_buildings/bridge_beam.png';
            if (bridgeTypeLower.includes('arch bridge')) return '/defaults/land_buildings/bridge_arch.png';
            if (bridgeTypeLower.includes('suspension bridge')) return '/defaults/land_buildings/bridge_suspension.png';
            if (bridgeTypeLower.includes('cable-stayed bridge')) return '/defaults/land_buildings/bridge_cable_stayed.png';
            if (bridgeTypeLower.includes('box girder bridge')) return '/defaults/land_buildings/bridge_box_girder.png';
            if (bridgeTypeLower.includes('culvert')) return '/defaults/land_buildings/bridge_culvert.png';
            if (bridgeTypeLower.includes('footbridge')) return '/defaults/land_buildings/bridge_footbridge.png';
        }

        if (subTypeLower === 'roads' && asset.surfaceType) {
            const surfaceTypeLower = asset.surfaceType.toLowerCase();
            if (surfaceTypeLower.includes('asphalt') || surfaceTypeLower.includes('bitumen')) return '/defaults/land_buildings/road_asphalt.png';
            if (surfaceTypeLower.includes('concrete')) return '/defaults/land_buildings/road_concrete.png';
            if (surfaceTypeLower.includes('gravel')) return '/defaults/land_buildings/road_gravel.png';
            if (surfaceTypeLower.includes('earth') || surfaceTypeLower.includes('unpaved')) return '/defaults/land_buildings/road_earth.png';
            if (surfaceTypeLower.includes('block pavi')) return '/defaults/land_buildings/road_block_paving.png';
        }

        if (landBuildingImages[subTypeLower]) return landBuildingImages[subTypeLower];
        return '/defaults/land_buildings/office_building.png';
    }

    // Category-level fallbacks
    const majorCatLower = (asset.major_category || '').toLowerCase();

    // Fleet
    if (catLower === 'fleet' || subTypeLower === 'saloon cars') return '/defaults/fleet_default.png';
    if (subTypeLower === 'suv') return '/defaults/suv/land_cruiser_v8.png';
    if (subTypeLower === 'pick-up') return '/defaults/pickup/hilux.png';
    if (subTypeLower === 'van') return '/defaults/van/ford_transit.png';
    if (subTypeLower === 'buses') return '/defaults/bus/hiace.png';

    // ICT
    if (catLower === 'ict asset' || catLower.includes('ict')) return '/defaults/ict_default.png';
    if (catLower === 'computers' || subTypeLower === 'computers') return '/defaults/computer/Laptop.png';
    if (catLower === 'printers' || subTypeLower === 'printers') return '/defaults/ict_default.png';
    if (catLower === 'scanners' || subTypeLower === 'scanners') return '/defaults/ict_default.png';
    if (catLower === 'photocopier' || subTypeLower === 'photocopier') return '/defaults/ict_default.png';
    if (catLower === 'network equipment' || subTypeLower === 'network equipment') return '/defaults/network_default.png';

    // Furniture & Office Equipment
    if (catLower === 'furniture and office equipment') return '/defaults/Office chair.png';
    if (catLower === 'office desk' || subTypeLower.includes('desk')) return '/defaults/Computer desk.png';
    if (catLower === 'chair' || subTypeLower.includes('chair')) return '/defaults/Office chair.png';
    if (catLower === 'workstations' || subTypeLower.includes('workstation')) return '/defaults/Office chair.png';
    if (catLower === 'office partition and fitting' || subTypeLower.includes('partition')) return '/defaults/Office chair.png';

    // Plant & Machinery
    if (catLower === 'plant and machinery' || subTypeLower === 'power generators') return '/defaults/ict_default.png';

    // Utility Equipment
    if (catLower === 'utility equipment') return '/defaults/ups/ups_default.png';

    // Intangible Fixed Assets / Software
    if (catLower === 'intangible fixed assets') return '/defaults/ict_default.png';

    // Installed Infrastructure
    if (catLower === 'installed infrastructure & utility system') return '/defaults/electrical/generic.png';

    // Land & Buildings
    if (catLower === 'land and buildings' || majorCatLower.includes('land')) return '/defaults/land_buildings/office_building.png';

    // Non-Fixed Assets
    if (catLower === 'cash and bank balance') return '/defaults/cash_bank_balance.png';

    if (catLower === 'office consumables') {
        if (subTypeLower === 'printing papers')             return '/defaults/office_consumables/printing_papers.png';
        if (subTypeLower === 'toner and ink cartridges')    return '/defaults/office_consumables/toner_ink_cartridges.png';
        if (subTypeLower === 'stationery items')            return '/defaults/office_consumables/stationery_items.png';
        
        return '/defaults/office_consumables/stationery_items.png'; // default fallback for office consumables
    }
    if (subTypeLower.includes('consumable') && catLower !== 'it and technical consumables') return '/defaults/ict_default.png';
    
    if (catLower === 'it and technical consumables') {
        if (subTypeLower === 'usb / flash drives') return '/defaults/it_consumables/usb_drive.png';
        if (subTypeLower === 'external hard drives') return '/defaults/it_consumables/external_hdd.png';
        if (subTypeLower === 'network cables') return '/defaults/it_consumables/network_cables.png';
        if (subTypeLower === 'power cables / adapters') return '/defaults/it_consumables/power_cables.png';
        if (subTypeLower === 'ups batteries') return '/defaults/it_consumables/ups_batteries.png';
        if (subTypeLower === 'wireless peripherals') return '/defaults/it_consumables/wireless_peripherals.png';
        if (subTypeLower === 'ram / memory modules') return '/defaults/it_consumables/ram_modules.png';
        
        return '/defaults/it_consumables/it_consumables.png';
    }

    if (catLower === 'maintenance and workshop supplies') {
        if (subTypeLower === 'spare parts for machinery') return '/defaults/maintenance_workshop/spare_parts_machinery.svg';
        if (subTypeLower === 'lubricants and oil') return '/defaults/maintenance_workshop/lubricants_oil.svg';
        if (subTypeLower === 'hand tools') return '/defaults/maintenance_workshop/hand_tools.svg';
        if (subTypeLower === 'power tools') return '/defaults/maintenance_workshop/power_tools.svg';
        if (subTypeLower === 'fasteners / fixings' || subTypeLower === 'fastener / fixings') return '/defaults/maintenance_workshop/fastener_fixings.svg';
        if (subTypeLower === 'cleaning supplies') return '/defaults/maintenance_workshop/cleaning_supplies.svg';

        return '/defaults/maintenance_workshop/maintenance_default.svg';
    }
    if (catLower === 'fuel and energy supplies') {
        if (subTypeLower === 'petrol')                  return '/defaults/fuel_energy/petrol.png';
        if (subTypeLower === 'diesel')                  return '/defaults/fuel_energy/diesel.png';
        if (subTypeLower === 'liquefied gas (lpg)')     return '/defaults/fuel_energy/lpg.png';
        if (subTypeLower === 'lubricating grease')      return '/defaults/fuel_energy/lubricating_grease.png';
        if (subTypeLower === 'engine oil')              return '/defaults/fuel_energy/engine_oil.png';

        return '/defaults/fuel_energy/petrol.png'; // default fallback for fuel category
    }
    if (catLower === 'safety and productive equipment') return '/defaults/ict_default.png';

    // Final absolute fallback — return null so the UI shows a placeholder icon
    return null;
};

/**
 * Maps a saloon car model name to its uploaded image file.
 * Filenames as uploaded by the user.
 */
export const getSaloonModelImage = (model) => {
    if (!model) return null;

    const map = {
        // Hyundai
        'Hyundai Accent': '/defaults/saloon/Hyundai accent.jpg',
        'Hyundai Sonata': '/defaults/saloon/Hyundai Sonata.jpg',
        'Hyundai Elantra': '/defaults/saloon/Elantra.png',

        // Mercedes-Benz
        'C-Class': '/defaults/saloon/mercedes-benz-c-class.png',
        'E-Class': '/defaults/saloon/Mercedes-Benz E-Class.png',
        'S-Class': '/defaults/saloon/Mercedes-Benz S-class.png',
        'CLS-Class': '/defaults/saloon/mercedes-benz-cls-class.png',

        // Nissan
        'Nissan Sentra': "/defaults/saloon/'Nissan Sentra.png",
        'Nissan Versa': '/defaults/saloon/Nissan Versa.png',
        'Nissan Sunny': '/defaults/saloon/Nissan Sunny.png',
        'Nissan Maxima': '/defaults/saloon/Nissan Maxima.png',
        'Nissan Altima': '/defaults/saloon/Nissan almera.jpg', // Using almera as fallback if meant

        // Toyota
        'Toyota Corolla': '/defaults/saloon/Toyota corolla.png',
        'Toyota Camry': '/defaults/saloon/Toyota camry.png',

        // KIA
        'KIA Rio': '/defaults/saloon/Kia Rio.png',
        'KIA Optima': '/defaults/saloon/Kia Optima.png',
        'KIA Forte': '/defaults/saloon/kia forte.png',
    };

    return map[model] || null;
};

/**
 * Maps an SUV model name to its expected image file.
 * Fallbacks to fleet default if missing.
 */
export const getSUVModelImage = (model) => {
    if (!model) return null;

    const map = {
        // Toyota
        'Land Cruiser V8': '/defaults/suv/land_cruiser_v8.png',
        'Land Cruiser Prado': '/defaults/suv/land_cruiser_prado.png',
        'Fortuner': '/defaults/suv/fortuner.png',
        'Highlander': '/defaults/suv/highlander.png',
        'Rav 4': '/defaults/suv/rav_4.png',

        // Nissan
        'Nissan Patrol': '/defaults/suv/nissan_patrol.png',
        'Armada': '/defaults/suv/armada.png',

        // Mitsubishi
        'Pajero': '/defaults/suv/pajero.png',

        // Hyundai
        'Palisade': '/defaults/suv/palisade.png',
        'Santa-fe': '/defaults/suv/santa_fe.png',
    };

    return map[model] || '/defaults/fleet_default.png';
};

/**
 * Maps a Pick-up model name to its expected image file.
 */
export const getPickupModelImage = (model) => {
    if (!model) return null;

    const map = {
        // Toyota
        'Hilux': '/defaults/pickup/hilux.png',
        'Land Cruiser Pick-up': '/defaults/pickup/land_cruiser_pickup.png',
        'Tundra': '/defaults/pickup/tundra.png',
        'Tacoma': '/defaults/pickup/tacoma.png',

        // Nissan
        'Navara': '/defaults/pickup/navara.png',
        'Frontier': '/defaults/pickup/frontier.png',
        'Hard body': '/defaults/pickup/hard_body.png',

        // Mitsubishi
        'L 200': '/defaults/pickup/l_200.png',

        // Ford
        'Ranger': '/defaults/pickup/ranger.png',
        'F150': '/defaults/pickup/f150.png',
        'Raptor': '/defaults/pickup/raptor.png',

        // Zonda
        'Poer Pick-up': '/defaults/pickup/poer_pickup.png',

        // Changan
        'Changan Pick-up': '/defaults/pickup/changan_pickup.png',

        // Peugeot
        'LandTrek': '/defaults/pickup/landtrek.png',

        // Isuzu
        'D-Max': '/defaults/pickup/d_max.png',

        // Foton
        'Tunland': '/defaults/pickup/tunland.png'
    };

    return map[model] || '/defaults/fleet_default.png';
};

/**
 * Maps a Van model name to its expected image file.
 */
export const getVanModelImage = (model) => {
    if (!model) return null;

    const map = {
        // Iveco
        'Iveco Daily': '/defaults/van/iveco_daily.png',

        // Ford
        'Ford Transit': '/defaults/van/ford_transit.png',

        // Mercedes-Benz
        'Sprinter Van': '/defaults/van/sprinter_van.png',

        // MAN
        'MAN TGE Van': '/defaults/van/man_tge_van.png'
    };

    return map[model] || '/defaults/fleet_default.png';
};

/**
 * Maps a Bus model name to its expected image file.
 */
export const getBusModelImage = (model) => {
    if (!model) return null;

    const map = {
        // Toyota
        'Hiace': '/defaults/bus/hiace.png',
        'Coaster bus': '/defaults/bus/coaster_bus.png',

        // Nissan
        'Civillian': '/defaults/bus/civillian.png',
        'Caravan': '/defaults/bus/fleet_default.png'
    };

    return map[model] || '/defaults/bus/fleet_default.png';
};

/**
 * Maps a Printer model name to its expected image file.
 */
export const getPrinterModelImage = (model) => {
    if (!model) return null;

    const map = {
        // HP
        'LaserJet Pro': '/defaults/printers/hp_laserjet_pro.png',
        'OfficeJet Pro': '/defaults/printers/hp_officejet_pro.png',
        'DeskJet': '/defaults/printers/hp_deskjet.png',
        'PageWide': '/defaults/printers/hp_pagewide.png',
        'DesignJet': '/defaults/printers/hp_designjet.png',

        // Canon
        'PIXMA': '/defaults/printers/canon_pixma.png',
        'imageCLASS': '/defaults/printers/canon_imageclass.png',
        'MAXIFY': '/defaults/printers/canon_maxify.png',
        'imageRUNNER': '/defaults/printers/canon_imagerunner.png',

        // Epson
        'EcoTank': '/defaults/printers/epson_ecotank.png',
        'WorkForce': '/defaults/printers/epson_workforce.png',
        'Expression': '/defaults/printers/epson_expression.png',
        'SureColor': '/defaults/printers/epson_surecolor.png',

        // Brother
        'HL Series': '/defaults/printers/brother_hl_series.png',
        'MFC Series': '/defaults/printers/brother_mfc_series.png',
        'DCP Series': '/defaults/printers/brother_dcp_series.png',

        // Xerox
        'Phaser': '/defaults/printers/xerox_phaser.png',
        'VersaLink': '/defaults/printers/xerox_versalink.png',
        'AltaLink': '/defaults/printers/xerox_altalink.png',
        'WorkCentre': '/defaults/printers/xerox_workcentre.png',

        // Ricoh
        'Aficio': '/defaults/printers/ricoh_aficio.png',
        'SP Series': '/defaults/printers/ricoh_sp_series.png',
        'IM Series': '/defaults/printers/ricoh_im_series.png',

        // Kyocera
        'ECOSYS': '/defaults/printers/kyocera_ecosys.png',
        'TASKalfa': '/defaults/printers/kyocera_taskalfa.png',

        // Lexmark
        'CX Series': '/defaults/printers/lexmark_cx_series.png',
        'CS Series': '/defaults/printers/lexmark_cs_series.png',
        'MX Series': '/defaults/printers/lexmark_mx_series.png',

        // Samsung
        'Xpress': '/defaults/printers/samsung_xpress.png',
        'ProXpress': '/defaults/printers/samsung_proxpress.png',
        'MultiXpress': '/defaults/printers/samsung_multixpress.png'
    };

    return map[model] || '/defaults/ict_default.png';
};

/**
 * Maps a Photocopier model name to its expected image file.
 */
export const getPhotocopierModelImage = (model) => {
    if (!model) return null;

    const map = {
        // Ricoh
        'IM Series': '/defaults/photocopiers/ricoh_im_series.png',
        'MP Series': '/defaults/photocopiers/ricoh_mp_series.png',
        'Pro Series': '/defaults/photocopiers/ricoh_pro_series.png',

        // Xerox
        'AltaLink': '/defaults/photocopiers/xerox_altalink.png',
        'VersaLink': '/defaults/photocopiers/xerox_versalink.png',
        'PrimeLink': '/defaults/photocopiers/xerox_primelink.png',

        // Canon
        'imageRUNNER ADVANCE': '/defaults/photocopiers/canon_imagerunner_advance.png',
        'imagePRESS': '/defaults/photocopiers/canon_imagepress.png',

        // Kyocera
        'TASKalfa': '/defaults/photocopiers/kyocera_taskalfa.png',
        'ECOSYS': '/defaults/photocopiers/kyocera_ecosys.png',

        // Konica Minolta
        'bizhub': '/defaults/photocopiers/konica_minolta_bizhub.png',
        'AccurioPress': '/defaults/photocopiers/konica_minolta_accuriopress.png',

        // Sharp
        'MX Series': '/defaults/photocopiers/sharp_mx_series.png',
        'BP Series': '/defaults/photocopiers/sharp_bp_series.png',

        // Toshiba
        'e-STUDIO': '/defaults/photocopiers/toshiba_e_studio.png',

        // HP
        'LaserJet Managed': '/defaults/photocopiers/hp_laserjet_managed.png',
        'PageWide Managed': '/defaults/photocopiers/hp_pagewide_managed.png'
    };

    return map[model] || '/defaults/ict_default.png';
};


/**
 * Maps a Scanner model name to its expected image file.
 */
export const getScannerModelImage = (model) => {
    if (!model) return null;

    const map = {
        // Fujitsu
        'ScanSnap': '/defaults/scanners/fujitsu_scansnap.png',
        'fi Series': '/defaults/scanners/fujitsu_fi_series.png',
        'SP Series': '/defaults/scanners/fujitsu_sp_series.png',

        // Epson
        'WorkForce DS': '/defaults/scanners/epson_workforce_ds.png',
        'Perfection': '/defaults/scanners/epson_perfection.png',
        'FastFot': '/defaults/scanners/epson_fastfot.png',

        // Canon
        'imageFORMULA': '/defaults/scanners/canon_imageformula.png',
        'CanoScan': '/defaults/scanners/canon_canoscan.png',

        // HP
        'ScanJet Pro': '/defaults/scanners/hp_scanjet_pro.png',
        'ScanJet Enterprise': '/defaults/scanners/hp_scanjet_enterprise.png',

        // Brother
        'ADS Series': '/defaults/scanners/brother_ads_series.png',
        'DS Series': '/defaults/scanners/brother_ds_series.png',

        // Kodak Alaris
        'S2000 Series': '/defaults/scanners/kodak_alaris_s2000_series.png',
        'i2000 Series': '/defaults/scanners/kodak_alaris_i2000_series.png',

        // Panasonic
        'KV Series': '/defaults/scanners/panasonic_kv_series.png',

        // Xerox
        'DocuMate': '/defaults/scanners/xerox_documate.png',
        'Duplex Combo': '/defaults/scanners/xerox_duplex_combo.png'
    };

    return map[model] || '/defaults/ict_default.png';
};

/**
 * Maps a Power Backup / UPS brand name to its expected image file.
 */
export const getUpsBrandImage = (brand) => {
    if (!brand) return null;

    const brandLower = brand.toLowerCase();

    if (brandLower.includes('apc')) return '/defaults/ups/apc.png';
    if (brandLower.includes('eaton')) return '/defaults/ups/eaton.png';
    if (brandLower.includes('vertiv') || brandLower.includes('liebert')) return '/defaults/ups/vertiv.png';
    if (brandLower.includes('cyberpower')) return '/defaults/ups/cyberpower.png';
    if (brandLower.includes('tripp lite')) return '/defaults/ups/tripp_lite.png';
    if (brandLower.includes('mercury')) return '/defaults/ups/mercury.png';
    if (brandLower.includes('mec')) return '/defaults/ups/mec.png';

    return '/defaults/ups/ups_default.png';
};

/**
 * Maps a Solar Power System brand name to its expected image file.
 */
export const getSolarBrandImage = (brand) => {
    if (!brand) return null;

    const brandLower = brand.toLowerCase();

    if (brandLower.includes('sma')) return '/defaults/solar/sma.png';
    if (brandLower.includes('huawei')) return '/defaults/solar/huawei.png';
    if (brandLower.includes('solaredge') || brandLower.includes('solar edge')) return '/defaults/solar/solaredge.png';
    if (brandLower.includes('sungrow')) return '/defaults/solar/sungrow.png';
    if (brandLower.includes('victron')) return '/defaults/solar/victron_energy.png';
    if (brandLower.includes('abb')) return '/defaults/solar/abb.png';
    if (brandLower.includes('schneider')) return '/defaults/solar/schneider_electric.png';

    return '/defaults/solar/solar_default.png';
};

/**
 * Maps a Refrigerator brand name to its expected image file.
 */
export const getRefrigeratorBrandImage = (brand) => {
    if (!brand) return null;

    const brandLower = brand.toLowerCase();

    if (brandLower.includes('lg')) return '/defaults/refrigerators/lg.png';
    if (brandLower.includes('samsung')) return '/defaults/refrigerators/samsung.png';

    return '/defaults/refrigerators/generic.png';
};

/**
 * Maps a Microwave brand name to its expected image file.
 */
export const getMicrowaveBrandImage = (brand) => {
    if (!brand) return null;

    const brandLower = brand.toLowerCase();

    if (brandLower.includes('lg')) return '/defaults/microwaves/lg.png';
    if (brandLower.includes('samsung')) return '/defaults/microwaves/samsung.png';

    return '/defaults/microwaves/generic.png';
};

/**
 * Maps a Kettle brand name to its expected image file.
 */
export const getKettleBrandImage = (brand) => {
    return '/defaults/kettles/generic.png';
};

/**
 * Maps a Public Address System equipment type to its expected image file.
 * Images are keyed by the "type" field (Equipment Type dropdown).
 */
export const getPASystemEquipmentImage = (type) => {
    if (!type) return '/defaults/pa_system/generic.png';

    const typeLower = type.toLowerCase();

    if (typeLower.includes('amplifier')) return '/defaults/pa_system/amplifier.png';
    if (typeLower.includes('mixer')) return '/defaults/pa_system/audio_mixer.png';
    if (typeLower.includes('microphone')) return '/defaults/pa_system/microphone.png';
    if (typeLower.includes('loudspeaker') || typeLower.includes('horn')) return '/defaults/pa_system/loudspeaker.png';
    if (typeLower.includes('megaphone')) return '/defaults/pa_system/megaphone.png';
    if (typeLower.includes('console')) return '/defaults/pa_system/pa_console.png';

    return '/defaults/pa_system/generic.png';
};

/**
 * Maps a Display System type to its expected image file.
 * Images are keyed by the "type" field (Display Type dropdown).
 */
export const getDisplaySystemImage = (type) => {
    if (!type) return '/defaults/display_system/generic.png';

    const typeLower = type.toLowerCase();

    if (typeLower.includes('led')) return '/defaults/display_system/led_tv.png';
    if (typeLower.includes('lcd')) return '/defaults/display_system/lcd_panel.png';
    if (typeLower.includes('oled')) return '/defaults/display_system/oled_display.png';
    if (typeLower.includes('whiteboard') || typeLower.includes('smart board')) return '/defaults/display_system/interactive_whiteboard.png';
    if (typeLower.includes('projector')) return '/defaults/display_system/projector.png';
    if (typeLower.includes('video wall')) return '/defaults/display_system/video_wall.png';

    return '/defaults/display_system/generic.png';
};

/**
 * Maps a Fire Suppression System brand or model to its expected image file.
 */
export const getFireSuppressionSystemImage = (brand, model) => {
    const modelLower = (model || '').toLowerCase();
    if (modelLower.includes('fm-200') || modelLower.includes('fm200')) return '/defaults/fire_suppression/fm200_system.png';
    if (modelLower.includes('co2') || modelLower.includes('flooding')) return '/defaults/fire_suppression/co2_system.png';
    if (modelLower.includes('sprinkler') || modelLower.includes('wet pipe') || modelLower.includes('aquamist')) return '/defaults/fire_suppression/sprinkler_system.png';
    if (modelLower.includes('inergen')) return '/defaults/fire_suppression/inergen.png';
    if (modelLower.includes('halon') || modelLower.includes('chemical')) return '/defaults/fire_suppression/chemical_system.png';
    if (modelLower.includes('detector')) return '/defaults/fire_suppression/smoke_detector.png';
    if (modelLower.includes('panel') || modelLower.includes('nfs') || modelLower.includes('ifc')) return '/defaults/fire_suppression/control_panel.png';

    const brandLower = (brand || '').toLowerCase();
    if (brandLower.includes('kidde')) return '/defaults/fire_suppression/kidde.png';
    if (brandLower.includes('ansul')) return '/defaults/fire_suppression/ansul.png';
    if (brandLower.includes('tyco')) return '/defaults/fire_suppression/tyco.png';
    if (brandLower.includes('hochiki')) return '/defaults/fire_suppression/hochiki.png';
    if (brandLower.includes('notifier')) return '/defaults/fire_suppression/notifier.png';
    if (brandLower.includes('johnson')) return '/defaults/fire_suppression/johnson_controls.png';
    if (brandLower.includes('minimax')) return '/defaults/fire_suppression/minimax.png';

    return '/defaults/fire_suppression/generic.png';
};

/**
 * Maps a fan type to its 3D isometric default image.
 */
export const getFanTypeImage = (fanType) => {
    if (!fanType) return '/defaults/fans/ceiling_fan.png';
    const t = fanType.toLowerCase();
    if (t.includes('ceiling')) return '/defaults/fans/ceiling_fan.png';
    if (t.includes('standing') || t.includes('pedestal')) return '/defaults/fans/standing_fan.png';
    if (t.includes('wall')) return '/defaults/fans/wall_fan.png';
    if (t.includes('table') || t.includes('desk')) return '/defaults/fans/table_fan.png';
    if (t.includes('industrial') || t.includes('floor')) return '/defaults/fans/industrial_fan.png';
    if (t.includes('exhaust') || t.includes('extractor')) return '/defaults/fans/exhaust_fan.png';
    return '/defaults/fans/ceiling_fan.png';
};

/**
 * Maps an elevator / lift type to its 3D isometric default image.
 */
export const getElevatorTypeImage = (liftType) => {
    if (!liftType) return '/defaults/elevators/passenger_lift.png';
    const t = liftType.toLowerCase();
    if (t.includes('passenger')) return '/defaults/elevators/passenger_lift.png';
    if (t.includes('service') || t.includes('goods') || t.includes('freight')) return '/defaults/elevators/service_lift.png';
    if (t.includes('hospital') || t.includes('bed') || t.includes('stretcher')) return '/defaults/elevators/hospital_lift.png';
    if (t.includes('dumbwaiter')) return '/defaults/elevators/dumbwaiter.png';
    return '/defaults/elevators/passenger_lift.png';
};
/**
 * Maps a traffic light system type to its 3D isometric default image.
 */
export const getTrafficLightTypeImage = (systemType) => {
    if (!systemType) return '/defaults/traffic_lights/generic.png';
    const t = systemType.toLowerCase();
    if (t.includes('fixed') || t.includes('timed')) return '/defaults/traffic_lights/fixed_time.png';
    if (t.includes('vehicle') || t.includes('actuated') || t.includes('smart')) return '/defaults/traffic_lights/vehicle_actuated.png';
    if (t.includes('pedestrian') || t.includes('crossing') || t.includes('pelican')) return '/defaults/traffic_lights/pedestrian_crossing.png';
    return '/defaults/traffic_lights/generic.png';
};

/**
 * Maps an electrical component type to its 3D isometric default image.
 */
export const getElectricalComponentImage = (componentType) => {
    if (!componentType) return '/defaults/electrical/generic.png';
    const t = componentType.toLowerCase();
    if (t.includes('switchgear') || t.includes('distribution') || t.includes('breaker') || t.includes('mccb')) return '/defaults/electrical/switchgear.png';
    if (t.includes('panel') || t.includes('control')) return '/defaults/electrical/control_panel.png';
    if (t.includes('transformer')) return '/defaults/electrical/transformer.png';
    if (t.includes('cable') || t.includes('wiring')) return '/defaults/electrical/cables.png';
    if (t.includes('light') || t.includes('fixture')) return '/defaults/electrical/lighting.png';
    return '/defaults/electrical/generic.png';
};

/**
 * Maps an AC type to its 3D isometric default image.
 */
export const getACTypeImage = (acType) => {
    if (!acType) return '/defaults/ac/split_ac.png';
    const t = acType.toLowerCase();
    if (t.includes('split')) return '/defaults/ac/split_ac.png';
    if (t.includes('cassette')) return '/defaults/ac/cassette_ac.png';
    if (t.includes('standing') || t.includes('tower')) return '/defaults/ac/standing_ac.png';
    if (t.includes('window')) return '/defaults/ac/window_ac.png';
    if (t.includes('portable')) return '/defaults/ac/portable_ac.png';
    if (t.includes('vrf') || t.includes('vrv') || t.includes('central')) return '/defaults/ac/vrv_hvac.png';
    return '/defaults/ac/split_ac.png';
};
