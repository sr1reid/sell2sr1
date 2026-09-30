import { VehicleCategory, DealershipLocation, InquiryStage, ConditionRating, TitleStatus } from './types';

export const DEALERSHIP_LOCATIONS: Record<DealershipLocation, { name: string; address: string; phone: string; shortName: string; services: string }> = {
  turner_me: {
    name: 'SR1 Turner, Maine',
    address: '2239 Auburn Road, Turner, ME 04282',
    phone: '(207) 224-8444',
    shortName: 'Turner, ME',
    services: 'RVs, Trailers, Tractors, Heavy Equipment, Powersports, Containers, Docks'
  },
  manchester_me: {
    name: 'SR1 Manchester, Maine',
    address: '746 Western Avenue, Manchester, ME 04351',
    phone: '(207) 622-0672',
    shortName: 'Manchester, ME',
    services: 'RVs, Trailers, Equipment'
  },
  hermon_me: {
    name: 'SR1 Hermon, Maine',
    address: '34 Page Road W, Hermon, ME 04401',
    phone: '(207) 605-0284',
    shortName: 'Hermon, ME',
    services: 'Trailers, Containers, Equipment Rentals'
  },
  orono_me: {
    name: 'SR1 Orono, Maine',
    address: '485 Main St / 29 Stillwater Ave, Orono, ME 04473',
    phone: '(207) 300-4000',
    shortName: 'Orono, ME',
    services: 'Tractors, Heavy Equipment'
  },
  houlton_me: {
    name: 'SR1 Houlton, Maine',
    address: '28 Ludlow Rd, Houlton, ME 04730',
    phone: '(207) 521-5264',
    shortName: 'Houlton, ME',
    services: 'Trailers, Equipment'
  },
  caribou_me: {
    name: 'SR1 Caribou, Maine',
    address: '323 Sweden St, Caribou, ME 04736',
    phone: '(207) 498-2549',
    shortName: 'Caribou, ME',
    services: 'Equipment'
  },
  loudon_nh: {
    name: 'SR1 Loudon, New Hampshire',
    address: '7 Wales Bridge Rd / Route 106N, Loudon, NH 03307',
    phone: '(603) 688-9000',
    shortName: 'Loudon, NH',
    services: 'Tractors, Heavy Equipment, Trailers, RVs, Containers'
  },
  epsom_nh: {
    name: 'SR1 Epsom, New Hampshire',
    address: '2080 Dover Road, Epsom, NH 03234',
    phone: '(603) 736-0320',
    shortName: 'Epsom, NH',
    services: 'Powersports, Docks'
  },
  pickup_requested: {
    name: 'On-Site Pickup (Anywhere in New England)',
    address: 'Customer Specified Location',
    phone: '',
    shortName: 'On-Site Pickup',
    services: 'Mobile Transport Dispatched Directly to You'
  }
};

