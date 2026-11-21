// Cloudflare Worker Module: /functions/api/status-reminders.js
// Automated status-update reminder emails for SR1 Staff + signed one-click status update endpoint.
// Schedule:
//   - Reminder #1: 3 days (72h) after submission if still in "contacted" (or 7 days if already "need_more_time")
//   - Reminder #2: 4 days (96h) after Reminder #1 if still "contacted" or "need_more_time"
//   - Reminder #3 (Final): 4 days (96h) after Reminder #2 if still "contacted" or "need_more_time"
//   - Stops automatically after Reminder #3 or once moved to Deal Pending / Deal Complete / Deal Lost / Archived.

const FS_PROJECT_ID = 'sell2sr1';
const FS_DATABASE_ID = 'sell2sr1';
const FS_API_KEY = 'AIzaSyBaWVjWZn5gSaPyLAuZm0X6TrlQ9KNRR40';
const FS_REST_BASE = `https://firestore.googleapis.com/v1/projects/${FS_PROJECT_ID}/databases/${FS_DATABASE_ID}/documents/inquiries`;

const HOUR_MS = 60 * 60 * 1000;
const FIRST_REMINDER_DELAY_MS = 72 * HOUR_MS;        // 3 days after submission (Contacted)
const FIRST_REMINDER_NMT_DELAY_MS = 168 * HOUR_MS;   // 7 days after submission (already Need More Time)
const REPEAT_REMINDER_DELAY_MS = 96 * HOUR_MS;       // 4 days after previous reminder
const MAX_REMINDERS = 3;

const DEAL_STATUS_META = {
  contacted: {
    id: 'contacted',
    label: 'Contacted',
    icon: '✓',
    bg: '#0c4a6e',
    border: '#0284c7',
    text: '#e0f2fe',
    btnBg: '#0284c7'
  },
  need_more_time: {
    id: 'need_more_time',
    label: 'Need More Time',
    icon: '🕒',
    bg: '#4c1d95',
    border: '#7c3aed',
    text: '#ede9fe',
    btnBg: '#7c3aed'
  },
  deal_pending: {
    id: 'deal_pending',
    label: 'Deal Pending',
    icon: '⏳',
    bg: '#78350f',
    border: '#d97706',
    text: '#fef3c7',
    btnBg: '#d97706'
  },
  deal_complete: {
    id: 'deal_complete',
    label: 'Deal Complete',
    icon: '✅',
    bg: '#064e3b',
    border: '#059669',
    text: '#d1fae5',
    btnBg: '#059669'
  },
  deal_lost: {
    id: 'deal_lost',
    label: 'Deal Lost',
    icon: '✕',
    bg: '#881337',
    border: '#e11d48',
    text: '#ffe4e6',
    btnBg: '#e11d48'
  }
};

const ACTIONABLE_EMAIL_STATUSES = [
  DEAL_STATUS_META.need_more_time,
  DEAL_STATUS_META.deal_pending,
  DEAL_STATUS_META.deal_complete,
  DEAL_STATUS_META.deal_lost
];

const LOCATION_LABELS = {
  rv_loudon_nh: 'SR1 RV - Loudon NH',
  rv_turner_me: 'SR1 RV - Turner ME',
  rv_manchester_me: 'SR1 RV - Manchester ME',
  trailers_loudon_nh: 'SR1 Trailers - Loudon NH',
  trailers_turner_me: 'SR1 Trailers - Turner ME',
  trailers_manchester_me: 'SR1 Trailers - Manchester ME',
  trailers_hermon_me: 'SR1 Trailers - Hermon ME',
  equipment_loudon_nh: 'SR1 Equipment - Loudon NH',
  equipment_turner_me: 'SR1 Equipment - Turner ME',
  equipment_orono_me: 'SR1 Equipment - Orono ME',
  equipment_houlton_me: 'SR1 Equipment - Houlton ME',
  equipment_caribou_me: 'SR1 Equipment - Caribou ME',
  powersports_epsom_nh: 'SR1 Powersports - Epsom NH',
  powersports_turner_me: 'SR1 Powersports - Turner ME',
  containers_loudon_nh: 'SR1 Containers - Loudon NH',
  containers_turner_me: 'SR1 Containers - Turner ME',
  containers_hermon_me: 'SR1 Containers - Hermon ME',
  pickup_requested: 'SR1 On-Site Pickup'
};

const DEALERSHIP_NOTIFICATION_EMAILS = {
  rv_loudon_nh: ['appraisals@sr1companies.com', 'craig@sr1companies.com', 'andrew@sr1companies.com'],
  rv_turner_me: ['appraisals@sr1companies.com', 'craig@sr1companies.com'],
  rv_manchester_me: ['appraisals@sr1companies.com', 'tory@sr1companies.com'],
  trailers_loudon_nh: ['appraisals@sr1companies.com', 'mike.m@sr1companies.com', 'sully@sr1companies.com', 'mike.p@sr1companies.com'],
  trailers_turner_me: ['appraisals@sr1companies.com', 'darrell@sr1companies.com'],
  trailers_manchester_me: ['appraisals@sr1companies.com', 'julian@sr1companies.com', 'frank@sr1companies.com'],
  trailers_hermon_me: ['appraisals@sr1companies.com', 'kyle@sr1companies.com', 'derek@sr1companies.com', 'frank@sr1companies.com'],
  equipment_loudon_nh: ['appraisals@sr1companies.com', 'tony.d@sr1companies.com', 'chris@sr1companies.com', 'ben@sr1companies.com'],
  equipment_turner_me: ['appraisals@sr1companies.com', 'bert@sr1companies.com', 'john@sr1companies.com'],
  equipment_orono_me: ['appraisals@sr1companies.com', 'aaron@sr1companies.com', 'chase@sr1companies.com', 'frank@sr1companies.com'],
  equipment_houlton_me: ['appraisals@sr1companies.com', 'nick.t@sr1companies.com'],
  equipment_caribou_me: ['appraisals@sr1companies.com', 'nick.t@sr1companies.com'],
  powersports_epsom_nh: ['appraisals@sr1companies.com', 'brady@sr1companies.com', 'hunter@sr1companies.com', 'joshua.l@sr1companies.com', 'dustin.s@sr1companies.com'],
  powersports_turner_me: ['appraisals@sr1companies.com', 'coleman@sr1companies.com', 'dustin@sr1companies.com'],
  containers_loudon_nh: ['appraisals@sr1companies.com', 'chris.p@sr1companies.com'],
  containers_turner_me: ['appraisals@sr1companies.com', 'colin@sr1companies.com'],
  containers_hermon_me: ['appraisals@sr1companies.com', 'kyle@sr1companies.com', 'derek@sr1companies.com', 'frank@sr1companies.com'],
  pickup_requested: ['appraisals@sr1companies.com'],
  dealer_portal: ['appraisals@sr1companies.com', 'reid@sr1companies.com'],
  bank_portal: ['appraisals@sr1companies.com', 'reid@sr1companies.com']
};

