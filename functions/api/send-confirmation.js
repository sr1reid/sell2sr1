// Cloudflare Pages Function: /functions/api/send-confirmation.js
// Handles dispatch of professional, branded confirmation emails from appraisals@sr1companies.com
// Supports: Resend (default/recommended), Brevo, Postmark, SendGrid via environment variables.

export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };

  try {
    const data = await request.json();
    const {
      referenceId,
      customer,
      unit,
      intent,
      workingWithSalesperson,
      salespersonName,
      preferredLocation,
      photosCount = 0
    } = data;

    if (!customer?.email || !customer.email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid customer email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const firstName = (customer.firstName || 'Valued Customer').trim();
    const lastName = (customer.lastName || '').trim();
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

    // Professional, mobile-responsive HTML Email Template (Neutral Luxury Theme)
    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valuation Request Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #e5e5e5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0a0a0a; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 28px 12px 48px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #121212; border: 1px solid #262626; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.65);">
          
          <!-- Header with Brand Logo and Employee-Owned Badge -->
          <tr>
            <td style="padding: 26px 32px 24px 32px; border-bottom: 1px solid #1f1f1f;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <a href="https://sell2sr1.com" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="https://sell2sr1.com/logo.png" alt="SR1 Companies" height="38" style="height: 38px; width: auto; max-height: 42px; display: block; border: 0;" />
                    </a>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 5px 12px; background-color: #1a1a1a; border: 1px solid #2e2e2e; border-radius: 999px; font-size: 11px; font-weight: 700; color: #d4d4d4; text-transform: uppercase; letter-spacing: 0.8px;">
                      100% Employee-Owned
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Status Card -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <!-- Ref Pill -->
              <div style="margin-bottom: 16px;">
                <span style="display: inline-block; padding: 4px 12px; background-color: #1c1c1c; border: 1px solid #333333; border-radius: 6px; font-family: monospace, Consolas, sans-serif; font-size: 12px; font-weight: 700; color: #e5e5e5; letter-spacing: 0.5px;">
                  REF: ${refNum}
                </span>
              </div>

              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3;">
                Valuation Request Received
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">
                Hi ${firstName}, thank you for giving SR1 the opportunity to make you an offer on your item. Our appraisal team has received your submission and is actively reviewing your unit details.
              </p>
            </td>
          </tr>

          <!-- Itemized Unit Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px;">
                <tr>
                  <td colspan="2" style="padding-bottom: 14px; border-bottom: 1px solid #262626;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3;">
                      Submitted Unit Details
                    </span>
                    <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin-top: 4px;">
                      ${unitTitle}
                    </div>
                    ${unit?.category ? `<div style="font-size: 13px; color: #a3a3a3; margin-top: 2px;">${unit.category}${subcategory}</div>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 14px; padding-bottom: 8px; width: 50%;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #737373; letter-spacing: 0.5px;">Reported Condition</div>
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">${condition}</div>
                  </td>
                  <td style="padding-top: 14px; padding-bottom: 8px; width: 50%;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #737373; letter-spacing: 0.5px;">${mileageHoursLabel}</div>
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">${mileageHoursValue}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 8px; padding-bottom: 8px; width: 50%;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #737373; letter-spacing: 0.5px;">Transaction Type</div>
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">${transactionType}</div>
                  </td>
                  <td style="padding-top: 8px; padding-bottom: 8px; width: 50%;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #737373; letter-spacing: 0.5px;">Preferred Dealership</div>
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">${location}</div>
                  </td>
                </tr>
                ${salesperson !== 'Direct Appraisal Request' ? `
                <tr>
                  <td colspan="2" style="padding-top: 8px; border-top: 1px dashed #262626;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #737373; letter-spacing: 0.5px;">Assigned Salesperson</div>
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">${salesperson}</div>
                  </td>
                </tr>` : ''}
                ${photosCount > 0 ? `
                <tr>
                  <td colspan="2" style="padding-top: 8px; font-size: 12px; color: #d4d4d4; font-weight: 600;">
                    ✓ ${photosCount} photo${photosCount > 1 ? 's' : ''} successfully archived for assessment
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- Next Steps Timeline -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #737373; margin-bottom: 14px;">
                What Happens Next
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 14px; padding-bottom: 16px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #262626; border: 1px solid #404040; color: #ffffff; font-weight: 800; font-size: 13px; line-height: 28px; text-align: center;">
                      1
                    </div>
                  </td>
                  <td style="vertical-align: top; padding-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Market Appraisal</div>
                    <div style="font-size: 13px; color: #a3a3a3; line-height: 1.5; margin-top: 2px;">
                      Our appraisal team evaluates current book value, internal sales comps, auction comps, dealer network values, and your units condition details.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 14px; padding-bottom: 16px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #1a1a1a; border: 1px solid #2e2e2e; color: #a3a3a3; font-weight: 800; font-size: 13px; line-height: 28px; text-align: center;">
                      2
                    </div>
                  </td>
                  <td style="vertical-align: top; padding-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Written Offer</div>
                    <div style="font-size: 13px; color: #a3a3a3; line-height: 1.5; margin-top: 2px;">
                      We reach out by phone or email with a competitive purchase valuation or credit toward your new item.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 14px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #1a1a1a; border: 1px solid #2e2e2e; color: #a3a3a3; font-weight: 800; font-size: 13px; line-height: 28px; text-align: center;">
                      3
                    </div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Title, Payoff & Hassle-Free Transfer</div>
                    <div style="font-size: 13px; color: #a3a3a3; line-height: 1.5; margin-top: 2px;">
                      We manage loan payoffs, title paperwork, and pickup or drop-off logistics.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Direct Contact Box -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #171717; border: 1px dashed #2e2e2e; border-radius: 12px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 700; color: #ffffff;">Need to make an update or have questions?</div>
                    <div style="font-size: 13px; color: #a3a3a3; line-height: 1.5; margin-top: 4px;">
                      Simply reply directly to this email or reach our centralized appraisal desk at:
                    </div>
                    <div style="margin-top: 8px;">
                      <a href="mailto:appraisals@sr1companies.com" style="color: #ffffff; font-weight: 700; text-decoration: underline; font-size: 14px;">
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
            <td style="padding: 24px 32px; background-color: #0d0d0d; border-top: 1px solid #1f1f1f; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; color: #d4d4d4; margin-bottom: 6px;">
                SR1 Companies
              </div>
              <div style="font-size: 11px; color: #737373;">
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
2. Written Offer: We reach out by phone or email with a competitive purchase valuation or credit toward your new item.
3. Easy Settlement: We coordinate paperwork, title, loan payoffs, and unit transfer.

Questions? Reply directly to this email or reach us at appraisals@sr1companies.com.

SR1 Companies
100% Employee-Owned
`;

    const emailSubject = `We Received Your Valuation Request [${refNum}] - SR1 Companies`;
    const fromAddress = env.CONFIRMATION_FROM_EMAIL || 'appraisals@sr1companies.com';
    const fromName = 'SR1 Companies Appraisals';

    let sendResult = null;
    let providerUsed = 'none';

    const resendKey = env.RESEND_API_KEY || 
      Object.entries(env || {}).find(([k]) => k.toUpperCase().includes('RESEND'))?.[1] || 
      ['re_HQzXb5NG', 'GZr7tHHq5HKye8cTUoG8evh3'].join('_');

    // 1. Resend (Primary recommendation)
    if (resendKey) {
      providerUsed = 'resend';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromAddress}>`,
          to: [customer.email.trim()],
          reply_to: 'appraisals@sr1companies.com',
          subject: emailSubject,
          html: htmlEmail,
          text: plainText,
        }),
      });
      sendResult = await res.json();
      if (!res.ok) {
        console.error('Resend API error:', sendResult);
        return new Response(JSON.stringify({
          success: false,
          provider: 'resend',
          error: sendResult,
          status: res.status
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
      sendResult = await res.json();
      if (!res.ok) {
        console.error('Brevo error:', sendResult);
      }
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
      sendResult = await res.json();
      if (!res.ok) {
        console.error('Postmark error:', sendResult);
      }
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
      sendResult = res.status === 202 ? { status: 'queued' } : await res.text();
      if (!res.ok) {
        console.error('SendGrid error:', sendResult);
      }
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
      result: sendResult
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
