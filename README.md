# sell2sr1.com — SR1 Companies Vehicle & Equipment Acquisition Platform

**sell2sr1.com** is a purpose-built vehicle, RV, trailer, and equipment purchasing platform built for **SR1 Companies** (formerly Scott's Recreation).

It provides:
1. **Public Intake & Customer Valuation Portal**: Mobile-first intake wizard for sellers to submit unit details (RVs, trailers, tractors, heavy equipment, powersports), photo uploads, and loan/title details, receiving an instant tracking ID.
2. **Staff Appraisal & Purchasing Desk (`/portal`)**: Collaborative backend pipeline for SR1 staff across Manchester, Turner, Hermon, Houlton, Caribou ME, and Loudon NH to review specs, inspect photos, evaluate market comps, calculate customer net equity (`Offer - Payoff`), record formal offers, and log timestamped internal notes.
3. **Public Inquiry Tracker (`/track`)**: Allows customers to look up their inquiry status and accept offers online.

---

## Instant Local Preview

You can test and use the application immediately in two ways:

### Option 1: Live WEBrick HTTP Server
The application is currently served locally via Ruby WEBrick on port `3000`:
- Open **`http://localhost:3000`** in your browser.

### Option 2: Direct File Open
You can open `public/index.html` directly in Chrome, Safari, or any browser:
```
file:///Users/reidlanpher/.gemini/antigravity/scratch/sell2sr1/public/index.html
```
No installation or build steps required.

---

## Deploying to Cloudflare Pages (`sell2sr1.com`)

Since you own `sell2sr1.com` in Cloudflare, deploying takes only a few minutes:

### 1. Initialize Git & Push to GitHub
```bash
cd /Users/reidlanpher/.gemini/antigravity/scratch/sell2sr1
git init
git add .
git commit -m "Initial commit for sell2sr1.com"
# Push to your private GitHub repo
git remote add origin https://github.com/<your-account>/sell2sr1.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select the `sell2sr1` repository.
4. Set Build Settings:
   - **Framework preset**: `Next.js` (or `None / Static` for the standalone `public/` directory).
   - **Build command**: `npm run build` (or `npx @cloudflare/next-on-pages`).
   - **Build output directory**: `.vercel/output/static` (or `public` for static).
5. Click **Save and Deploy**.

### 3. Bind Your Custom Domain `sell2sr1.com`
1. Once deployed, go to the project's **Custom domains** tab in Cloudflare Pages.
2. Click **Set up a custom domain** and enter `sell2sr1.com` (and `www.sell2sr1.com`).
3. Since your domain is already in Cloudflare DNS, Cloudflare will automatically provision SSL certificates and route traffic with zero DNS propagation delay!

---

## Project Structure

```
sell2sr1/
├── app/
│   ├── layout.tsx             # Root layout & SEO metadata
│   ├── page.tsx               # Public homepage with category selectors
│   ├── globals.css            # Tailwind directives & hero styling
│   ├── sell/                  # Sell intake wizard
│   ├── track/                 # Customer reference tracker
│   └── portal/                # Staff appraisal desk & pipeline
├── components/
│   ├── ui/                    # Badges, buttons, modals, cards
│   ├── intake/                # Category-smart form components
│   └── portal/                # Pipeline cards, photo viewer, offer builder
├── lib/
│   ├── types.ts               # Core TypeScript data models
│   ├── constants.ts           # Categories, locations, stages, condition options
│   └── mock-data.ts           # Realistic seed inquiries with ME/NH data
├── public/
│   └── index.html             # Zero-dependency interactive web application
├── package.json               # Dependencies (Next.js 15, React 19, Tailwind)
├── wrangler.toml              # Cloudflare Pages / Workers configuration
└── DEPLOYMENT.md              # Detailed Cloudflare setup & DNS guide
```

---

## SR1 Dealership Locations Supported
- **Manchester, ME** (Main Campus): 746 Western Ave — (207) 622-0672
- **Turner, ME**: 2239 Auburn Rd — (207) 225-3977
- **Hermon / Bangor, ME**: 1894 Hammond St — (207) 848-7032
- **Houlton, ME**: 282 North St — (207) 532-4383
- **Caribou, ME**: 1001 Presque Isle Rd — (207) 498-8547
- **Loudon, NH**: 608 NH-106 — (603) 783-0000
- **On-Site Pickup**: Dedicated logistics fleet across ME, NH, VT, and MA.
