export type VehicleCategory = 
  | 'rv'                  // RVs / Campers
  | 'trailer'             // Trailers
  | 'tractor'             // Tractors
  | 'equipment'           // Heavy Equipment
  | 'powersports'         // Powersports
  | 'motorcycle'          // Motorcycles
  | 'boat_pwc'            // Boats & PWCs
  | 'container'           // Shipping Containers
  | 'other';              // Other

export type ConditionRating = 'excellent' | 'very_good' | 'good' | 'fair' | 'poor';

export type TitleStatus = 'owned_not_titleable' | 'owned_clean_title' | 'financed_money_owed' | 'other';

export type DealershipLocation = 
  | 'turner_me' 
  | 'manchester_me' 
  | 'hermon_me' 
  | 'orono_me'
  | 'houlton_me' 
  | 'caribou_me' 
  | 'loudon_nh' 
  | 'epsom_nh'
  | 'pickup_requested';

export type InquiryStage = 
  | 'new'            // Just submitted, awaiting staff review
  | 'appraising'     // Staff analyzing specs, running comps
  | 'offer_sent'     // Offer delivered to customer
  | 'negotiating'    // Customer countered or discussing terms
  | 'accepted'       // Customer accepted offer
  | 'inspection'     // Scheduled for drop-off / mobile inspection
  | 'purchased'      // Deal completed, payment issued, unit in inventory
  | 'declined';      // Passed or customer declined

export interface PhotoItem {
  id: string;
  url: string;
  label?: string; // e.g. 'Front 3/4', 'Interior', 'Odometer', 'VIN Plate', 'Damage'
  uploadedAt: string;
}

export interface InternalNote {
  id: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  category: 'general' | 'comp' | 'inspection' | 'call_log' | 'offer_reason';
  content: string;
}

export interface AppraisalOffer {
  id: string;
  amount: number;
  estRetailValue?: number;
  tradeAllowanceMax?: number;
  deductions?: { reason: string; amount: number }[];
  contingencies?: string[];
  expirationDate: string;
  status: 'draft' | 'sent' | 'accepted' | 'countered' | 'rejected' | 'expired';
  createdAt: string;
  createdBy: string;
  notes?: string;
  customerPayoffEstimate?: number;
  calculatedNetEquity?: number; // amount - payoff
}

export interface SellInquiry {
  id: string;
  referenceId: string; // Human-friendly code e.g. "SR1-SELL-7821"
  createdAt: string;
  updatedAt: string;
  stage: InquiryStage;
  assignedStaffId?: string;
  assignedStaffName?: string;
  preferredLocation: DealershipLocation;
  
  // Customer Details
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    preferredContact: 'text' | 'phone' | 'email';
    city: string;
    state: string;
    zipCode: string;
  };

  // Unit Specifications
  unit: {
    category: VehicleCategory;
    subcategory: string;
    year: number;
    make: string;
    model: string;
    trimOrFloorplan?: string;
    vinOrSerial?: string;
    mileageOrHours: number;
    isHours: boolean; // true for tractors/heavy equipment/boats, false for RVs/trailers/powersports
    
    // Category specific details
    specs: {
      lengthFeet?: number;
      slidesCount?: number;
      bunkhouse?: boolean;
      generatorHours?: number;
      axlesCount?: number;
      gvwrLbs?: number;
      horsepower?: number;
      attachmentsIncluded?: string[]; // e.g. ['Loader', 'Backhoe', 'Mower Deck']
      cabType?: 'enclosed_cab_ac' | 'open_rops' | 'canopy';
      engineCc?: number;
      driveType?: '2wd' | '4wd' | 'awd' | 'tracks';
      fuelType?: 'gas' | 'diesel' | 'electric';
      containerSize?: '20ft' | '40ft' | '40ft_high_cube' | 'custom';
      boatHullType?: string;
    };

    // Condition
    condition: ConditionRating;
    conditionNotes?: string;
    tireOrTrackCondition?: 'like_new' | 'good' | 'worn' | 'needs_replacement';
    knownIssuesOrDamage?: string;
    maintenanceHistory?: string;
  };

  // Title & Valuation
  financials: {
    titleStatus: TitleStatus;
    lienHolderName?: string;
    estimatedPayoff?: number;
    askingPrice?: number;
    isNegotiable?: boolean;
  };

  // Uploaded media
  photos: PhotoItem[];

  // Staff appraisal data
  offers: AppraisalOffer[];
  notes: InternalNote[];
  auditLog: {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    details?: string;
  }[];
}