export const CATEGORIES: Record<VehicleCategory, {
  label: string;
  description: string;
  isHoursBased: boolean;
  subcategories: { id: string; label: string }[];
  photoPrompts: { id: string; label: string; description: string; required: boolean }[];
}> = {
  rv: {
    label: 'RVs / Campers',
    description: 'Travel trailers, 5th wheels, motorhomes, toy haulers & truck campers',
    isHoursBased: false,
    subcategories: [
      { id: 'travel_trailer', label: 'Travel Trailer' },
      { id: 'fifth_wheel', label: 'Fifth Wheel' },
      { id: 'toy_hauler', label: 'Toy Hauler' },
      { id: 'class_c', label: 'Class C Motorhome' },
      { id: 'class_a', label: 'Class A Motorhome' },
      { id: 'class_b', label: 'Class B / Camper Van' },
      { id: 'truck_camper', label: 'Truck Camper' },
      { id: 'pop_up', label: 'Pop-Up Camper' }
    ],
    photoPrompts: [
      { id: 'ext_front_side', label: 'Front & Side Profile', description: 'Angled shot showing front cap and body', required: true },
      { id: 'ext_rear_side', label: 'Rear & Opposite Side', description: 'Angled shot of rear and sides', required: true },
      { id: 'interior_main', label: 'Main Living Area', description: 'Living area, kitchen, slide-outs', required: true },
      { id: 'interior_bed_bath', label: 'Bedroom & Bath', description: 'Bed, bath, and storage areas', required: false },
      { id: 'vin_plate', label: 'VIN / Federal Tag', description: 'Tag on front-left exterior frame', required: true },
      { id: 'damage_flaws', label: 'Any Scratches or Wear', description: 'Any known imperfections', required: false }
    ]
  },
  trailer: {
    label: 'Trailers',
    description: 'Dump trailers, cargo/enclosed, equipment haulers, utility, tilt & goosenecks',
    isHoursBased: false,
    subcategories: [
      { id: 'dump_trailer', label: 'Dump Trailer' },
      { id: 'cargo_enclosed', label: 'Cargo / Enclosed Trailer' },
      { id: 'equipment_trailer', label: 'Equipment Hauler' },
      { id: 'utility_landscape', label: 'Utility / Landscape Trailer' },
      { id: 'gooseneck', label: 'Gooseneck / Deckover' },
      { id: 'tilt_bed', label: 'Tilt Bed Trailer' },
      { id: 'snowmobile_atv', label: 'Snowmobile / ATV Trailer' },
      { id: 'car_hauler', label: 'Car Hauler' }
    ],
    photoPrompts: [
      { id: 'ext_front_hitch', label: 'Front Tongue & Coupler', description: 'Tongue, jack, and front wall', required: true },
      { id: 'deck_interior', label: 'Bed / Floor / Interior', description: 'Floor condition and walls', required: true },
      { id: 'rear_gates', label: 'Rear Gate / Ramps', description: 'Ramp or barn doors and hinges', required: true },
      { id: 'tires_axles', label: 'Tires & Axles', description: 'Tread depth and suspension', required: true },
      { id: 'vin_plate', label: 'VIN Tag Plate', description: 'Metal stamped tag on trailer tongue', required: true }
    ]
  },
  tractor: {
    label: 'Tractors',
    description: 'Sub-compact, compact, and utility tractors with loaders & attachments',
    isHoursBased: true,
    subcategories: [
      { id: 'sub_compact', label: 'Sub-Compact Tractor (<25 HP)' },
      { id: 'compact_tractor', label: 'Compact Tractor (25-50 HP)' },
      { id: 'utility_tractor', label: 'Utility Tractor (50+ HP)' },
      { id: 'commercial_mower', label: 'Commercial Mower' },
      { id: 'tractor_loader_backhoe', label: 'Tractor Loader Backhoe (TLB)' }
    ],
    photoPrompts: [
      { id: 'ext_full_side', label: 'Full Tractor Profile', description: 'Side view with loader/attachments visible', required: true },
      { id: 'hour_meter', label: 'Hour Meter / Dashboard', description: 'Readable photo of engine hours', required: true },
      { id: 'loader_bucket', label: 'Loader & Bucket', description: 'Front loader, bucket cutting edge', required: true },
      { id: 'rear_3point_pto', label: '3-Point Hitch & PTO', description: 'Rear hitch, arms, PTO', required: true },
      { id: 'serial_plate', label: 'Serial Number Plate', description: 'Metal serial plate on chassis', required: true }
    ]
  },
  equipment: {
    label: 'Heavy Equipment',
    description: 'Track loaders, skid steers, mini excavators, telehandlers & attachments',
    isHoursBased: true,
    subcategories: [
      { id: 'compact_track_loader', label: 'Compact Track Loader (CTL)' },
      { id: 'skid_steer', label: 'Skid Steer Loader (Wheeled)' },
      { id: 'mini_excavator', label: 'Mini / Compact Excavator' },
      { id: 'backhoe_loader', label: 'Full Size Backhoe' },
      { id: 'heavy_attachment', label: 'Equipment Attachments' }
    ],
    photoPrompts: [
      { id: 'ext_full', label: 'Full Machine Profile', description: 'Full view showing boom and undercarriage', required: true },
      { id: 'hour_meter', label: 'Hour Meter', description: 'Instrument cluster showing hours', required: true },
      { id: 'tracks_undercarriage', label: 'Tracks / Undercarriage', description: 'Track wear, sprockets, rollers', required: true },
      { id: 'serial_plate', label: 'PIN / Serial Plate', description: 'Machine ID plate', required: true }
    ]
  },
  powersports: {
    label: 'Powersports',
    description: 'Side-by-sides (UTVs), ATVs, snowmobiles & off-road vehicles',
    isHoursBased: false,
    subcategories: [
      { id: 'utv_side_by_side', label: 'UTV / Side-by-Side (SxS)' },
      { id: 'atv_quad', label: 'ATV / 4-Wheeler' },
      { id: 'snowmobile', label: 'Snowmobile' },
      { id: 'youth_powersports', label: 'Youth Powersports' }
    ],
    photoPrompts: [
      { id: 'ext_front_angle', label: 'Front 3/4 Profile', description: 'Overall front and side profile', required: true },
      { id: 'odometer_hours', label: 'Odometer / Gauge Cluster', description: 'Miles and hours displayed', required: true },
      { id: 'cockpit_seating', label: 'Seating & Cockpit', description: 'Seats, roll cage, dash', required: true },
      { id: 'vin_plate', label: 'VIN Tag / Stamp', description: 'Frame VIN stamp or tag', required: true }
    ]
  },
  motorcycle: {
    label: 'Motorcycles',
    description: 'Cruisers, touring, sport bikes, adventure & dual sports',
    isHoursBased: false,
    subcategories: [
      { id: 'cruiser', label: 'Cruiser' },
      { id: 'touring', label: 'Touring / Bagger' },
      { id: 'adventure_dual', label: 'Adventure / Dual Sport' },
      { id: 'sport_bike', label: 'Sport Bike' },
      { id: 'dirt_bike', label: 'Dirt Bike / Motocross' }
    ],
    photoPrompts: [
      { id: 'ext_right_profile', label: 'Right Side Profile', description: 'Exhaust side full profile', required: true },
      { id: 'ext_left_profile', label: 'Left Side Profile', description: 'Opposite side profile', required: true },
      { id: 'odometer_display', label: 'Odometer Reading', description: 'Current mileage display', required: true },
      { id: 'vin_steering_neck', label: 'VIN Tag on Steering Head', description: 'Frame neck VIN tag', required: true }
    ]
  },
  boat_pwc: {
    label: 'Boats & PWCs',
    description: 'Pontoon boats, fishing boats, bowriders, personal watercraft (Jet Skis) & docks',
    isHoursBased: true,
    subcategories: [
      { id: 'pwc_jet_ski', label: 'Personal Watercraft (Jet Ski / Sea-Doo)' },
      { id: 'pontoon_tritoon', label: 'Pontoon / Tritoon Boat' },
      { id: 'fishing_boat', label: 'Aluminum / Fiberglass Fishing Boat' },
      { id: 'bowrider_deck', label: 'Bowrider / Deck Boat' },
      { id: 'dock_system', label: 'Dock System / Boat Lift' }
    ],
    photoPrompts: [
      { id: 'hull_exterior', label: 'Hull & Exterior', description: 'Hull sides, gelcoat, trailer', required: true },
      { id: 'interior_seating', label: 'Cockpit & Seating', description: 'Upholstery, helm, deck condition', required: true },
      { id: 'outboard_engine', label: 'Engine / Outboard', description: 'Engine cowl, lower unit, prop', required: true },
      { id: 'hin_plate', label: 'HIN (Hull ID Plate)', description: 'Starboard transom Hull Identification Number', required: true }
    ]
  },
  container: {
    label: 'Shipping Containers',
    description: '20ft, 40ft standard, 40ft High Cube & modified storage containers',
    isHoursBased: false,
    subcategories: [
      { id: 'container_20ft', label: '20ft Standard Storage Container' },
      { id: 'container_40ft', label: '40ft Standard Storage Container' },
      { id: 'container_40ft_hc', label: '40ft High Cube Container' },
      { id: 'container_custom', label: 'Custom Modified / Office Container' }
    ],
    photoPrompts: [
      { id: 'ext_doors', label: 'Cargo Doors & Hardware', description: 'Door rods, handles, and seals', required: true },
      { id: 'ext_sides', label: 'Exterior Walls & Roof', description: 'Corrugated side walls and roof', required: true },
      { id: 'interior_floor', label: 'Interior Floor & Walls', description: 'Marine plywood floor and interior condition', required: true },
      { id: 'csc_plate', label: 'CSC Safety Approval Plate', description: 'Metal data plate on left cargo door', required: false }
    ]
  },
  other: {
    label: 'Other',
    description: 'Vehicles, commercial assets, attachments, or specialty equipment not listed above',
    isHoursBased: false,
    subcategories: [
      { id: 'specialty_vehicle', label: 'Specialty Vehicle / Truck' },
      { id: 'commercial_equipment', label: 'Commercial Equipment' },
      { id: 'attachment_implement', label: 'Attachment / Implement' },
      { id: 'general_other', label: 'Other' }
    ],
    photoPrompts: [
      { id: 'overview_front', label: 'Front / Main View', description: 'Clear overall photo', required: true },
      { id: 'overview_side', label: 'Side / Angle View', description: 'Side view and condition', required: true },
      { id: 'id_tag', label: 'Serial Number / VIN Tag', description: 'Identification plate', required: true }
    ]
  }
};

