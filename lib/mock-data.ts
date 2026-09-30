import { SellInquiry } from './types';

export const INITIAL_INQUIRIES: SellInquiry[] = [
  {
    id: 'inq-101',
    referenceId: 'SR1-SELL-1042',
    createdAt: '2026-09-16T17:30:00Z',
    updatedAt: '2026-09-16T18:15:00Z',
    stage: 'new',
    preferredLocation: 'manchester_me',
    assignedStaffName: 'Reid Lanpher',
    customer: {
      firstName: 'David',
      lastName: 'Morin',
      email: 'dmorin.outdoors@gmail.com',
      phone: '(207) 557-8192',
      preferredContact: 'text',
      city: 'Augusta',
      state: 'ME',
      zipCode: '04330'
    },
    unit: {
      category: 'rv',
      subcategory: 'fifth_wheel',
      year: 2022,
      make: 'Grand Design',
      model: 'Reflection 31MB',
      trimOrFloorplan: 'Mid-Bunk Bunkhouse',
      vinOrSerial: '573FS3625N1892019',
      mileageOrHours: 4800,
      isHours: false,
      specs: {
        lengthFeet: 36,
        slidesCount: 3,
        bunkhouse: true,
        generatorHours: 120
      },
      condition: 'very_good',
      conditionNotes: 'Always stored covered during Maine winters. Roof washed and treated twice a year. One small scuff on rear bumper from backing into campsite.',
      tireOrTrackCondition: 'good',
      knownIssuesOrDamage: 'Rear ladder rung slightly loose, otherwise spotless',
      maintenanceHistory: 'Full bearing repack done spring 2025 at Scott’s / SR1'
    },
    financials: {
      titleStatus: 'financed_lien',
      lienHolderName: 'Bangor Savings Bank',
      estimatedPayoff: 38500,
      askingPrice: 47000,
      isNegotiable: true
    },
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80', label: 'Exterior Front & Side', uploadedAt: '2026-09-16T17:28:00Z' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80', label: 'Main Living & Kitchen Slide', uploadedAt: '2026-09-16T17:28:30Z' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', label: 'Bedroom & Bath Area', uploadedAt: '2026-09-16T17:29:00Z' }
    ],
    offers: [],
    notes: [
      {
        id: 'n1',
        authorName: 'Reid Lanpher',
        authorRole: 'Managing Buyer',
        createdAt: '2026-09-16T18:15:00Z',
        category: 'comp',
        content: 'Clean high-demand floorplan. Comp sold last month at $49,500 retail. Book wholesale looks to be ~$42,000-$43,500. Recommend starting offer around $44,000 to win it.'
      }
    ],
    auditLog: [
      { id: 'a1', timestamp: '2026-09-16T17:30:00Z', actor: 'System', action: 'Inquiry Created', details: 'Web submission from sell2sr1.com' },
      { id: 'a2', timestamp: '2026-09-16T18:00:00Z', actor: 'Reid Lanpher', action: 'Assigned Lead', details: 'Assigned to Manchester Appraisal Desk' }
    ]
  },
  {
    id: 'inq-102',
    referenceId: 'SR1-SELL-1043',
    createdAt: '2026-09-16T15:20:00Z',
    updatedAt: '2026-09-16T16:45:00Z',
    stage: 'offer_sent',
    preferredLocation: 'hermon_me',
    assignedStaffName: 'Mark Stevens',
    customer: {
      firstName: 'Travis',
      lastName: 'Pelletier',
      email: 't.pelletier_earthworks@yahoo.com',
      phone: '(207) 949-3310',
      preferredContact: 'phone',
      city: 'Hermon',
      state: 'ME',
      zipCode: '04401'
    },
    unit: {
      category: 'tractor',
      subcategory: 'compact_tractor',
      year: 2021,
      make: 'Kubota',
      model: 'L3901 HST',
      trimOrFloorplan: '4WD with LA525 Quick Attach Loader',
      vinOrSerial: 'KB3901HST77291',
      mileageOrHours: 285,
      isHours: true,
      specs: {
        horsepower: 37.5,
        cabType: 'open_rops',
        driveType: '4wd',
        fuelType: 'diesel',
        attachmentsIncluded: ['LA525 Front End Loader', 'Land Pride 60" Rotary Cutter', 'Quick Hitch']
      },
      condition: 'excellent',
      conditionNotes: 'Always kept in heated barn when not in use. Only used for brush hogging 10 acres and plowing personal driveway. Fluid changes done at 50 and 200 hrs.',
      tireOrTrackCondition: 'like_new',
      knownIssuesOrDamage: 'None, immaculate condition'
    },
    financials: {
      titleStatus: 'clean_in_hand',
      askingPrice: 24500,
      isNegotiable: true
    },
    photos: [
      { id: 'p4', url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80', label: 'Tractor Side Profile', uploadedAt: '2026-09-16T15:18:00Z' },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80', label: 'Loader & Bucket', uploadedAt: '2026-09-16T15:19:00Z' }
    ],
    offers: [
      {
        id: 'off-1',
        amount: 22800,
        estRetailValue: 26500,
        expirationDate: '2026-09-23T23:59:59Z',
        status: 'sent',
        createdAt: '2026-09-16T16:45:00Z',
        createdBy: 'Mark Stevens',
        notes: 'Includes tractor, LA525 loader, and Land Pride rotary cutter. Drop off at Hermon store.',
        customerPayoffEstimate: 0,
        calculatedNetEquity: 22800
      }
    ],
    notes: [
      {
        id: 'n2',
        authorName: 'Mark Stevens',
        authorRole: 'Hermon Equipment Specialist',
        createdAt: '2026-09-16T16:40:00Z',
        category: 'offer_reason',
        content: 'Low hour L3901s sell within 10 days on our lot in Hermon. Offered $22,800. Customer has title in hand, no lien.'
      }
    ],
    auditLog: [
      { id: 'a3', timestamp: '2026-09-16T15:20:00Z', actor: 'System', action: 'Inquiry Created', details: 'Web submission' },
      { id: 'a4', timestamp: '2026-09-16T16:45:00Z', actor: 'Mark Stevens', action: 'Offer Sent', details: 'Sent formal cash offer of $22,800' }
    ]
  },
  {
    id: 'inq-103',
    referenceId: 'SR1-SELL-1044',
    createdAt: '2026-09-16T11:10:00Z',
    updatedAt: '2026-09-16T14:30:00Z',
    stage: 'accepted',
    preferredLocation: 'turner_me',
    assignedStaffName: 'Sarah Jenkins',
    customer: {
      firstName: 'Brad',
      lastName: 'Chamberlain',
      email: 'brad.chamberlain@frontier.com',
      phone: '(207) 312-6580',
      preferredContact: 'text',
      city: 'Auburn',
      state: 'ME',
      zipCode: '04210'
    },
    unit: {
      category: 'trailer',
      subcategory: 'dump_trailer',
      year: 2023,
      make: 'Diamond C',
      model: 'LPX 14ft Dump',
      trimOrFloorplan: 'Low Profile 14,900 GVWR',
      vinOrSerial: '4DOTC1427P1088492',
      mileageOrHours: 3500,
      isHours: false,
      specs: {
        lengthFeet: 14,
        axlesCount: 2,
        gvwrLbs: 14900
      },
      condition: 'good',
      conditionNotes: 'Hydraulics and scissor lift operate smoothly. Tarp kit installed. Minor rock chips inside bed, normal construction use.',
      tireOrTrackCondition: 'good',
      knownIssuesOrDamage: 'Right rear fender has a minor ding from equipment loading'
    },
    financials: {
      titleStatus: 'clean_in_hand',
      askingPrice: 11000,
      isNegotiable: true
    },
    photos: [
      { id: 'p6', url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80', label: 'Dump Trailer Angled View', uploadedAt: '2026-09-16T11:08:00Z' }
    ],
    offers: [
      {
        id: 'off-2',
        amount: 9800,
        estRetailValue: 12200,
        expirationDate: '2026-09-22T23:59:59Z',
        status: 'accepted',
        createdAt: '2026-09-16T13:00:00Z',
        createdBy: 'Sarah Jenkins',
        notes: 'Agreed at $9,800. Customer dropping off at SR1 Turner store on Friday morning.',
        customerPayoffEstimate: 0,
        calculatedNetEquity: 9800
      }
    ],
    notes: [
      {
        id: 'n3',
        authorName: 'Sarah Jenkins',
        authorRole: 'Trailer Appraiser',
        createdAt: '2026-09-16T14:30:00Z',
        category: 'inspection',
        content: 'Customer confirmed drop-off for Friday 9/19 at 9:30 AM at Turner lot. Check requested upon physical inspection and title sign-over.'
      }
    ],
    auditLog: [
      { id: 'a5', timestamp: '2026-09-16T11:10:00Z', actor: 'System', action: 'Inquiry Created', details: 'Web submission' },
      { id: 'a6', timestamp: '2026-09-16T13:00:00Z', actor: 'Sarah Jenkins', action: 'Offer Sent', details: 'Offer $9,800' },
      { id: 'a7', timestamp: '2026-09-16T14:25:00Z', actor: 'Brad Chamberlain', action: 'Offer Accepted', details: 'Customer accepted via SMS link' }
    ]
  },
  {
    id: 'inq-104',
    referenceId: 'SR1-SELL-1045',
    createdAt: '2026-09-15T19:40:00Z',
    updatedAt: '2026-09-16T09:15:00Z',
    stage: 'appraising',
    preferredLocation: 'loudon_nh',
    assignedStaffName: 'Chris Roy',
    customer: {
      firstName: 'Ethan',
      lastName: 'Gould',
      email: 'egould88@gmail.com',
      phone: '(603) 491-7704',
      preferredContact: 'text',
      city: 'Concord',
      state: 'NH',
      zipCode: '03301'
    },
    unit: {
      category: 'powersports',
      subcategory: 'utv_side_by_side',
      year: 2023,
      make: 'Polaris',
      model: 'RZR Pro XP Ultimate',
      trimOrFloorplan: 'Dynamix 2.0 / Ride Command',
      vinOrSerial: '4XAZA99D4PE119842',
      mileageOrHours: 850,
      isHours: false,
      specs: {
        engineCc: 1000,
        driveType: 'awd',
        fuelType: 'gas'
      },
      condition: 'excellent',
      conditionNotes: 'Never rolled or swamped. Clean NH trail miles. Has factory glass windshield, lower doors, winch, and 32-inch Pro Armor tires.',
      tireOrTrackCondition: 'like_new',
      knownIssuesOrDamage: 'None'
    },
    financials: {
      titleStatus: 'financed_lien',
      lienHolderName: 'Polaris Financial (Sheffield Financial)',
      estimatedPayoff: 18200,
      askingPrice: 25000,
      isNegotiable: true
    },
    photos: [
      { id: 'p7', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80', label: 'RZR Front View', uploadedAt: '2026-09-15T19:38:00Z' }
    ],
    offers: [],
    notes: [
      {
        id: 'n4',
        authorName: 'Chris Roy',
        authorRole: 'Powersports Appraiser',
        createdAt: '2026-09-16T09:15:00Z',
        category: 'call_log',
        content: 'Contacted Sheffield Financial with customer authorization for 10-day payoff. Payoff confirmed at $18,142.60. Appraising comps now.'
      }
    ],
    auditLog: [
      { id: 'a8', timestamp: '2026-09-15T19:40:00Z', actor: 'System', action: 'Inquiry Created', details: 'Web submission' }
    ]
  },
  {
    id: 'inq-105',
    referenceId: 'SR1-SELL-1046',
    createdAt: '2026-09-14T14:10:00Z',
    updatedAt: '2026-09-16T12:00:00Z',
    stage: 'inspection',
    preferredLocation: 'pickup_requested',
    assignedStaffName: 'Reid Lanpher',
    customer: {
      firstName: 'Wayne',
      lastName: 'Caron',
      email: 'caron.logging@myfairpoint.net',
      phone: '(207) 538-1290',
      preferredContact: 'phone',
      city: 'Presque Isle',
      state: 'ME',
      zipCode: '04769'
    },
    unit: {
      category: 'equipment',
      subcategory: 'compact_track_loader',
      year: 2020,
      make: 'Bobcat',
      model: 'T770 Compact Track Loader',
      trimOrFloorplan: 'High Flow Enclosed Cab A/C',
      vinOrSerial: 'B3BP12909',
      mileageOrHours: 1420,
      isHours: true,
      specs: {
        horsepower: 92,
        cabType: 'enclosed_cab_ac',
        fuelType: 'diesel',
        driveType: 'tracks',
        attachmentsIncluded: ['Severe Duty Bucket', 'Hydraulic Pallet Forks']
      },
      condition: 'very_good',
      conditionNotes: 'Tracks replaced 200 hours ago (90% remaining). Rollers and sprockets tight. Enclosed cab with ice cold A/C and working heat.',
      tireOrTrackCondition: 'like_new'
    },
    financials: {
      titleStatus: 'clean_in_hand',
      askingPrice: 52000,
      isNegotiable: false
    },
    photos: [
      { id: 'p8', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', label: 'Bobcat T770 Profile', uploadedAt: '2026-09-14T14:05:00Z' }
    ],
    offers: [
      {
        id: 'off-3',
        amount: 49500,
        estRetailValue: 56000,
        expirationDate: '2026-09-21T23:59:59Z',
        status: 'accepted',
        createdAt: '2026-09-15T10:00:00Z',
        createdBy: 'Reid Lanpher',
        notes: 'Agreed at $49,500 with SR1 flatbed truck dispatching for on-site pickup in Presque Isle on Thursday.',
        customerPayoffEstimate: 0,
        calculatedNetEquity: 49500
      }
    ],
    notes: [
      {
        id: 'n5',
        authorName: 'Reid Lanpher',
        authorRole: 'CEO / Buyer',
        createdAt: '2026-09-16T12:00:00Z',
        category: 'inspection',
        content: 'SR1 Logistics driver scheduled for Thursday 10:00 AM pickup at customer farm in Presque Isle. Check cut by accounting in Caribou office.'
      }
    ],
    auditLog: [
      { id: 'a9', timestamp: '2026-09-14T14:10:00Z', actor: 'System', action: 'Inquiry Created', details: 'Web submission' },
      { id: 'a10', timestamp: '2026-09-15T10:00:00Z', actor: 'Reid Lanpher', action: 'Offer Sent', details: 'Offer $49,500' },
      { id: 'a11', timestamp: '2026-09-15T15:30:00Z', actor: 'Wayne Caron', action: 'Offer Accepted', details: 'Accepted terms' }
    ]
  }
];
