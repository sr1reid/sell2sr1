// Cloudflare Worker Module: /functions/api/chat-recap.js
// Generates a concise 1-sentence AI recap of an individual deal/unit chat thread
// for the Dealer & Bank portals ("Chat" column).
// Uses Cloudflare Workers AI (env.AI) when bound, with optional Gemini/OpenAI fallback
// and a deterministic smart recap fallback so it always responds cleanly.

function buildDeterministicRecap({ messages = [], partnerType = 'dealer', offerAmount = 0, acceptanceDecision = '' }) {
  const list = Array.isArray(messages) ? messages.filter(m => m && String(m.text || '').trim()) : [];
  if (list.length === 0) return '';

  const partnerLabel = partnerType === 'bank' ? 'Bank' : 'Dealer';
  const last = list[list.length - 1];
  const lastText = String(last.text || '').trim();
  const lastLower = lastText.toLowerCase();
  const isStaffLast = last.senderRole === 'staff';
  const speaker = isStaffLast ? 'SR1' : partnerLabel;
  const waitingOn = isStaffLast ? partnerLabel.toLowerCase() : 'SR1';

  if (acceptanceDecision === 'accepted' && /accepted/i.test(lastText)) {
    return `${partnerLabel} accepted SR1's offer; awaiting SR1 to coordinate pickup & paperwork.`;
  }
  if (acceptanceDecision === 'declined' && /declined/i.test(lastText)) {
    return `${partnerLabel} declined SR1's offer; deal currently paused unless revised.`;
  }
  if (isStaffLast && /official sr1 offer recorded/i.test(lastText)) {
    const amtStr = offerAmount > 0 ? `$${Number(offerAmount).toLocaleString()} ` : '';
    return `SR1 posted a ${amtStr}offer; waiting on ${partnerLabel.toLowerCase()} response.`;
  }

  const hasQuestion = lastText.includes('?');
  const mentionsPickup = /\b(pick(?:\s+\w+)?\s*up|pickup|drop(?:\s+\w+)?\s*off|transport|deliver|haul|schedule|logistics)\b/i.test(lastLower);
  const mentionsTitle = /\b(title|paperwork|affidavit|lien|payoff|bill of sale|repo)\b/i.test(lastLower);
  const mentionsPrice = /\b(\$|offer|price|counter|bid|amount|number|value)\b/i.test(lastLower);
  const mentionsPhotos = /\b(photo|pic|picture|video|vin|serial|hour|mile|damage|condition)\b/i.test(lastLower);

  let topic = '';
  if (mentionsPickup) topic = 'pickup / delivery logistics';
  else if (mentionsTitle) topic = 'title & paperwork details';
  else if (mentionsPrice) topic = 'pricing / offer terms';
  else if (mentionsPhotos) topic = 'unit details / photos';

  if (topic) {
    return hasQuestion
      ? `${speaker} asked about ${topic}; waiting on ${waitingOn} reply.`
      : `${speaker} shared an update on ${topic}; awaiting ${waitingOn} reply.`;
  }

  const snippet = lastText.replace(/\s+/g, ' ').slice(0, 72);
  const suffix = lastText.length > 72 ? '…' : '';
  return `${speaker}: "${snippet}${suffix}" — awaiting ${waitingOn} reply.`;
}

function cleanAiRecapText(raw) {
  if (!raw) return '';
  let text = String(raw).split(/\r?\n/).map(l => l.trim()).filter(Boolean)[0] || '';
  text = text.replace(/^(recap|summary|status)\s*:\s*/i, '').trim();
  text = text.replace(/^["'`•\-\s]+|["'`\s]+$/g, '').trim();
  if (text.length > 160) {
    return text.slice(0, 157).trimEnd() + '...';
  }
  return text;
}

export async function handleChatRecapApi(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const partnerType = body.partnerType === 'bank' ? 'bank' : 'dealer';
    const unitTitle = String(body.unitTitle || 'Unit').trim();
    const offerAmount = Number(body.offerAmount) || 0;
    const acceptanceDecision = String(body.acceptanceDecision || '').trim();
    const currentStatus = String(body.currentStatus || '').trim();

    if (messages.length === 0) {
      return new Response(JSON.stringify({ success: true, recap: '', source: 'empty' }), {
        status: 200,
        headers: corsHeaders
      });
    }

    const recentMessages = messages.slice(-12);
    const partnerLabel = partnerType === 'bank' ? 'Bank' : 'Dealer';
    const transcript = recentMessages
      .map((m) => {
        const who = m.senderRole === 'staff' ? 'SR1' : partnerLabel;
        return `${who}: ${String(m.text || '').replace(/\s+/g, ' ').trim()}`;
      })
      .join('\n');

    const systemPrompt =
      'You summarize ONLY the messages in this chat thread in ONE short, direct sentence (max 18 words). ' +
      'Focus specifically on the actual question, request, or answer in the chat — do NOT mention unit make/model/year or overall deal status. ' +
      'Be exact about who asked or said what (SR1 vs Dealer/Bank). ' +
      'Plain text only. No quotes, no bullet points, no preamble.';

    const userPrompt = `Chat messages (oldest to newest):\n${transcript}`;

    // 1. Primary: Cloudflare Workers AI binding
    if (env && env.AI && typeof env.AI.run === 'function') {
      const modelsToTry = [
        '@cf/meta/llama-3.1-8b-instruct-fast',
        '@cf/meta/llama-3.1-8b-instruct'
      ];
      for (const model of modelsToTry) {
        try {
          const aiRes = await env.AI.run(model, {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 60,
            temperature: 0.1
          });
          const rawText = aiRes?.response || aiRes?.choices?.[0]?.message?.content || '';
          const cleaned = cleanAiRecapText(rawText);
          if (cleaned && cleaned.length >= 10) {
            return new Response(JSON.stringify({ success: true, recap: cleaned, source: 'workers_ai', promptVersion: 2 }), {
              status: 200,
              headers: corsHeaders
            });
          }
        } catch (aiErr) {
          console.warn(`Workers AI (${model}) fallback:`, aiErr?.message || aiErr);
        }
      }
    }

    // 2. Optional: OpenAI API key if configured in Worker secrets
    if (env && env.OPENAI_API_KEY) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 60,
            temperature: 0.1
          })
        });
        if (res.ok) {
          const data = await res.json();
          const cleaned = cleanAiRecapText(data?.choices?.[0]?.message?.content || '');
          if (cleaned && cleaned.length >= 10) {
            return new Response(JSON.stringify({ success: true, recap: cleaned, source: 'openai', promptVersion: 2 }), {
              status: 200,
              headers: corsHeaders
            });
          }
        }
      } catch (oaiErr) {
        console.warn('OpenAI chat recap fallback:', oaiErr?.message || oaiErr);
      }
    }

    // 3. Deterministic smart fallback (always succeeds immediately)
    const fallbackRecap = buildDeterministicRecap({
      messages: recentMessages,
      partnerType,
      offerAmount,
      acceptanceDecision
    });
    return new Response(JSON.stringify({ success: true, recap: fallbackRecap, source: 'smart_fallback', promptVersion: 2 }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Recap error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