export const STAGE_CONFIG: Record<InquiryStage, { label: string; color: string; badgeClass: string; description: string }> = {
  new: {
    label: 'New Inquiry',
    color: '#71717a',
    badgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    description: 'Fresh submission awaiting initial staff review'
  },
  appraising: {
    label: 'Under Review / Comping',
    color: '#a1a1aa',
    badgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-600',
    description: 'Staff is researching book value, comps and inspection items'
  },
  offer_sent: {
    label: 'Offer Sent',
    color: '#e4e4e7',
    badgeClass: 'bg-zinc-700 text-white border-zinc-500 font-semibold',
    description: 'Cash buy offer delivered to the seller'
  },
  negotiating: {
    label: 'Counter / Discussing',
    color: '#d4d4d8',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-600',
    description: 'Customer countered or discussing pickup/logistics'
  },
  accepted: {
    label: 'Offer Accepted',
    color: '#ffffff',
    badgeClass: 'bg-white text-zinc-950 border-white font-bold',
    description: 'Customer agreed to offer terms, moving to inspection'
  },
  inspection: {
    label: 'Inspection & Logistics',
    color: '#d4d4d8',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-600',
    description: 'Scheduled for drop-off at SR1 store or on-site pickup'
  },
  purchased: {
    label: 'Purchased & Paid',
    color: '#ffffff',
    badgeClass: 'bg-white text-zinc-950 border-white font-bold',
    description: 'Deal closed, check issued, added to SR1 inventory'
  },
  declined: {
    label: 'Declined / Passed',
    color: '#52525b',
    badgeClass: 'bg-zinc-900 text-zinc-500 border-zinc-800',
    description: 'Offer passed or seller decided not to proceed'
  }
};

