/**
 * Cloudflare Worker for Email4Better
 * 部署到 Cloudflare Workers，API key 存储在环境变量中
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Serve static files
    if (request.method === 'GET') {
      const url = new URL(request.url);
      if (url.pathname === '/') {
        return fetch(new Request(url.origin + '/index.html', request));
      }
      return fetch(request);
    }

    if (request.method === 'POST' && request.url.endsWith('/api/generate-email')) {
      try {
        const { senderName, recipientName, tone, detail, content, isReply, originalEmail } = await request.json();

        if (!content) {
          return new Response(JSON.stringify({ error: 'Content is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (isReply && !originalEmail) {
          return new Response(JSON.stringify({ error: 'Original email required for reply mode' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const prompt = buildPrompt(
          senderName || '',
          recipientName || '',
          tone || 'balanced',
          detail || 'balanced',
          content,
          isReply,
          originalEmail
        );

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // model: 'llama-3.1-8b-instant',
            model: 'openai/gpt-oss-120b',
            messages: [
              {
                role: 'system',
                content: 'You are a professional email writing assistant. Respond only with valid JSON.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7
          })
        });

        if (!groqResponse.ok) {
          const error = await groqResponse.text();
          console.error('Groq API error:', error);
          return new Response(JSON.stringify({ error: 'AI service error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const groqData = await groqResponse.json();
        const emailData = JSON.parse(groqData.choices[0].message.content);

        return new Response(
          JSON.stringify(emailData),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

const toneDescriptions = {
  balanced: 'professional yet friendly tone with measured warmth',
  casual: 'relaxed, conversational tone that stays approachable and natural',
  formal: 'polite and respectful tone with clear professional distance',
  enthusiastic: 'positive, energetic tone that conveys excitement appropriately',
  reserved: 'calm, restrained tone that stays neutral and composed',
  assertive: 'direct and confident tone that remains respectful'
};

const detailDescriptions = {
  balanced: 'two short paragraphs balancing context and request',
  concise: 'single short paragraph focused on just the essentials',
  detailed: 'multi-paragraph response with deep context and next steps'
};

const detailGuidance = {
  concise: 'Keep the response short and to the point. One brief paragraph is enough as long as it clearly states the key update or request without extra background.',
  balanced: 'Provide a moderately detailed response with two short paragraphs--use the first for context and the second for the specific ask or update.',
  detailed: 'Deliver a thorough response. Use multiple paragraphs (or a paragraph plus bullets) to cover context, rationale, and clear next steps so the reader has everything they need.'
};

function buildPrompt(senderName, recipientName, tone, detail, content, isReply = false, originalEmail = '') {
  const toneDesc = toneDescriptions[tone] || toneDescriptions.balanced;
  const detailDesc = detailDescriptions[detail] || detailDescriptions.balanced;

  const sender = senderName.trim();
  const recipient = recipientName.trim();
  const senderForPrompt = sender || '[Your Name]';
  const recipientForPrompt = recipient || '[Recipient]';
  const detailGuidanceText = detailGuidance[detail] || detailGuidance.balanced;

  if (isReply) {
    return `You are a professional email writing assistant. Generate a professional English email REPLY.

CONTEXT:
Sender (replying): ${senderForPrompt}
Original Sender: ${recipientForPrompt}
Tone: ${tone} (${toneDesc})
Detail Level: ${detail} (${detailDesc})
Detail Guidance: ${detailGuidanceText}

ORIGINAL EMAIL RECEIVED:
${originalEmail}

USER'S RESPONSE (may be in any language):
${content}

INSTRUCTIONS:
1. Read and understand the original email.
2. Understand the user's response (could be in Chinese, German, Spanish, etc.).
3. ${sender ? `Use "${sender}" exactly as the sender name.` : 'Use "[Your Name]" as the sender name. Do not invent or infer any other name.'}
4. ${recipient ? `Use "${recipient}" exactly as the recipient name.` : 'Use "[Recipient]" as the recipient name. Do not invent or infer any other name.'}
5. Follow this detail guidance exactly: ${detailGuidanceText}
6. Match the requested tone in the reply.
7. Include an appropriate subject line (usually "Re: " + the original subject or topic).
8. Return ONLY valid JSON format:

{
  "subject": "Re: [Topic from original email]",
  "body": "Professional reply email"
}

The body should include:
- Appropriate greeting (Hi/Dear [recipient name] based on formality)
- Reference to the original email if appropriate
- Clear response to their request/question
- Professional closing
- Sender's name (use "[Your Name]" if no sender name was provided)

Make it natural, professional, and contextually appropriate.`;
  }

  return `You are a professional email writing assistant. Generate a professional English email based on the following information:

Sender Name: ${senderForPrompt}
Recipient Name: ${recipientForPrompt}
Tone: ${tone} (${toneDesc})
Detail Level: ${detail} (${detailDesc})
Detail Guidance: ${detailGuidanceText}
User's Message (may be in any language): ${content}

IMPORTANT INSTRUCTIONS:
1. Understand the user's message regardless of what language it's written in.
2. ${sender ? `Use "${sender}" exactly as the sender name.` : 'Use "[Your Name]" as the sender name. Do not invent or infer any other name.'}
3. ${recipient ? `Use "${recipient}" exactly as the recipient name.` : 'Use "[Recipient]" as the recipient name. Do not invent or infer any other name.'}
4. Follow this detail guidance exactly: ${detailGuidanceText}
5. Match the requested tone when composing the email.
6. Create an appropriate subject line based on the content.
7. Use proper email format with greeting and closing.
8. Ensure the email is clear, professional, and appropriate for workplace communication.
9. Return ONLY the email in this exact JSON format:
{
  "subject": "Subject line here",
  "body": "Email body here with proper greeting and closing"
}

The body should include:
- Appropriate greeting (Hi [recipient name], Dear [recipient name], etc. based on formality)
- Well-structured message conveying the user's intent
- Appropriate closing
- Sender's name (use "[Your Name]" if no sender name was provided)

Make sure the email sounds natural and professional.`;
}

// 速率限制函数
async function checkRateLimit(clientIP, env) {
  const DAILY_LIMIT = env.DAILY_LIMIT_PER_IP || 20;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `ratelimit:${clientIP}:${today}`;
  
  // 从 KV 获取当前计数
  const count = await env.RATE_LIMITER.get(key);
  const currentCount = count ? parseInt(count) : 0;
  
  // 计算重置时间（明天 00:00 UTC）
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  
  if (currentCount >= DAILY_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: tomorrow.toISOString()
    };
  }
  
  return {
    allowed: true,
    remaining: DAILY_LIMIT - currentCount,
    resetTime: tomorrow.toISOString()
  };
}

// 增加速率限制计数
async function incrementRateLimit(clientIP, env) {
  const today = new Date().toISOString().split('T')[0];
  const key = `ratelimit:${clientIP}:${today}`;
  
  const count = await env.RATE_LIMITER.get(key);
  const newCount = count ? parseInt(count) + 1 : 1;
  
  // 存储到 KV，设置过期时间为 2 天（以防时区问题）
  const expirationTtl = 60 * 60 * 48; // 48 小时
  await env.RATE_LIMITER.put(key, newCount.toString(), { expirationTtl });
  
  return newCount;
}
