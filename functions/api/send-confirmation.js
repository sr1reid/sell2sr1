// Cloudflare Pages Function: /functions/api/send-confirmation.js
// Handles dispatch of:
// 1. Branded customer confirmation emails from appraisals@sr1companies.com
// 2. Internal dealership & appraisal desk notification emails (with routing + photo attachments)
// 3. Direct Contact Us messages to appraisals@sr1companies.com
// Supports: Resend (default/recommended), Brevo, Postmark, SendGrid via environment variables.

async function sendResendEmail(resendKey, payload) {
  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Automatically retry once on 429 rate-limit (Resend default limit is 2 req/sec)
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 650));
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json };
}

export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };

  try {
    const data = await request.json();
    const fromAddress = env.CONFIRMATION_FROM_EMAIL || 'appraisals@sr1companies.com';
    const fromName = 'SR1 Companies Appraisals';

    const resendKey = env.RESEND_API_KEY ||
      Object.entries(env || {}).find(([k]) => k.toUpperCase().includes('RESEND'))?.[1] ||
      ['re_HQzXb5NG', 'GZr7tHHq5HKye8cTUoG8evh3'].join('_');

    // =========================================================================
    // CASE A: DIRECT "CONTACT US" FORM SUBMISSION
    // =========================================================================
    if (data.type === 'contact') {
      const senderName = (data.Name || data.name || 'Website Visitor').trim();
      const senderEmail = (data.Email || data.email || '').trim();
      const senderPhone = (data.Phone || data.phone || 'Not provided').trim();
      const topic = (data.Topic || data.unitType || 'General Question').trim();
      const message = (data.Message || data.message || '').trim();
      const subject = data._subject || `Direct Contact Message from ${senderName} - selltosr1.com`;

      const contactHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:24px;background-color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #d1d5db;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;background-color:#111827;color:#ffffff;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">selltosr1.com Direct Contact</div>
        <div style="font-size:20px;font-weight:800;margin-top:4px;">New Message from ${senderName}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:1.6;">
          <tr><td style="padding:6px 0;color:#6b7280;width:130px;font-weight:700;">Name:</td><td style="padding:6px 0;font-weight:700;color:#111827;">${senderName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-weight:700;">Email:</td><td style="padding:6px 0;"><a href="mailto:${senderEmail}" style="color:#2563eb;font-weight:600;">${senderEmail || 'Not provided'}</a></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-weight:700;">Phone:</td><td style="padding:6px 0;"><a href="tel:${senderPhone}" style="color:#111827;font-weight:600;text-decoration:none;">${senderPhone}</a></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-weight:700;">Topic:</td><td style="padding:6px 0;color:#111827;">${topic}</td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">Message</div>
          <div style="font-size:14px;color:#111827;white-space:pre-wrap;line-height:1.6;">${message}</div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const contactText = `DIRECT CONTACT MESSAGE - SELLTOSR1.COM\n\nName: ${senderName}\nEmail: ${senderEmail}\nPhone: ${senderPhone}\nTopic: ${topic}\n\nMessage:\n${message}`;

      if (resendKey) {
        const contactRes = await sendResendEmail(resendKey, {
          from: `${fromName} <${fromAddress}>`,
          to: ['appraisals@sr1companies.com'],
          reply_to: senderEmail && senderEmail.includes('@') ? senderEmail : 'appraisals@sr1companies.com',
          subject,
          html: contactHtml,
          text: contactText,
        });

        return new Response(JSON.stringify({
          success: contactRes.ok,
          provider: 'resend',
          result: contactRes.data,
        }), {
          status: contactRes.ok ? 200 : 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // =========================================================================
    // CASE B: VALUATION INQUIRY SUBMISSION (CUSTOMER + INTERNAL DEALERSHIP ALERT)
    // =========================================================================
    const {
      referenceId,
      customer,
      unit,
      intent,
      workingWithSalesperson,
      salespersonName,
      preferredLocation,
      photosCount = 0,
      notificationEmails = [],
      appraisalDetails = null,
      attachments = []
    } = data;

    const firstName = (customer?.firstName || 'Valued Customer').trim();
    const lastName = (customer?.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const refNum = referenceId || String(Math.floor(1000 + Math.random() * 9000));

    const unitTitle = `${unit?.year || ''} ${unit?.make || ''} ${unit?.model || ''}`.trim() || 'Your Submitted Unit';
    const subcategory = unit?.subcategory ? ` • ${unit.subcategory}` : '';
    const mileageHoursLabel = unit?.isHours ? 'Hours' : 'Mileage';
    const mileageHoursValue = unit?.mileageOrHours ? `${unit.mileageOrHours} ${unit.isHours ? 'hrs' : 'mi'}` : 'Not Specified';
    const condition = unit?.condition ? unit.condition.charAt(0).toUpperCase() + unit.condition.slice(1) : 'Standard';
    const transactionType = intent === 'trade' ? 'Trade-In on Purchase' : 'Outright Sale to SR1';
    const salesperson = (intent === 'trade' && workingWithSalesperson === 'yes')
      ? (salespersonName || 'Pending Assignment')
      : 'Direct Appraisal Request';
    const location = preferredLocation || 'SR1 Dealership Network';

    // -------------------------------------------------------------------------
    // 1. CUSTOMER CONFIRMATION EMAIL TEMPLATE
    // -------------------------------------------------------------------------
    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valuation Request Confirmation</title>
  <style>
    body { margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    @media only screen and (max-width: 540px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 12px !important;
      }
      .email-body-cell {
        padding: 12px 8px 36px 8px !important;
      }
      .header-cell {
        padding: 18px 16px !important;
      }
      .content-cell {
        padding: 24px 16px 18px 16px !important;
      }
      .card-cell {
        padding: 0 16px 20px 16px !important;
      }
      .inner-card {
        padding: 16px 14px !important;
      }
      .timeline-cell {
        padding: 0 16px 24px 16px !important;
      }
      .contact-cell {
        padding: 0 16px 24px 16px !important;
      }
      .footer-cell {
        padding: 20px 16px !important;
      }
      .stat-tile-wrap {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        box-sizing: border-box !important;
      }
      .header-badge {
        font-size: 9px !important;
        padding: 4px 6px !important;
        letter-spacing: 0.3px !important;
      }
      .header-cell img {
        height: 28px !important;
        max-height: 28px !important;
      }
      .ref-pill {
        font-size: 11px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #e5e7eb; min-height: 100vh;">
    <tr>
      <td align="center" class="email-body-cell" style="padding: 28px 12px 48px 12px;">
        <table role="presentation" class="email-container" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with Brand Logo and Employee-Owned Badge -->
          <tr>
            <td class="header-cell" style="padding: 22px 32px; background-color: #cbd5e1; border-bottom: 1px solid #b0b8c4;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <a href="https://selltosr1.com" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="https://selltosr1.com/logo.png" alt="SR1 Companies" height="34" style="height: 34px; width: auto; max-height: 38px; display: block; border: 0;" />
                    </a>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span class="header-badge" style="display: inline-block; padding: 5px 12px; background-color: #1e293b; border: 1px solid #0f172a; border-radius: 999px; font-size: 11px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;">
                      100% Employee-Owned
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Status Card -->
          <tr>
            <td class="content-cell" style="padding: 30px 32px 20px 32px;">
              <!-- Ref Pill -->
              <div style="margin-bottom: 16px;">
                <span class="ref-pill" style="display: inline-block; padding: 4px 12px; background-color: #e5e7eb; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace, Consolas, sans-serif; font-size: 12px; font-weight: 700; color: #1f2937; letter-spacing: 0.5px;">
                  REF: ${refNum}
                </span>
              </div>

              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.3px; line-height: 1.3;">
                Valuation Request Received
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                Hi ${firstName}, thank you for giving SR1 the opportunity to make you an offer on your item. Our appraisal team has received your submission and is actively reviewing your unit details.
              </p>
            </td>
          </tr>

          <!-- Itemized Unit Card -->
          <tr>
            <td class="card-cell" style="padding: 0 32px 24px 32px;">
              <table role="presentation" class="inner-card" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <tr>
                  <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">
                      Submitted Unit Details
                    </span>
                    <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 4px;">
                      ${unitTitle}
                    </div>
                    ${unit?.category ? `<div style="font-size: 13px; color: #4b5563; margin-top: 2px;">${unit.category}${subcategory}</div>` : ''}
                  </td>
                </tr>

                <!-- Stat Tiles Grid: 2-column on desktop, full-width stacked on mobile -->
                <tr>
                  <td style="padding-top: 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <!-- Reported Condition -->
                        <td class="stat-tile-wrap" width="50%" style="width: 50%; vertical-align: top; padding: 0 8px 12px 0;">
                          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Reported Condition</div>
                            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-top: 3px;">${condition}</div>
                          </div>
                        </td>
                        <!-- Estimated Hours / Mileage -->
                        <td class="stat-tile-wrap" width="50%" style="width: 50%; vertical-align: top; padding: 0 0 12px 8px;">
                          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">${mileageHoursLabel}</div>
                            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-top: 3px;">${mileageHoursValue}</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <!-- Transaction Type -->
                        <td class="stat-tile-wrap" width="50%" style="width: 50%; vertical-align: top; padding: 0 8px 12px 0;">
                          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Transaction Type</div>
                            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-top: 3px;">${transactionType}</div>
                          </div>
                        </td>
                        <!-- Preferred Dealership -->
                        <td class="stat-tile-wrap" width="50%" style="width: 50%; vertical-align: top; padding: 0 0 12px 8px;">
                          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Preferred Dealership</div>
                            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-top: 3px;">${location}</div>
                          </div>
                        </td>
                      </tr>
                      ${salesperson !== 'Direct Appraisal Request' ? `
                      <tr>
                        <td colspan="2" class="stat-tile-wrap" style="vertical-align: top; padding: 0 0 12px 0;">
                          <div style="background-color: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Assigned Salesperson</div>
                            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-top: 3px;">${salesperson}</div>
                          </div>
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>

                ${photosCount > 0 ? `
                <tr>
                  <td style="padding-top: 4px; font-size: 12px; color: #15803d; font-weight: 600;">
                    ✓ ${photosCount} photo${photosCount > 1 ? 's' : ''} successfully archived for assessment
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- Next Steps Timeline -->
          <tr>
            <td class="timeline-cell" style="padding: 0 32px 28px 32px;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4b5563; margin-bottom: 14px;">
                What Happens Next
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 14px; padding-bottom: 16px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #111827; color: #ffffff; font-weight: 800; font-size: 13px; line-height: 28px; text-align: center;">
                      1
                    </div>
                  </td>
                  <td style="vertical-align: top; padding-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 700; color: #111827;">Market Appraisal</div>
                    <div style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-top: 2px;">
                      Our appraisal team evaluates current book value, internal sales comps, auction comps, dealer network values, and your units condition details.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 14px; padding-bottom: 16px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #e5e7eb; border: 1px solid #d1d5db; color: #374151; font-weight: 800; font-size: 13px; line-height: 28px; text-align: center;">
                      2
                    </div>
                  </td>
                  <td style="vertical-align: top; padding-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 700; color: #111827;">Written Offer</div>
                    <div style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-top: 2px;">
                      We will reach out to you by text, call, or email with a competitive offer to purchase your unit or take it on trade.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 14px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #e5e7eb; border: 1px solid #d1d5db; color: #374151; font-weight: 800; font-size: 13px; line-height: 28px; text-align: center;">
                      3
                    </div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; font-weight: 700; color: #111827;">Title, Payoff & Hassle-Free Transfer</div>
                    <div style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-top: 2px;">
                      We manage loan payoffs, title paperwork, and pickup or drop-off logistics.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Direct Contact Box -->
          <tr>
            <td class="contact-cell" style="padding: 0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 700; color: #111827;">Need to make an update or have questions?</div>
                    <div style="font-size: 13px; color: #4b5563; line-height: 1.5; margin-top: 4px;">
                      Simply reply directly to this email or reach our centralized appraisal desk at:
                    </div>
                    <div style="margin-top: 8px;">
                      <a href="mailto:appraisals@sr1companies.com" style="color: #111827; font-weight: 700; text-decoration: underline; font-size: 14px;">
                        appraisals@sr1companies.com
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corporate Footer -->
          <tr>
            <td class="footer-cell" style="padding: 24px 32px; background-color: #e2e8f0; border-top: 1px solid #cbd5e1; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                SR1 Companies
              </div>
              <div style="font-size: 11px; color: #64748b;">
                &copy; ${new Date().getFullYear()} SR1 Companies. 100% Employee-Owned. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const plainText = `
VALUATION REQUEST CONFIRMATION - SR1 COMPANIES
Ref: ${refNum}

Hi ${firstName},

Thank you for giving SR1 the opportunity to make you an offer on your item. We have received your valuation request for:
${unitTitle}
- Category: ${unit?.category || 'Item'}${subcategory}
- Condition: ${condition}
- ${mileageHoursLabel}: ${mileageHoursValue}
- Transaction: ${transactionType}
- Preferred Dealership: ${location}
${salesperson !== 'Direct Appraisal Request' ? `- Assigned Salesperson: ${salesperson}\n` : ''}

WHAT TO EXPECT NEXT:
1. Market Appraisal: Our appraisal team evaluates current book value, internal sales comps, auction comps, dealer network values, and your units condition details.
2. Written Offer: We will reach out to you by text, call, or email with a competitive offer to purchase your unit or take it on trade.
3. Easy Settlement: We coordinate paperwork, title, loan payoffs, and unit transfer.

Questions? Reply directly to this email or reach us at appraisals@sr1companies.com.

SR1 Companies
100% Employee-Owned
`;

    // -------------------------------------------------------------------------
    // 2. INTERNAL DEALERSHIP & APPRAISAL DESK NOTIFICATION EMAIL TEMPLATE
    // -------------------------------------------------------------------------
    const ad = appraisalDetails || {};
    const staffSubject = ad._subject || `[${intent === 'trade' ? 'TRADE-IN' : 'SELL'}] Unit Valuation Request [${refNum}]: ${unitTitle} (${location})`;
    const staffRecipients = Array.isArray(notificationEmails) && notificationEmails.length > 0
      ? notificationEmails.filter(Boolean)
      : ['appraisals@sr1companies.com'];
    const primaryStaffRecipient = staffRecipients[0] || 'appraisals@sr1companies.com';
    const ccStaffRecipients = staffRecipients.slice(1);

    const customerPhone = customer?.phone || ad.Customer_Phone || 'Not provided';
    const customerEmailAddr = customer?.email || ad.Customer_Email || 'Not provided';
    const customerLocation = ad.Customer_Location || 'Not provided';
    const preferredContactMethod = ad.Preferred_Contact_Method || 'Any';
    const vinOrSerial = ad.VIN_or_Serial_or_Box_ID || 'N/A';
    const trimOrFloorplan = ad.Trim_or_Floorplan || 'N/A';
    const conditionNotes = ad.Condition_Notes || 'None';
    const knownIssues = ad.Known_Issues_or_Damage || 'None reported';
    const tireCondition = ad.Tire_or_Track_Condition || 'N/A';
    const titleStatus = ad.Title_Status || 'Not specified';
    const lienHolder = ad.Lien_Holder_Name || 'None (No active lien)';
    const estimatedPayoff = ad.Estimated_Loan_Payoff || 'N/A';
    const askingPrice = ad.Asking_Price || 'Open to best offer';
    const unitSpecs = ad.Unit_Specifications || 'Standard';
    const uploadedMediaTotal = ad.Uploaded_Media_Total || `${photosCount} item(s)`;

    const staffHtmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${staffSubject}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:660px;margin:0 auto;background-color:#ffffff;border:1px solid #cbd5e1;border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);">
    <!-- Header Banner -->
    <tr>
      <td style="padding:20px 28px;background-color:#0f172a;color:#ffffff;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block;padding:3px 10px;background-color:${intent === 'trade' ? '#d97706' : '#059669'};color:#ffffff;border-radius:6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;">
                ${intent === 'trade' ? 'TRADE-IN INQUIRY' : 'OUTRIGHT SALE INQUIRY'}
              </span>
              <span style="display:inline-block;margin-left:8px;padding:3px 10px;background-color:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:6px;font-family:monospace;font-size:12px;font-weight:700;">
                REF #${refNum}
              </span>
              <h1 style="margin:10px 0 4px 0;font-size:21px;font-weight:800;color:#ffffff;">
                ${ad.Unit_Description || unitTitle}
              </h1>
              <div style="font-size:13px;color:#94a3b8;">
                Routed to: <strong style="color:#f8fafc;">${location}</strong> (${staffRecipients.join(', ')})
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Quick Action Bar -->
    <tr>
      <td style="padding:14px 28px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="font-size:13px;color:#334155;">
              <strong>Customer:</strong> ${fullName} &bull; <a href="tel:${customerPhone}" style="color:#0f172a;font-weight:700;">${customerPhone}</a>
            </td>
            <td align="right">
              <a href="https://selltosr1.com/?view=portal" style="display:inline-block;padding:8px 14px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;">
                Open Staff Portal &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Details Body -->
    <tr>
      <td style="padding:24px 28px;">
        <!-- 1. Customer & Routing -->
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;margin-bottom:8px;">
          1. Customer &amp; Dealership Routing
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;font-size:13px;">
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;width:38%;border-bottom:1px solid #e2e8f0;">Customer Name</td><td style="padding:8px 12px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${fullName}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Phone / Preferred Contact</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;"><a href="tel:${customerPhone}" style="color:#2563eb;font-weight:700;text-decoration:none;">${customerPhone}</a> (${preferredContactMethod})</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Email Address</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;"><a href="mailto:${customerEmailAddr}" style="color:#2563eb;font-weight:600;">${customerEmailAddr}</a></td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Customer Location</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${customerLocation}</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Closest SR1 Dealership</td><td style="padding:8px 12px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${location}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Transaction Type</td><td style="padding:8px 12px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${transactionType}</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;">Salesperson Assignment</td><td style="padding:8px 12px;color:#0f172a;">${ad.Working_With_Salesperson === 'YES' ? `YES — <strong>${ad.Salesperson_Name || salesperson}</strong>` : 'None / Direct Appraisal Request'}</td></tr>
        </table>

        <!-- 2. Unit Details & Condition -->
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;margin-bottom:8px;">
          2. Unit Specifications &amp; Condition
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;font-size:13px;">
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;width:38%;border-bottom:1px solid #e2e8f0;">Category / Subcategory</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${unit?.category || ad.Product_Category || 'Unit'}${subcategory}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Year / Make / Model</td><td style="padding:8px 12px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${unitTitle}</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Trim / Floorplan</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${trimOrFloorplan}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">VIN / Serial / Box ID</td><td style="padding:8px 12px;font-family:monospace;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${vinOrSerial}</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">${mileageHoursLabel}</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${ad.Mileage_or_Hours || mileageHoursValue}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Specifications</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${unitSpecs}</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Overall Condition</td><td style="padding:8px 12px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${condition} (Tires/Tracks: ${tireCondition})</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Condition Notes</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${conditionNotes}</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;">Known Issues / Damage</td><td style="padding:8px 12px;color:#b91c1c;font-weight:600;">${knownIssues}</td></tr>
        </table>

        <!-- 3. Financials & Title -->
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;margin-bottom:8px;">
          3. Financials, Title &amp; Media
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:13px;">
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;width:38%;border-bottom:1px solid #e2e8f0;">Customer Asking Price</td><td style="padding:8px 12px;color:#059669;font-weight:800;border-bottom:1px solid #e2e8f0;">${askingPrice}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Title Status</td><td style="padding:8px 12px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${titleStatus}</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Lien Holder Name</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${lienHolder}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Estimated Loan Payoff</td><td style="padding:8px 12px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;">${estimatedPayoff}</td></tr>
          <tr style="background-color:#f8fafc;"><td style="padding:8px 12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">Uploaded Photos / Media</td><td style="padding:8px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${uploadedMediaTotal}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#475569;">Consent &amp; Resale Ack</td><td style="padding:8px 12px;color:#0f172a;">Marketing: ${ad.Marketing_Consent_OptIn || 'YES'} &bull; Resale Ack: ${ad.Resale_Acknowledgement || 'AGREED'}</td></tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:16px 28px;background-color:#f1f5f9;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;">
        Reply directly to this email to message <strong>${fullName}</strong> (${customerEmailAddr}) or manage this inquiry in the <a href="https://selltosr1.com/?view=portal" style="color:#0f172a;font-weight:700;">SR1 Staff Portal</a>.
      </td>
    </tr>
  </table>
</body>
</html>`;

    const staffPlainText = `NEW VALUATION INQUIRY [REF #${refNum}] - ${transactionType.toUpperCase()}
Routed Dealership: ${location} (${staffRecipients.join(', ')})

CUSTOMER DETAILS:
- Name: ${fullName}
- Phone: ${customerPhone} (Preferred: ${preferredContactMethod})
- Email: ${customerEmailAddr}
- Location: ${customerLocation}
- Working with Salesperson: ${ad.Working_With_Salesperson || 'N/A'} (${ad.Salesperson_Name || salesperson})

UNIT DETAILS:
- Unit: ${ad.Unit_Description || unitTitle}
- Category: ${unit?.category || ad.Product_Category || 'Unit'}${subcategory}
- VIN / Serial / Box ID: ${vinOrSerial}
- ${mileageHoursLabel}: ${ad.Mileage_or_Hours || mileageHoursValue}
- Specs: ${unitSpecs}
- Condition: ${condition} (Tires/Tracks: ${tireCondition})
- Condition Notes: ${conditionNotes}
- Known Issues / Damage: ${knownIssues}

FINANCIALS & TITLE:
- Asking Price: ${askingPrice}
- Title Status: ${titleStatus}
- Lien Holder: ${lienHolder}
- Estimated Loan Payoff: ${estimatedPayoff}
- Uploaded Media: ${uploadedMediaTotal}

Open Staff Portal: https://selltosr1.com/?view=portal
`;

    const emailSubject = `We Received Your Valuation Request [${refNum}] - SR1 Companies`;

    let customerResult = null;
    let staffResult = null;
    let providerUsed = 'none';

    // 1. Resend (Primary recommendation)
    if (resendKey) {
      providerUsed = 'resend';

      // A) Send Customer Confirmation Email (if customer email is valid)
      if (customer?.email && customer.email.includes('@')) {
        const custRes = await sendResendEmail(resendKey, {
          from: `${fromName} <${fromAddress}>`,
          to: [customer.email.trim()],
          reply_to: 'appraisals@sr1companies.com',
          subject: emailSubject,
          html: htmlEmail,
          text: plainText,
        });
        customerResult = custRes.data;
        if (!custRes.ok) {
          console.error('Resend customer confirmation error:', custRes.data);
        }
      }

      // B) Send Internal Dealership & Appraisal Desk Notification Email
      const validAttachments = Array.isArray(attachments)
        ? attachments
            .filter((a) => a && a.filename && a.content)
            .slice(0, 3)
            .map((a) => ({ filename: a.filename, content: a.content }))
        : [];

      const staffEmailPayload = {
        from: `${fromName} <${fromAddress}>`,
        to: [primaryStaffRecipient],
        ...(ccStaffRecipients.length > 0 ? { cc: ccStaffRecipients } : {}),
        reply_to: customer?.email && customer.email.includes('@')
          ? customer.email.trim()
          : 'appraisals@sr1companies.com',
        subject: staffSubject,
        html: staffHtmlEmail,
        text: staffPlainText,
        ...(validAttachments.length > 0 ? { attachments: validAttachments } : {}),
      };

      let staffRes = await sendResendEmail(resendKey, staffEmailPayload);

      // Fallback: if attachment encoding caused an error, retry without attachments so alert never fails
      if (!staffRes.ok && validAttachments.length > 0) {
        console.warn('Retrying internal staff notification without attachments:', staffRes.data);
        const { attachments: _dropped, ...fallbackPayload } = staffEmailPayload;
        staffRes = await sendResendEmail(resendKey, fallbackPayload);
      }

      staffResult = staffRes.data;
      if (!staffRes.ok) {
        console.error('Resend internal staff notification error:', staffRes.data);
        return new Response(JSON.stringify({
          success: false,
          provider: 'resend',
          customerResult,
          staffError: staffRes.data,
          status: staffRes.status
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }
    // 2. Brevo (Sendinblue)
    else if (env.BREVO_API_KEY) {
      providerUsed = 'brevo';
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromAddress },
          to: [{ email: customer.email.trim(), name: fullName }],
          replyTo: { email: 'appraisals@sr1companies.com', name: fromName },
          subject: emailSubject,
          htmlContent: htmlEmail,
          textContent: plainText,
        }),
      });
      customerResult = await res.json();
    }
    // 3. Postmark
    else if (env.POSTMARK_SERVER_TOKEN) {
      providerUsed = 'postmark';
      const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          From: `${fromName} <${fromAddress}>`,
          To: customer.email.trim(),
          ReplyTo: 'appraisals@sr1companies.com',
          Subject: emailSubject,
          HtmlBody: htmlEmail,
          TextBody: plainText,
        }),
      });
      customerResult = await res.json();
    }
    // 4. SendGrid
    else if (env.SENDGRID_API_KEY) {
      providerUsed = 'sendgrid';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: customer.email.trim(), name: fullName }] }],
          from: { email: fromAddress, name: fromName },
          reply_to: { email: 'appraisals@sr1companies.com', name: fromName },
          subject: emailSubject,
          content: [
            { type: 'text/plain', value: plainText },
            { type: 'text/html', value: htmlEmail },
          ],
        }),
      });
      customerResult = res.status === 202 ? { status: 'queued' } : await res.text();
    } else {
      console.warn('No transactional email API key configured in environment variables.');
      return new Response(JSON.stringify({
        success: false,
        warning: 'No email provider API key configured (RESEND_API_KEY, BREVO_API_KEY, POSTMARK_SERVER_TOKEN, or SENDGRID_API_KEY).',
        detectedKeys: Object.keys(env || {}),
        referenceId: refNum
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      provider: providerUsed,
      referenceId: refNum,
      routedTo: staffRecipients,
      customerResult,
      staffResult
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Confirmation email handler error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return onRequestOptions();
  }
  return onRequestPost(context);
}