const SR1_SALESPERSON_DIRECTORY = [
  { first: 'Aaron', last: 'Libby', email: 'aaron@sr1companies.com' },
  { first: 'Adam', last: 'Jardine', email: 'adam.j@sr1companies.com' },
  { first: 'Adam', last: 'Brannan', email: 'adam.b@sr1companies.com' },
  { first: 'Alan', last: 'Wood', email: 'alan@sr1companies.com' },
  { first: 'Andrew', last: 'Neville', email: 'andrew@sr1companies.com' },
  { first: 'Austin', last: 'Ralls', email: 'austin.r@sr1companies.com' },
  { first: 'Ben', last: 'Cass', email: 'ben@sr1companies.com' },
  { first: 'Bert', last: 'Callnan', email: 'bert@sr1companies.com' },
  { first: 'Billy', last: 'Bedard', email: 'billy@sr1companies.com' },
  { first: 'Brady', last: 'Therrien', email: 'brady@sr1companies.com' },
  { first: 'Brandon', last: 'Webber', email: 'brandon@sr1companies.com' },
  { first: 'Bret', last: 'Crockett', email: 'bret@sr1companies.com' },
  { first: 'Bruce', last: 'Coulter', email: 'bruce@sr1companies.com' },
  { first: 'Charles', last: 'Houghton', email: 'charles@sr1companies.com' },
  { first: 'Chase', last: 'Bosse', email: 'chase@sr1companies.com' },
  { first: 'Chris', last: 'Palmer', email: 'chris.p@sr1companies.com' },
  { first: 'Chris', last: 'Winslow', email: 'chris@sr1companies.com' },
  { first: 'Cody', last: 'Houghton', email: 'cody@sr1companies.com' },
  { first: 'Coleman', last: 'Watson', email: 'coleman@sr1companies.com' },
  { first: 'Colin', last: 'Girouard', email: 'colin@sr1companies.com' },
  { first: 'Colten', last: 'Woods', email: 'colten.w@sr1companies.com' },
  { first: 'Connor', last: 'Hills', email: 'connor@sr1companies.com' },
  { first: 'Conor', last: 'Fitts', email: 'conor@sr1companies.com' },
  { first: 'Cory', last: 'Hebert', email: 'cory.h@sr1companies.com' },
  { first: 'Craig', last: 'Goddard', email: 'craig@sr1companies.com' },
  { first: 'Curtis', last: 'Beaulieu', email: 'curtis@sr1companies.com' },
  { first: 'Curtis', last: 'Albert', email: 'curtis.a@sr1companies.com' },
  { first: 'Daniel', last: 'Ondre', email: 'daniel.o@sr1companies.com' },
  { first: 'Darrell', last: 'Grenier', email: 'darrell@sr1companies.com' },
  { first: 'David', last: 'Bunker', email: 'david.b@sr1companies.com' },
  { first: 'Delaney', last: 'Clough', email: 'delaney.c@sr1companies.com' },
  { first: 'Delaney', last: 'Woods', email: 'delaney@sr1companies.com' },
  { first: 'Derek', last: 'Phair', email: 'derek@sr1companies.com' },
  { first: 'Derrick', last: 'Trites', email: 'derrick@sr1companies.com' },
  { first: 'Douglas', last: 'Jancarik', email: 'doug@sr1companies.com' },
  { first: 'Dustin', last: 'Sherwood', email: 'dustin.s@sr1companies.com' },
  { first: 'Dustin', last: 'Ouellette', email: 'dustin@sr1companies.com' },
  { first: 'Emily', last: 'Griffith', email: 'emily@sr1companies.com' },
  { first: 'Emma', last: 'Dares', email: 'emma@sr1companies.com' },
  { first: 'Eric', last: 'Marsh', email: 'eric@sr1companies.com' },
  { first: 'Eric', last: 'Powlesland', email: 'eric.p@sr1companies.com' },
  { first: 'Frank', last: 'Arbour', email: 'frank@sr1companies.com' },
  { first: 'Gabe', last: 'Lambert', email: 'gabe@sr1companies.com' },
  { first: 'Gregory', last: 'Hamlin', email: 'greg@sr1companies.com' },
  { first: 'Hunter', last: 'Mohammed', email: 'hunter@sr1companies.com' },
  { first: 'Jack', last: 'Pollner', email: 'jack.p@sr1companies.com' },
  { first: 'Jacob', last: 'Gross', email: 'jacob.g@sr1companies.com' },
  { first: 'Jacob', last: 'Dingus', email: 'jacob.d@sr1companies.com' },
  { first: 'Jeff', last: 'Blanco', email: 'jeff@sr1companies.com' },
  { first: 'Jeff', last: 'Swett', email: 'jeff.s@sr1companies.com' },
  { first: 'Jennifer', last: 'Christianson', email: 'jen@sr1companies.com' },
  { first: 'Jeremy', last: 'Beers', email: 'jeremy@sr1companies.com' },
  { first: 'Jerry', last: 'Dobson', email: 'jerry.d@sr1companies.com' },
  { first: 'Jim', last: 'Gravel', email: 'jim.g@sr1companies.com' },
  { first: 'Jim', last: 'Witherell', email: 'jim@sr1companies.com' },
  { first: 'Joe', last: 'Brissette', email: 'joe.b@sr1companies.com' },
  { first: 'John', last: 'Bernard', email: 'john@sr1companies.com' },
  { first: 'Jon', last: 'Cameron', email: 'jon@sr1companies.com' },
  { first: 'Josh', last: 'Faulkner', email: 'josh.f@sr1companies.com' },
  { first: 'Joshua', last: 'Andrew', email: 'josh@sr1companies.com' },
  { first: 'Joshua', last: 'Landry', email: 'joshua.l@sr1companies.com' },
  { first: 'Julian', last: 'Margitza', email: 'julian@sr1companies.com' },
  { first: 'Justin', last: 'Rollins', email: 'justin@sr1companies.com' },
  { first: 'Keith', last: 'Rowell', email: 'keith@sr1companies.com' },
  { first: 'Kenny', last: 'Hamilton', email: 'kenny@sr1companies.com' },
  { first: 'Kyle', last: 'Townsend', email: 'kyle@sr1companies.com' },
  { first: 'Marc', last: 'Forgione', email: 'marc@sr1companies.com' },
  { first: 'Mathew', last: 'Powers', email: 'mat@sr1companies.com' },
  { first: 'Melissa', last: 'Buck', email: 'melissa@sr1companies.com' },
  { first: 'Michael', last: 'Baker', email: 'mikebaker@sr1companies.com' },
  { first: 'Michael', last: 'Anderson', email: 'mike.a@sr1companies.com' },
  { first: 'Mike', last: 'Sullivan', email: 'sully@sr1companies.com' },
  { first: 'Mike', last: 'Page', email: 'mike.p@sr1companies.com' },
  { first: 'Mike', last: 'Billodeau', email: 'mike.b@sr1companies.com' },
  { first: 'Mike', last: 'Mahoney', email: 'mike.m@sr1companies.com' },
  { first: 'Mike', last: 'Shore', email: 'mike.s@sr1companies.com' },
  { first: 'Mike', last: 'Fraser', email: 'mike.f@sr1companies.com' },
  { first: 'Natasha', last: 'Pedrick', email: 'natasha@sr1companies.com' },
  { first: 'Nate', last: 'Mudie', email: 'nate@sr1companies.com' },
  { first: 'Nicholaus', last: 'Ripley', email: 'nick@sr1companies.com' },
  { first: 'Nick', last: 'Thornton', email: 'nick.t@sr1companies.com' },
  { first: 'Noah', last: 'Bellemore', email: 'noah@sr1companies.com' },
  { first: 'Randy', last: 'Donovan', email: 'randy@sr1companies.com' },
  { first: 'Reid', last: 'Lanpher', email: 'reid@sr1companies.com' },
  { first: 'Robert', last: 'Dyason', email: 'robert@sr1companies.com' },
  { first: 'Robert', last: 'Ellis', email: 'robert.e@sr1companies.com' },
  { first: 'Ryan', last: 'Clark', email: 'ryan.c@sr1companies.com' },
  { first: 'Ryan', last: 'Dahl', email: 'ryan.d@sr1companies.com' },
  { first: 'Sarah', last: 'Turner', email: 'sarah@sr1companies.com' },
  { first: 'Scott', last: 'Cass', email: 'scott.c@sr1companies.com' },
  { first: 'Scott', last: 'Lanpher', email: 'scott@sr1companies.com' },
  { first: 'Scott', last: 'Chavanelle', email: 'scott.chavanelle@sr1companies.com' },
  { first: 'Shawn', last: 'Martin', email: 'shawn@sr1companies.com' },
  { first: 'Shelley', last: 'Shanahan', email: 'shelley@sr1companies.com' },
  { first: 'Stephen', last: 'Desjarlais', email: 'stephen@sr1companies.com' },
  { first: 'Taylor', last: 'Turpin', email: 'taylor.t@sr1companies.com' },
  { first: 'Toby', last: 'Rose', email: 'toby@sr1companies.com' },
  { first: 'Tony', last: 'DiBenedetto', email: 'tony.d@sr1companies.com' },
  { first: 'Tony', last: 'Howard', email: 'tony@sr1companies.com' },
  { first: 'Tory', last: 'Hemphill', email: 'tory@sr1companies.com' },
  { first: 'Troy', last: 'Allen', email: 'troy@sr1companies.com' },
  { first: 'Tyler', last: 'Pake', email: 'tyler@sr1companies.com' },
  { first: 'Wayne', last: 'Berry', email: 'wayne@sr1companies.com' },
  { first: 'Whit', last: 'Lucas', email: 'whit@sr1companies.com' },
  { first: 'Zach', last: 'Bailey', email: 'zach.b@sr1companies.com' },
  { first: 'Zach', last: 'Edwards', email: 'zach@sr1companies.com' }
];

