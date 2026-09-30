# Cloudflare Deployment & Setup Guide for sell2sr1.com

This guide provides step-by-step instructions for deploying **`sell2sr1.com`** using your existing Cloudflare account.

---

## 1. Hosting Architecture on Cloudflare

Because your domain `sell2sr1.com` is registered and managed within Cloudflare, you can host the website using **Cloudflare Pages** with:
- **Zero hosting costs** (Generous free tier with unlimited bandwidth).
- **Automated SSL/TLS** certificates managed by Cloudflare.
- **Global Edge Caching** for instant loading across Maine, New Hampshire, and New England.
- **DDoS protection & Web Application Firewall (WAF)** built-in.

---

## 2. Deploying via Git (Recommended)

1. Push this directory to your GitHub or GitLab account:
   ```bash
   cd /Users/reidlanpher/.gemini/antigravity/scratch/sell2sr1
   git init
   git add .
   git commit -m "Initial commit for sell2sr1.com"
   # Create a repository on github.com and push:
   git remote add origin https://github.com/<your-org>/sell2sr1.git
   git branch -M main
   git push -u origin main
   ```

2. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/):
   - In the left sidebar, click **Workers & Pages**.
   - Click **Create application** → **Pages** → **Connect to Git**.
   - Authorize GitHub/GitLab and select the `sell2sr1` repository.

3. Configure the Build Settings:
   - **Project Name**: `sell2sr1`
   - **Production branch**: `main`
   - **Framework preset**: `Next.js`
   - **Build command**: `npm run build`
   - **Build output directory**: `.vercel/output/static`

4. Click **Save and Deploy**. Cloudflare's build fleet will compile the project and issue a live preview URL (e.g., `sell2sr1.pages.dev`).

---

## 3. Direct Deploy via Wrangler (Alternative without Git)

If you prefer deploying immediately from your local terminal using the Cloudflare CLI:
```bash
npx wrangler pages deploy public --project-name=sell2sr1
```

---

## 4. Attaching the `sell2sr1.com` Domain in Cloudflare

1. In your Cloudflare Dashboard, navigate to your newly deployed Pages project (`sell2sr1`).
2. Click the **Custom domains** tab at the top.
3. Click **Set up a custom domain**.
4. Enter `sell2sr1.com` and click **Continue**.
5. Click **Activate domain**. Since `sell2sr1.com` is already inside your Cloudflare DNS, Cloudflare will automatically add the necessary CNAME record (`sell2sr1.com -> sell2sr1.pages.dev`) with orange-cloud proxy enabled.
6. Repeat for `www.sell2sr1.com` so both apex and `www` route seamlessly.

---

## 5. Setting up Cloudflare Email Routing for Appraisal Alerts

You can receive email notifications whenever a customer submits an inquiry:
1. In Cloudflare, select your `sell2sr1.com` domain.
2. Click **Email Routing** in the left sidebar.
3. Enable Email Routing.
4. Create a custom address such as:
   - `buyers@sell2sr1.com` → Forward to your personal or appraisal team inbox (e.g., `reid@sr1companies.com` or `appraisals@sr1companies.com`).
   - `inquiries@sell2sr1.com` → Forward to your store sales managers.

---

## 6. Optional: Cloudflare R2 for Photo Storage

For storing thousands of high-resolution vehicle and equipment photos with **zero egress fees**:
1. In Cloudflare Dashboard, go to **R2** → **Create bucket** → Name it `sell2sr1-photos`.
2. Generate an **R2 API Token** with Read/Write access.
3. Add the credentials to your environment variables in Cloudflare Pages Settings.