export const CONDITION_OPTIONS: Record<ConditionRating, { label: string; description: string }> = {
  excellent: {
    label: 'Excellent (Like New)',
    description: 'Clean title, minimal wear, garaged, fully operational with complete records'
  },
  very_good: {
    label: 'Very Good',
    description: 'Minor cosmetic signs of gentle use, excellent mechanical condition, all systems working'
  },
  good: {
    label: 'Good (Normal Wear)',
    description: 'Average wear for age/hours, runs and operates well, light blemishes'
  },
  fair: {
    label: 'Fair (Needs Work)',
    description: 'Noticeable wear, tires or seals need servicing, or has mechanical needs'
  },
  poor: {
    label: 'Project / TLC Required',
    description: 'Non-running, salvage, weather damage, or requires major repair'
  }
};

export const TITLE_STATUS_OPTIONS: Record<TitleStatus, { label: string; description: string }> = {
  clean_in_hand: {
    label: 'Clean Title in Hand',
    description: 'Physical title with no active liens'
  },
  financed_lien: {
    label: 'Financed / Bank Loan',
    description: 'Currently financed with a bank or credit union (SR1 handles payoff directly)'
  },
  leased: {
    label: 'Leased',
    description: 'Under active commercial or personal lease'
  },
  lost_title: {
    label: 'Lost Title / Bill of Sale',
    description: 'Title misplaced or registered via Bill of Sale'
  }
};