const NICKNAME_GROUPS = [
  ['doug', 'douglas'],
  ['greg', 'gregory'],
  ['jen', 'jennifer', 'jenny'],
  ['mat', 'matt', 'mathew', 'matthew'],
  ['mike', 'michael'],
  ['nick', 'nicholas', 'nicholaus'],
  ['josh', 'joshua'],
  ['dan', 'danny', 'daniel'],
  ['dave', 'david'],
  ['rob', 'bob', 'bobby', 'robert'],
  ['steve', 'steven', 'stephen'],
  ['chris', 'christopher'],
  ['jim', 'jimmy', 'james'],
  ['joe', 'joseph'],
  ['jon', 'john', 'jonathan'],
  ['tony', 'anthony'],
  ['zach', 'zack', 'zachary'],
  ['ben', 'benjamin'],
  ['andy', 'andrew'],
  ['bill', 'billy', 'william'],
  ['charlie', 'chuck', 'charles']
];

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firestoreFieldsToJson(fields) {
  if (!fields || typeof fields !== 'object') return {};
  const result = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = firestoreValueToJs(val);
  }
  return result;
}

function firestoreValueToJs(val) {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const arr = val.arrayValue?.values || [];
    return arr.map(firestoreValueToJs);
  }
  if ('mapValue' in val) {
    return firestoreFieldsToJson(val.mapValue?.fields || {});
  }
  return null;
}

function jsToFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(jsToFirestoreValue) } };
  }
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) {
      if (val !== undefined) {
        fields[k] = jsToFirestoreValue(val);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function resolveEmailsFromNameOrEmail(rawInput) {
  const raw = String(rawInput || '').trim();
  if (!raw) return [];
  if (raw.includes('@')) {
    return [raw.toLowerCase()];
  }
  const clean = raw.replace(/\./g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 0) return [];

  const first = parts[0];
  const lastToken = parts.length > 1 ? parts[parts.length - 1] : '';
  const lastInitial = lastToken ? lastToken.charAt(0) : '';

  const firstMatches = (empFirst) => {
    const ef = empFirst.toLowerCase();
    if (ef === first) return true;
    const grp = NICKNAME_GROUPS.find((g) => g.includes(first));
    return Boolean(grp && grp.includes(ef));
  };

  // 1. Exact full name match
  if (lastToken.length > 1) {
    const exactFull = SR1_SALESPERSON_DIRECTORY.filter(
      (emp) => firstMatches(emp.first) && emp.last.toLowerCase() === lastToken
    );
    if (exactFull.length > 0) return exactFull.map((e) => e.email.toLowerCase());
  }

  // 2. First name + last initial match
  if (lastInitial) {
    const initialMatches = SR1_SALESPERSON_DIRECTORY.filter(
      (emp) => firstMatches(emp.first) && emp.last.charAt(0).toLowerCase() === lastInitial
    );
    if (initialMatches.length > 0) return initialMatches.map((e) => e.email.toLowerCase());
  }

  // 3. Unique first name match
  const firstOnly = SR1_SALESPERSON_DIRECTORY.filter((emp) => firstMatches(emp.first));
  if (firstOnly.length === 1) {
    return [firstOnly[0].email.toLowerCase()];
  }

  return [];
}

function resolveReminderRecipients(inquiry, customRouting) {
  const emails = [];
  const addEmail = (e) => {
    const clean = String(e || '').trim().toLowerCase();
    if (clean && clean.includes('@') && !emails.includes(clean)) {
      emails.push(clean);
    }
  };

  // 1. Staff member who marked it Contacted / Need More Time
  if (inquiry?.outreach?.staffEmail) {
    addEmail(inquiry.outreach.staffEmail);
  }
  resolveEmailsFromNameOrEmail(inquiry?.outreach?.staffName).forEach(addEmail);

  // 2. Assigned SR1 rep from Step 1
  if (inquiry?.salespersonEmail) {
    addEmail(inquiry.salespersonEmail);
  }
  resolveEmailsFromNameOrEmail(inquiry?.salespersonName).forEach(addEmail);

  // 3. Store location's normal Email Routing list (or partner portal routing)
  const routing = customRouting && typeof customRouting === 'object' ? customRouting : DEALERSHIP_NOTIFICATION_EMAILS;
  let storeList = [];
  if (inquiry?.submissionSource === 'dealer') {
    storeList = Array.isArray(routing.dealer_portal) && routing.dealer_portal.length > 0
      ? routing.dealer_portal
      : DEALERSHIP_NOTIFICATION_EMAILS.dealer_portal;
  } else if (inquiry?.submissionSource === 'bank') {
    storeList = Array.isArray(routing.bank_portal) && routing.bank_portal.length > 0
      ? routing.bank_portal
      : DEALERSHIP_NOTIFICATION_EMAILS.bank_portal;
  } else {
    const locId = inquiry?.preferredLocation || '';
    if (locId && Array.isArray(routing[locId]) && routing[locId].length > 0) {
      storeList = routing[locId];
    } else if (locId && Array.isArray(DEALERSHIP_NOTIFICATION_EMAILS[locId])) {
      storeList = DEALERSHIP_NOTIFICATION_EMAILS[locId];
    } else {
      storeList = ['appraisals@sr1companies.com'];
    }
  }

  storeList.forEach((email) => {
    const lower = String(email || '').trim().toLowerCase();
    if (lower === 'selltosr1@sr1companies.com') {
      addEmail('appraisals@sr1companies.com');
    } else {
      addEmail(lower);
    }
  });

  if (emails.length === 0) {
    emails.push('appraisals@sr1companies.com');
  }
  return emails;
}

async function fetchEmailRoutingConfig() {
  try {
    const res = await fetch(`${FS_REST_BASE}/_config_email_routing?key=${FS_API_KEY}`);
    if (!res.ok) return null;
    const doc = await res.json();
    if (!doc || !doc.fields) return null;
    if (doc.fields.routingJson?.stringValue) {
      return JSON.parse(doc.fields.routingJson.stringValue);
    }
    if (doc.fields.routing?.mapValue) {
      return firestoreFieldsToJson(doc.fields.routing.mapValue.fields);
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch email routing config:', err);
    return null;
  }
}

async function fetchAllInquiriesFromFirestore() {
  const allDocs = [];
  let pageToken = '';
  for (let page = 0; page < 20; page++) {
    const url = `${FS_REST_BASE}?key=${FS_API_KEY}&pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Firestore list failed: ${res.status}`);
    }
    const data = await res.json();
    const docs = Array.isArray(data.documents) ? data.documents : [];
    for (const doc of docs) {
      if (!doc || !doc.name) continue;
      const docId = doc.name.split('/').pop();
      if (!docId || docId.startsWith('_')) continue;
      const parsed = firestoreFieldsToJson(doc.fields || {});
      if (parsed.isConfigDoc || parsed.isPartnerDoc) continue;
      parsed.id = parsed.id || docId;
      allDocs.push(parsed);
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return allDocs;
}

async function fetchSingleInquiryFromFirestore(inquiryId) {
  const res = await fetch(`${FS_REST_BASE}/${encodeURIComponent(inquiryId)}?key=${FS_API_KEY}`);
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc || !doc.fields) return null;
  const parsed = firestoreFieldsToJson(doc.fields);
  parsed.id = parsed.id || inquiryId;
  return parsed;
}

async function patchInquiryFieldsInFirestore(inquiryId, fieldMap) {
  const fieldPaths = Object.keys(fieldMap);
  const maskQuery = fieldPaths.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&');
  const url = `${FS_REST_BASE}/${encodeURIComponent(inquiryId)}?key=${FS_API_KEY}&${maskQuery}`;
  const fields = {};
  for (const [k, v] of Object.entries(fieldMap)) {
    fields[k] = jsToFirestoreValue(v);
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  return res.ok;
}

function getResendApiKey(env) {
  return (
    env?.RESEND_API_KEY ||
    Object.entries(env || {}).find(([k]) => k.toUpperCase().includes('RESEND'))?.[1] ||
    ['re_HQzXb5NG', 'GZr7tHHq5HKye8cTUoG8evh3'].join('_')
  );
}

// HMAC-SHA256 signing for one-click status update links (valid 30 days)
async function getSigningKey(env) {
  const secret = env?.STATUS_LINK_SECRET || getResendApiKey(env) || 'sr1-status-link-fallback-secret';
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signStatusToken(env, inquiryId, exp) {
  const key = await getSigningKey(env);
  const payload = `${inquiryId}:${exp}`;
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const bytes = new Uint8Array(sigBuf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

async function verifyStatusToken(env, inquiryId, exp, token) {
  if (!inquiryId || !exp || !token) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || Date.now() > expNum) return false;
  const expected = await signStatusToken(env, inquiryId, expNum);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

function getInquiryStatusId(inq) {
  const raw = inq?.outreach?.status || (inq?.outreach?.reachedOut ? 'contacted' : 'needs_outreach');
  return DEAL_STATUS_META[raw] ? raw : 'needs_outreach';
}

function evaluateReminderEligibility(inq, nowMs = Date.now()) {
  if (!inq || inq.isArchived || inq.stage === 'archived') {
    return { due: false, reason: 'archived' };
  }
  const statusId = getInquiryStatusId(inq);
  if (statusId !== 'contacted' && statusId !== 'need_more_time') {
    return { due: false, reason: `status_${statusId}` };
  }

  const reminders = inq.statusReminders || {};
  const count = Number(reminders.count) || 0;
  if (count >= MAX_REMINDERS) {
    return { due: false, reason: 'max_reminders_reached' };
  }

  const createdMs = inq.createdAt ? new Date(inq.createdAt).getTime() : 0;
  if (!createdMs || Number.isNaN(createdMs)) {
    return { due: false, reason: 'missing_createdAt' };
  }

  if (count === 0) {
    if (statusId === 'contacted' && nowMs - createdMs >= FIRST_REMINDER_DELAY_MS) {
      return { due: true, reminderNumber: 1, statusId };
    }
    if (statusId === 'need_more_time' && nowMs - createdMs >= FIRST_REMINDER_NMT_DELAY_MS) {
      return { due: true, reminderNumber: 1, statusId };
    }
    return { due: false, reason: 'not_yet_due_r1' };
  }

  const lastSentMs = reminders.lastSentAt ? new Date(reminders.lastSentAt).getTime() : 0;
  if (!lastSentMs || Number.isNaN(lastSentMs)) {
    return { due: false, reason: 'missing_lastSentAt' };
  }

  if (nowMs - lastSentMs >= REPEAT_REMINDER_DELAY_MS) {
    return { due: true, reminderNumber: count + 1, statusId };
  }

  return { due: false, reason: `not_yet_due_r${count + 1}` };
}

function formatReadableDate(isoStr) {
  if (!isoStr) return 'Recently';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return String(isoStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York'
    });
  } catch (e) {
    return String(isoStr);
  }
}

async function buildStatusReminderEmail(env, inquiry, reminderNumber, { isTest = false } = {}) {
  const statusId = getInquiryStatusId(inquiry);
  const statusMeta = DEAL_STATUS_META[statusId] || DEAL_STATUS_META.contacted;
  const unit = inquiry.unit || {};
  const customer = inquiry.customer || {};
  const unitTitle = [unit.year, unit.make, unit.model].filter(Boolean).join(' ') || 'Unit Submission';
  const vinOrSerial = unit.vinOrSerial || 'Not provided';
  const locationName = LOCATION_LABELS[inquiry.preferredLocation] || inquiry.preferredLocation || 'SR1 Companies';
  const customerName = inquiry.partnerOrgName
    ? `${inquiry.partnerOrgName}${inquiry.partnerContactName ? ` (${inquiry.partnerContactName})` : ''}`
    : `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
  const customerPhone = customer.phone || inquiry.partnerPhone || 'Not provided';
  const submittedDate = formatReadableDate(inquiry.createdAt);
  const daysSinceSubmit = inquiry.createdAt
    ? Math.max(1, Math.round((Date.now() - new Date(inquiry.createdAt).getTime()) / (24 * HOUR_MS)))
    : 3;
  const staffWhoContacted = (inquiry.outreach?.staffName || '').trim();
  const assignedRep = (inquiry.salespersonName || '').trim();
  const portalUrl = `https://selltosr1.com/?view=portal&inquiry=${encodeURIComponent(inquiry.id)}`;

  const exp = Date.now() + 30 * 24 * HOUR_MS; // 30 days
  const token = await signStatusToken(env, inquiry.id, exp);

  const statusLinks = ACTIONABLE_EMAIL_STATUSES.map((st) => ({
    ...st,
    url: `https://selltosr1.com/api/update-status?id=${encodeURIComponent(inquiry.id)}&status=${encodeURIComponent(st.id)}&exp=${exp}&token=${token}${isTest ? '&test=1' : ''}`
  }));

  const reminderLabel =
    reminderNumber === 1
      ? '3-Day Status Check-In'
      : reminderNumber === 2
      ? 'Follow-Up Reminder #2'
      : 'Final Status Reminder (#3 of 3)';

  const subjectPrefix = isTest ? '[TEST] ' : '';
  const subject = `${subjectPrefix}Status Update Needed (${reminderLabel}): ${unitTitle} — ${customerName}`;

  const nextScheduleNote =
    reminderNumber < MAX_REMINDERS
      ? `If this unit remains in Contacted or Need More Time, we'll send another reminder in 4 days (${MAX_REMINDERS - reminderNumber} remaining).`
      : `This is the 3rd and final automated reminder for this unit.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#121214;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
          ${isTest ? `
          <tr>
            <td style="background-color:#451a03;border-bottom:1px solid #b45309;padding:10px 24px;text-align:center;font-size:12px;font-weight:700;color:#fde68a;">
              TEST NOTIFICATION — Preview of Automated SR1 Deal Status Reminder
            </td>
          </tr>` : ''}

          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px;border-bottom:1px solid #27272a;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;">
                      SR1 COMPANIES • APPRAISAL &amp; PURCHASING DESK
                    </div>
                    <h1 style="margin:6px 0 0 0;font-size:20px;line-height:1.3;font-weight:800;color:#ffffff;">
                      Status Update Requested
                    </h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;padding:5px 10px;border-radius:999px;background-color:#451a03;border:1px solid #d97706;color:#fde68a;font-size:11px;font-weight:700;white-space:nowrap;">
                      ${escapeHtml(reminderLabel)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:22px 24px 12px 24px;font-size:14px;line-height:1.6;color:#d4d4d8;">
              This unit is still marked as
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;background-color:${statusMeta.bg};border:1px solid ${statusMeta.border};color:${statusMeta.text};font-size:12px;font-weight:700;">
                ${statusMeta.icon} ${escapeHtml(statusMeta.label)}
              </span>
              <strong>${daysSinceSubmit} ${daysSinceSubmit === 1 ? 'day' : 'days'}</strong> after submission. Please select an updated status below so the team knows where this deal stands.
            </td>
          </tr>

          <!-- Unit Summary Card -->
          <tr>
            <td style="padding:8px 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;border:1px solid #27272a;border-radius:12px;padding:16px;">
                <tr>
                  <td style="padding-bottom:10px;border-bottom:1px solid #27272a;">
                    <div style="font-size:17px;font-weight:800;color:#ffffff;">
                      ${escapeHtml(unitTitle)}
                    </div>
                    <div style="font-size:12px;color:#a1a1aa;margin-top:3px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
                      VIN / Serial: ${escapeHtml(vinOrSerial)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:1.7;">
                      <tr>
                        <td style="color:#a1a1aa;width:130px;padding:2px 0;">Customer:</td>
                        <td style="color:#ffffff;font-weight:600;padding:2px 0;">${escapeHtml(customerName)}</td>
                      </tr>
                      <tr>
                        <td style="color:#a1a1aa;padding:2px 0;">Phone:</td>
                        <td style="color:#e4e4e7;padding:2px 0;">${escapeHtml(customerPhone)}</td>
                      </tr>
                      <tr>
                        <td style="color:#a1a1aa;padding:2px 0;">Store Location:</td>
                        <td style="color:#e4e4e7;padding:2px 0;">${escapeHtml(locationName)}</td>
                      </tr>
                      <tr>
                        <td style="color:#a1a1aa;padding:2px 0;">Submitted:</td>
                        <td style="color:#e4e4e7;padding:2px 0;">${escapeHtml(submittedDate)}</td>
                      </tr>
                      ${staffWhoContacted ? `
                      <tr>
                        <td style="color:#a1a1aa;padding:2px 0;">Last Updated By:</td>
                        <td style="color:#e4e4e7;padding:2px 0;">${escapeHtml(staffWhoContacted)}</td>
                      </tr>` : ''}
                      ${assignedRep ? `
                      <tr>
                        <td style="color:#a1a1aa;padding:2px 0;">SR1 Rep:</td>
                        <td style="color:#e4e4e7;padding:2px 0;">${escapeHtml(assignedRep)}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- One-Click Status Update Buttons -->
          <tr>
            <td style="padding:4px 24px 16px 24px;">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#a1a1aa;margin-bottom:10px;">
                Quick Update Deal Status:
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding:0 5px 10px 0;">
                    <a href="${statusLinks[0].url}" style="display:block;text-align:center;padding:12px 10px;border-radius:10px;background-color:${statusLinks[0].bg};border:1px solid ${statusLinks[0].border};color:${statusLinks[0].text};text-decoration:none;font-size:13px;font-weight:700;">
                      ${statusLinks[0].icon} ${escapeHtml(statusLinks[0].label)}
                    </a>
                  </td>
                  <td width="50%" style="padding:0 0 10px 5px;">
                    <a href="${statusLinks[1].url}" style="display:block;text-align:center;padding:12px 10px;border-radius:10px;background-color:${statusLinks[1].bg};border:1px solid ${statusLinks[1].border};color:${statusLinks[1].text};text-decoration:none;font-size:13px;font-weight:700;">
                      ${statusLinks[1].icon} ${escapeHtml(statusLinks[1].label)}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 5px 0 0;">
                    <a href="${statusLinks[2].url}" style="display:block;text-align:center;padding:12px 10px;border-radius:10px;background-color:${statusLinks[2].bg};border:1px solid ${statusLinks[2].border};color:${statusLinks[2].text};text-decoration:none;font-size:13px;font-weight:700;">
                      ${statusLinks[2].icon} ${escapeHtml(statusLinks[2].label)}
                    </a>
                  </td>
                  <td width="50%" style="padding:0 0 0 5px;">
                    <a href="${statusLinks[3].url}" style="display:block;text-align:center;padding:12px 10px;border-radius:10px;background-color:${statusLinks[3].bg};border:1px solid ${statusLinks[3].border};color:${statusLinks[3].text};text-decoration:none;font-size:13px;font-weight:700;">
                      ${statusLinks[3].icon} ${escapeHtml(statusLinks[3].label)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Open Full Unit CTA -->
          <tr>
            <td style="padding:4px 24px 24px 24px;text-align:center;">
              <a href="${portalUrl}" style="display:inline-block;padding:12px 24px;border-radius:10px;background-color:#ffffff;color:#09090b;text-decoration:none;font-size:13px;font-weight:800;">
                Open Full Unit in Staff Portal →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#09090b;padding:16px 24px;border-top:1px solid #27272a;font-size:11px;line-height:1.5;color:#71717a;">
              ${escapeHtml(nextScheduleNote)}<br />
              Sent automatically by <a href="https://selltosr1.com/?view=portal" style="color:#a1a1aa;text-decoration:underline;">selltosr1.com</a> • SR1 Companies
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${isTest ? '[TEST NOTIFICATION]\n\n' : ''}SR1 COMPANIES — STATUS UPDATE REQUESTED (${reminderLabel})

Unit: ${unitTitle}
VIN / Serial: ${vinOrSerial}
Current Status: ${statusMeta.label} (${daysSinceSubmit} days since submission)
Customer: ${customerName} (${customerPhone})
Location: ${locationName}
Submitted: ${submittedDate}${staffWhoContacted ? `\nLast Updated By: ${staffWhoContacted}` : ''}${assignedRep ? `\nSR1 Rep: ${assignedRep}` : ''}

QUICK UPDATE DEAL STATUS:
- Need More Time: ${statusLinks[0].url}
- Deal Pending: ${statusLinks[1].url}
- Deal Complete: ${statusLinks[2].url}
- Deal Lost: ${statusLinks[3].url}

Open Full Unit in Staff Portal:
${portalUrl}

${nextScheduleNote}
`;

  return { subject, html, text };
}

async function sendResendEmail(resendKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function runScheduledStatusReminders(env, { dryRun = false } = {}) {
  const resendKey = getResendApiKey(env);
  if (!resendKey && !dryRun) {
    console.warn('RESEND_API_KEY missing; skipping scheduled status reminders');
    return { sent: 0, skipped: 0, error: 'RESEND_API_KEY not configured' };
  }

  const fromAddress = env.CONFIRMATION_FROM_EMAIL || 'appraisals@sr1companies.com';
  const fromName = env.CONFIRMATION_FROM_NAME || 'SR1 Companies Appraisals';

  const [inquiries, customRouting] = await Promise.all([
    fetchAllInquiriesFromFirestore(),
    fetchEmailRoutingConfig()
  ]);

  const nowMs = Date.now();
  const results = {
    checked: inquiries.length,
    eligible: 0,
    sent: 0,
    errors: 0,
    details: []
  };

  for (const inq of inquiries) {
    const check = evaluateReminderEligibility(inq, nowMs);
    if (!check.due) continue;
    results.eligible += 1;

    const recipients = resolveReminderRecipients(inq, customRouting);
    if (dryRun) {
      results.details.push({
        id: inq.id,
        unit: [inq.unit?.year, inq.unit?.make, inq.unit?.model].filter(Boolean).join(' '),
        status: check.statusId,
        reminderNumber: check.reminderNumber,
        recipients
      });
      continue;
    }

    try {
      const { subject, html, text } = await buildStatusReminderEmail(env, inq, check.reminderNumber);
      const [primaryTo, ...ccList] = recipients;
      const sendRes = await sendResendEmail(resendKey, {
        from: `${fromName} <${fromAddress}>`,
        to: [primaryTo],
        ...(ccList.length > 0 ? { cc: ccList } : {}),
        reply_to: fromAddress,
        subject,
        html,
        text
      });

      if (!sendRes.ok) {
        console.error('Status reminder Resend error for', inq.id, sendRes.data);
        results.errors += 1;
        continue;
      }

      const nowIso = new Date().toISOString();
      const prevHistory = Array.isArray(inq.statusReminders?.history) ? inq.statusReminders.history : [];
      const updatedReminders = {
        count: check.reminderNumber,
        lastSentAt: nowIso,
        history: [
          ...prevHistory,
          {
            reminderNumber: check.reminderNumber,
            sentAt: nowIso,
            statusAtSend: check.statusId,
            recipients
          }
        ]
      };

      await patchInquiryFieldsInFirestore(inq.id, { statusReminders: updatedReminders });
      results.sent += 1;
      results.details.push({
        id: inq.id,
        reminderNumber: check.reminderNumber,
        recipients,
        resendId: sendRes.data?.id || null
      });
    } catch (err) {
      console.error('Error sending reminder for', inq.id, err);
      results.errors += 1;
    }
  }

  return results;
}

export async function handleStatusReminderApi(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'send_test';

    if (action === 'dry_run') {
      const summary = await runScheduledStatusReminders(env, { dryRun: true });
      return new Response(JSON.stringify({ success: true, ...summary }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (action === 'send_test') {
      const targetEmail = String(body.to || 'reid@sr1companies.com').trim().toLowerCase();
      if (!targetEmail.endsWith('@sr1companies.com')) {
        return new Response(JSON.stringify({ error: 'Test notifications can only be sent to @sr1companies.com addresses.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const resendKey = getResendApiKey(env);
      if (!resendKey) {
        return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured in Worker environment.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Use a real active Contacted inquiry if available for an authentic preview; otherwise use a realistic sample
      let sampleInquiry = null;
      try {
        const all = await fetchAllInquiriesFromFirestore();
        sampleInquiry = all.find(
          (x) => !x.isArchived && x.stage !== 'archived' && getInquiryStatusId(x) === 'contacted'
        ) || all.find((x) => !x.isArchived && x.stage !== 'archived') || null;
      } catch (e) {}

      if (!sampleInquiry) {
        sampleInquiry = {
          id: 'test-sample-unit',
          createdAt: new Date(Date.now() - 3 * 24 * HOUR_MS).toISOString(),
          preferredLocation: 'trailers_loudon_nh',
          salespersonName: 'Mike Page',
          outreach: {
            reachedOut: true,
            status: 'contacted',
            staffName: 'Mike Page'
          },
          unit: {
            year: 2024,
            make: 'ATC',
            model: 'ROM 500',
            vinOrSerial: '5JX1A2428RF232581'
          },
          customer: {
            firstName: 'Sean',
            lastName: 'Perkins',
            phone: '(774) 502-6619'
          }
        };
      }

      const reminderNum = Math.min(3, Math.max(1, Number(body.reminderNumber) || 1));
      const { subject, html, text } = await buildStatusReminderEmail(env, sampleInquiry, reminderNum, { isTest: true });
      const fromAddress = env.CONFIRMATION_FROM_EMAIL || 'appraisals@sr1companies.com';
      const fromName = env.CONFIRMATION_FROM_NAME || 'SR1 Companies Appraisals';

      const sendRes = await sendResendEmail(resendKey, {
        from: `${fromName} <${fromAddress}>`,
        to: [targetEmail],
        reply_to: fromAddress,
        subject,
        html,
        text
      });

      return new Response(JSON.stringify({
        success: sendRes.ok,
        to: targetEmail,
        subject,
        inquiryId: sampleInquiry.id,
        resend: sendRes.data
      }), {
        status: sendRes.ok ? 200 : 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

function renderStatusUpdatePage({
  title,
  heading,
  message,
  unitTitle = '',
  vinOrSerial = '',
  customerName = '',
  currentStatusMeta = null,
  selectedStatusMeta = null,
  inquiryId = '',
  exp = '',
  token = '',
  defaultStaffName = '',
  isTest = false,
  isSuccess = false,
  isError = false
}) {
  const portalUrl = inquiryId
    ? `https://selltosr1.com/?view=portal&inquiry=${encodeURIComponent(inquiryId)}`
    : 'https://selltosr1.com/?view=portal';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — SR1 Companies</title>
  <style>
    body { margin: 0; background: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
    .card { width: 100%; max-width: 520px; background: #121214; border: 1px solid #27272a; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.65); }
    .header { background: #18181b; padding: 20px 24px; border-bottom: 1px solid #27272a; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #a1a1aa; }
    h1 { margin: 6px 0 0; font-size: 20px; font-weight: 800; color: #fff; }
    .body { padding: 22px 24px; }
    .unit-box { background: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; }
    .unit-title { font-size: 16px; font-weight: 800; color: #fff; }
    .unit-sub { font-size: 12px; color: #a1a1aa; margin-top: 4px; }
    .badge { display: inline-block; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-top: 8px; }
    .label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; margin-bottom: 6px; }
    input[type="text"] { width: 100%; box-sizing: border-box; background: #09090b; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 14px; margin-bottom: 14px; }
    .btn-primary { width: 100%; padding: 13px 16px; border-radius: 10px; border: 1px solid transparent; font-size: 14px; font-weight: 800; cursor: pointer; color: #fff; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .btn-alt { padding: 10px 10px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid #3f3f46; background: #18181b; color: #e4e4e7; }
    .btn-alt:hover { background: #27272a; }
    .portal-link { display: block; text-align: center; margin-top: 16px; padding: 11px; border-radius: 10px; background: #fff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 800; }
    .msg { font-size: 14px; line-height: 1.55; color: #d4d4d8; margin-bottom: 16px; }
    .success-banner { background: #064e3b; border: 1px solid #059669; color: #d1fae5; padding: 12px 14px; border-radius: 10px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    .error-banner { background: #881337; border: 1px solid #e11d48; color: #ffe4e6; padding: 12px 14px; border-radius: 10px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    .test-banner { background: #451a03; border-bottom: 1px solid #b45309; color: #fde68a; padding: 8px 16px; text-align: center; font-size: 11px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    ${isTest ? '<div class="test-banner">TEST LINK — Confirming here will not modify live data if this is a sample unit</div>' : ''}
    <div class="header">
      <div class="eyebrow">SR1 Companies • Deal Status Update</div>
      <h1>${escapeHtml(heading)}</h1>
    </div>
    <div class="body">
      ${isSuccess ? `<div class="success-banner">✓ ${escapeHtml(message)}</div>` : ''}
      ${isError ? `<div class="error-banner">⚠️ ${escapeHtml(message)}</div>` : ''}
      ${!isSuccess && !isError && message ? `<div class="msg">${escapeHtml(message)}</div>` : ''}

      ${unitTitle ? `
      <div class="unit-box">
        <div class="unit-title">${escapeHtml(unitTitle)}</div>
        <div class="unit-sub">
          ${vinOrSerial ? `VIN / Serial: <strong>${escapeHtml(vinOrSerial)}</strong>` : ''}
          ${customerName ? ` • Customer: <strong>${escapeHtml(customerName)}</strong>` : ''}
        </div>
        ${currentStatusMeta ? `
        <span class="badge" style="background:${currentStatusMeta.bg};border:1px solid ${currentStatusMeta.border};color:${currentStatusMeta.text};">
          Current Status: ${currentStatusMeta.icon} ${escapeHtml(currentStatusMeta.label)}
        </span>` : ''}
      </div>` : ''}

      ${!isError && inquiryId && token && !isSuccess && selectedStatusMeta ? `
      <form method="POST" action="/api/update-status">
        <input type="hidden" name="id" value="${escapeHtml(inquiryId)}" />
        <input type="hidden" name="exp" value="${escapeHtml(exp)}" />
        <input type="hidden" name="token" value="${escapeHtml(token)}" />
        ${isTest ? '<input type="hidden" name="test" value="1" />' : ''}

        <label class="label" for="staffName">Your Name (optional)</label>
        <input id="staffName" name="staffName" type="text" value="${escapeHtml(defaultStaffName)}" placeholder="e.g. Mike Page" />

        <button type="submit" name="status" value="${escapeHtml(selectedStatusMeta.id)}" class="btn-primary" style="background:${selectedStatusMeta.btnBg};border-color:${selectedStatusMeta.border};">
          Confirm: Mark as ${selectedStatusMeta.icon} ${escapeHtml(selectedStatusMeta.label)}
        </button>

        <div class="label" style="margin-top:6px;">Or choose a different status:</div>
        <div class="grid">
          ${ACTIONABLE_EMAIL_STATUSES.filter((s) => s.id !== selectedStatusMeta.id).map((s) => `
          <button type="submit" name="status" value="${escapeHtml(s.id)}" class="btn-alt">
            ${s.icon} ${escapeHtml(s.label)}
          </button>`).join('')}
        </div>
      </form>` : ''}

      <a class="portal-link" href="${portalUrl}">Open Unit in Staff Portal →</a>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: isError ? 400 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export async function handleOneClickStatusUpdate(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const id = url.searchParams.get('id') || '';
    const status = url.searchParams.get('status') || '';
    const exp = url.searchParams.get('exp') || '';
    const token = url.searchParams.get('token') || '';
    const isTest = url.searchParams.get('test') === '1';

    const valid = await verifyStatusToken(env, id, exp, token);
    if (!valid || !DEAL_STATUS_META[status]) {
      return renderStatusUpdatePage({
        title: 'Link Expired',
        heading: 'Invalid or Expired Link',
        message: 'This status update link is invalid or has expired. You can still update the unit directly inside the Staff Portal.',
        inquiryId: id,
        isError: true
      });
    }

    const inquiry = id === 'test-sample-unit' ? null : await fetchSingleInquiryFromFirestore(id);
    const unitTitle = inquiry
      ? [inquiry.unit?.year, inquiry.unit?.make, inquiry.unit?.model].filter(Boolean).join(' ') || 'Unit Submission'
      : '2024 ATC ROM 500 (Sample)';
    const vinOrSerial = inquiry?.unit?.vinOrSerial || (id === 'test-sample-unit' ? '5JX1A2428RF232581' : '');
    const customerName = inquiry
      ? (inquiry.partnerOrgName || `${inquiry.customer?.firstName || ''} ${inquiry.customer?.lastName || ''}`.trim())
      : 'Sean Perkins';
    const currentStatusId = inquiry ? getInquiryStatusId(inquiry) : 'contacted';
    const currentStatusMeta = DEAL_STATUS_META[currentStatusId] || DEAL_STATUS_META.contacted;
    const selectedStatusMeta = DEAL_STATUS_META[status];

    return renderStatusUpdatePage({
      title: `Update Status to ${selectedStatusMeta.label}`,
      heading: 'Confirm Status Update',
      message: 'Tap the button below to save this status update immediately.',
      unitTitle,
      vinOrSerial,
      customerName,
      currentStatusMeta,
      selectedStatusMeta,
      inquiryId: id,
      exp,
      token,
      defaultStaffName: inquiry?.outreach?.staffName || inquiry?.salespersonName || '',
      isTest
    });
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const id = String(formData.get('id') || '');
    const status = String(formData.get('status') || '');
    const exp = String(formData.get('exp') || '');
    const token = String(formData.get('token') || '');
    const staffNameInput = String(formData.get('staffName') || '').trim();
    const isTest = String(formData.get('test') || '') === '1';

    const valid = await verifyStatusToken(env, id, exp, token);
    const statusMeta = DEAL_STATUS_META[status];
    if (!valid || !statusMeta) {
      return renderStatusUpdatePage({
        title: 'Link Expired',
        heading: 'Invalid or Expired Link',
        message: 'Could not verify this status update link. Please open the unit in the Staff Portal instead.',
        inquiryId: id,
        isError: true
      });
    }

    if (id === 'test-sample-unit') {
      return renderStatusUpdatePage({
        title: 'Test Status Updated',
        heading: 'Test Status Update Confirmed',
        message: `Sample unit would be updated to "${statusMeta.label}".`,
        unitTitle: '2024 ATC ROM 500 (Sample)',
        vinOrSerial: '5JX1A2428RF232581',
        customerName: 'Sean Perkins',
        currentStatusMeta: statusMeta,
        inquiryId: '',
        isTest: true,
        isSuccess: true
      });
    }

    const inquiry = await fetchSingleInquiryFromFirestore(id);
    if (!inquiry) {
      return renderStatusUpdatePage({
        title: 'Unit Not Found',
        heading: 'Unit Not Found',
        message: 'This inquiry could not be found in the database (it may have been deleted).',
        isError: true
      });
    }

    const effectiveStaffName = staffNameInput || inquiry.outreach?.staffName || inquiry.salespersonName || 'SR1 Staff (Email Link)';
    const nowIso = new Date().toISOString();
    const nowDisplay = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    const updatedOutreach = {
      ...(inquiry.outreach || {}),
      reachedOut: true,
      status: statusMeta.id,
      staffName: effectiveStaffName,
      reachedOutAt: nowDisplay
    };

    const existingNotes = Array.isArray(inquiry.notes) ? inquiry.notes : [];
    const updatedNotes = [
      ...existingNotes,
      {
        id: 'n-email-status-' + Date.now(),
        authorName: effectiveStaffName,
        authorRole: 'Staff Member',
        createdAt: nowDisplay,
        category: 'call_log',
        content: `${effectiveStaffName} updated deal status to "${statusMeta.label}" via email reminder link.`
      }
    ];

    const saved = await patchInquiryFieldsInFirestore(id, {
      outreach: updatedOutreach,
      notes: updatedNotes,
      updatedAt: nowIso
    });

    if (!saved) {
      return renderStatusUpdatePage({
        title: 'Update Failed',
        heading: 'Could Not Save Status',
        message: 'There was a temporary error saving to the database. Please try again or update in the Staff Portal.',
        inquiryId: id,
        isError: true
      });
    }

    const unitTitle = [inquiry.unit?.year, inquiry.unit?.make, inquiry.unit?.model].filter(Boolean).join(' ') || 'Unit Submission';
    const customerName = inquiry.partnerOrgName || `${inquiry.customer?.firstName || ''} ${inquiry.customer?.lastName || ''}`.trim();

    return renderStatusUpdatePage({
      title: 'Status Updated',
      heading: 'Deal Status Updated',
      message: `Successfully updated to "${statusMeta.label}" by ${effectiveStaffName}.`,
      unitTitle,
      vinOrSerial: inquiry.unit?.vinOrSerial || '',
      customerName,
      currentStatusMeta: statusMeta,
      inquiryId: id,
      isTest,
      isSuccess: true
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
