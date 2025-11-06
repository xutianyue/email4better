(function (global) {
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

  function getDetailGuidance(detail) {
    return detailGuidance[detail] || detailGuidance.balanced;
  }

  function buildComposePrompt(senderName, recipientName, tone, detail, content) {
    const toneDesc = toneDescriptions[tone] || toneDescriptions.balanced;
    const detailDesc = detailDescriptions[detail] || detailDescriptions.balanced;
    const detailGuidanceText = getDetailGuidance(detail);

    const sender = senderName.trim();
    const recipient = recipientName.trim();
    const senderForPrompt = sender || '[Your Name]';
    const recipientForPrompt = recipient || '[Recipient]';

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

  function buildReplyPrompt(senderName, recipientName, tone, detail, content, originalEmail) {
    const toneDesc = toneDescriptions[tone] || toneDescriptions.balanced;
    const detailDesc = detailDescriptions[detail] || detailDescriptions.balanced;
    const detailGuidanceText = getDetailGuidance(detail);

    const sender = senderName.trim();
    const recipient = recipientName.trim();
    const senderForPrompt = sender || '[Your Name]';
    const recipientForPrompt = recipient || '[Recipient]';

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

  function buildPrompt(senderName, recipientName, tone, detail, content, isReply, originalEmail) {
    if (isReply) {
      return buildReplyPrompt(senderName, recipientName, tone, detail, content, originalEmail || '');
    }
    return buildComposePrompt(senderName, recipientName, tone, detail, content);
  }

  global.Email4BetterPrompts = {
    toneDescriptions,
    detailDescriptions,
    detailGuidance,
    getDetailGuidance,
    buildComposePrompt,
    buildReplyPrompt,
    buildPrompt
  };
})(window);
