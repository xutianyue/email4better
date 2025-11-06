// Email4Better - Main JavaScript

// Configuration
const CONFIG = {
  // Set to 'demo' for testing, 'production' when using backend server
  MODE: 'production', // Change to 'production' when ready
  
  // Backend API endpoint (Cloudflare Worker)
  API_ENDPOINT: 'Please set your backend API endpoint here',
  // API key for authentication
  
  MAX_CHARS: 2000,
  PROCESSING_MESSAGES: [
    'Analyzing your message...',
    'Crafting professional email...',
    'Polishing the language...',
    'Almost ready...'
  ]
};

// DOM Elements
const elements = {
  // Compose mode elements
  senderName: document.getElementById('senderName'),
  recipientName: document.getElementById('recipientName'),
  emailTone: document.getElementById('emailTone'),
  emailDetail: document.getElementById('emailDetail'),
  emailContent: document.getElementById('emailContent'),
  charCount: document.getElementById('charCount'),
  generateBtn: document.getElementById('generateBtn'),
  btnText: document.getElementById('btnText'),
  btnSpinner: document.getElementById('btnSpinner'),
  
  // Reply mode elements
  replySenderName: document.getElementById('replySenderName'),
  replyRecipientName: document.getElementById('replyRecipientName'),
  replyTone: document.getElementById('replyTone'),
  replyDetail: document.getElementById('replyDetail'),
  originalEmail: document.getElementById('originalEmail'),
  replyContent: document.getElementById('replyContent'),
  replyCharCount: document.getElementById('replyCharCount'),
  generateReplyBtn: document.getElementById('generateReplyBtn'),
  replyBtnText: document.getElementById('replyBtnText'),
  replyBtnSpinner: document.getElementById('replyBtnSpinner'),
  
  // Common elements
  outputSection: document.getElementById('outputSection'),
  emailSubject: document.getElementById('emailSubject'),
  emailBody: document.getElementById('emailBody'),
  copyBtn: document.getElementById('copyBtn'),
  copySubjectBtn: document.getElementById('copySubjectBtn'),
  editSubjectBtn: document.getElementById('editSubjectBtn'),
  editBodyBtn: document.getElementById('editBodyBtn'),
  regenerateBtn: document.getElementById('regenerateBtn'),
  processingTime: document.getElementById('processingTime'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  clearAllReplyBtn: document.getElementById('clearAllReplyBtn')
};

// Style descriptions for the AI prompt
const PROMPT_LIBRARY = window.Email4BetterPrompts || {};

// Track edit state for generated subject/body blocks
const editState = {
  subject: false,
  body: false
};

const editCache = {
  subject: '',
  body: ''
};

const templateState = {
  compose: null,
  reply: null
};

const subjectKeydownHandler = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    toggleEditMode('subject');
  }
};

// Character counter for compose mode
elements.emailContent.addEventListener('input', function() {
  const count = this.value.length;
  elements.charCount.textContent = count;
  
  if (count > CONFIG.MAX_CHARS * 0.9) {
    elements.charCount.style.color = '#dc3545';
  } else {
    elements.charCount.style.color = '#0066cc';
  }
});

// Character counter for reply mode
elements.replyContent.addEventListener('input', function() {
  const count = this.value.length;
  elements.replyCharCount.textContent = count;
  
  if (count > CONFIG.MAX_CHARS * 0.9) {
    elements.replyCharCount.style.color = '#dc3545';
  } else {
    elements.replyCharCount.style.color = '#0066cc';
  }
});

// Generate Email Button (Compose Mode)
elements.generateBtn.addEventListener('click', async function() {
  console.log('🔵 Generate button clicked');
  
  // Validation
  if (!validateInputs('compose')) {
    console.log('❌ Validation failed');
    return;
  }
  
  console.log('✅ Validation passed');
  
  // Disable button and show loading
  setLoadingState(true, 'compose');
  
  try {
    console.log('📧 Calling generateEmail...');
    // Generate email using AI
    const result = await generateEmail('compose');
    
    console.log('✅ Email generated:', result);
    
    // Display the result
    displayEmail(result);
    
    // Scroll to output
    elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (error) {
    console.error('❌ Error in generate button:', error);
    showError('Failed to generate email. Please try again.');
  } finally {
    setLoadingState(false, 'compose');
  }
});

// Generate Reply Button (Reply Mode)
elements.generateReplyBtn.addEventListener('click', async function() {
  // Validation
  if (!validateInputs('reply')) {
    return;
  }
  
  // Disable button and show loading
  setLoadingState(true, 'reply');
  
  try {
    // Generate reply using AI
    const result = await generateEmail('reply');
    
    // Display the result
    displayEmail(result);
    
    // Scroll to output
    elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (error) {
    showError('Failed to generate reply. Please try again.');
    console.error('Error:', error);
  } finally {
    setLoadingState(false, 'reply');
  }
});

// Regenerate Button
elements.regenerateBtn.addEventListener('click', function() {
  // Check which tab is active
  const composeTab = document.getElementById('compose-mode');
  const isComposeMode = composeTab.classList.contains('active') || composeTab.classList.contains('show');
  
  if (isComposeMode) {
    elements.generateBtn.click();
  } else {
    elements.generateReplyBtn.click();
  }
});

// Copy Email Button
elements.copyBtn.addEventListener('click', function() {
  const subject = elements.emailSubject.textContent;
  const body = elements.emailBody.textContent;
  const fullEmail = `Subject: ${subject}\n\n${body}`;
  
  copyToClipboard(fullEmail, this);
});

// Copy Subject Button
elements.copySubjectBtn.addEventListener('click', function() {
  const subject = elements.emailSubject.textContent;
  copyToClipboard(subject, this);
});

if (elements.editSubjectBtn) {
  elements.editSubjectBtn.addEventListener('click', () => toggleEditMode('subject'));
}

if (elements.editBodyBtn) {
  elements.editBodyBtn.addEventListener('click', () => toggleEditMode('body'));
}

if (elements.clearAllBtn) {
  elements.clearAllBtn.addEventListener('click', clearAllInputs);
}

if (elements.clearAllReplyBtn) {
  elements.clearAllReplyBtn.addEventListener('click', clearAllInputs);
}

// Validation
function validateInputs(mode = 'compose') {
  const errors = [];
  
  if (mode === 'compose') {
    // Names are optional; placeholders will be used when left blank
    
    if (!elements.emailContent.value.trim()) {
      errors.push('Please enter your email content');
      elements.emailContent.focus();
    }
  } else {
    // Reply mode validation
    // Names are optional in reply mode too
    
    if (!elements.originalEmail.value.trim()) {
      errors.push('Please paste the original email');
      elements.originalEmail.focus();
    }
    
    if (!elements.replyContent.value.trim()) {
      errors.push('Please enter your response');
      elements.replyContent.focus();
    }
  }
  
  if (errors.length > 0) {
    showError(errors.join('. '));
    return false;
  }
  
  return true;
}

// Loading State
function setLoadingState(isLoading, mode = 'compose') {
  if (mode === 'compose') {
    if (isLoading) {
      elements.generateBtn.disabled = true;
      elements.btnText.textContent = 'Generating...';
      elements.btnSpinner.classList.remove('d-none');
    } else {
      elements.generateBtn.disabled = false;
      elements.btnText.textContent = '✨ Generate Professional Email';
      elements.btnSpinner.classList.add('d-none');
    }
  } else {
    // Reply mode
    if (isLoading) {
      elements.generateReplyBtn.disabled = true;
      elements.replyBtnText.textContent = 'Generating Reply...';
      elements.replyBtnSpinner.classList.remove('d-none');
    } else {
      elements.generateReplyBtn.disabled = false;
      elements.replyBtnText.textContent = '💬 Generate Professional Reply';
      elements.replyBtnSpinner.classList.add('d-none');
    }
  }
  
  // Toggle card opacity
  const card = document.querySelector('.card');
  if (card) {
    if (isLoading) {
      card.classList.add('generating');
    } else {
      card.classList.remove('generating');
    }
  }
}

// Generate Email (AI Integration)
async function generateEmail(mode = 'compose') {
  let senderName, recipientName, tone, detail, content, isReply, originalEmail;
  
  if (mode === 'compose') {
    senderName = elements.senderName.value.trim();
    recipientName = elements.recipientName.value.trim();
    tone = elements.emailTone.value;
    detail = elements.emailDetail.value;
    content = elements.emailContent.value.trim();
    isReply = false;
  } else {
    // Reply mode
    senderName = elements.replySenderName.value.trim();
    recipientName = elements.replyRecipientName.value.trim();
    tone = elements.replyTone.value;
    detail = elements.replyDetail.value;
    content = elements.replyContent.value.trim();
    originalEmail = elements.originalEmail.value.trim();
    isReply = true;
  }
  
  // Build the prompt for AI
  const prompt = buildPrompt(senderName, recipientName, tone, detail, content, isReply, originalEmail);
  
  // Call AI API
  const response = await callAI(prompt, mode);
  
  return response;
}

// Build AI Prompt
// Delegates prompt construction to shared library so copy and tweak is easy for non-dev edits.
const buildPrompt = (...args) => {
  if (typeof PROMPT_LIBRARY.buildPrompt === 'function') {
    return PROMPT_LIBRARY.buildPrompt(...args);
  }
  throw new Error('Prompt library not loaded. Ensure prompt-config.js is included before script.js.');
};

// Call AI API
async function callAI(prompt, mode = 'compose') {
  // Check if we're in demo mode or production mode
  if (CONFIG.MODE === 'demo') {
    // DEMO MODE: Return mock response for testing
    return new Promise((resolve) => {
      setTimeout(() => {
        let mockResponse;
        
        if (mode === 'compose') {
          mockResponse = generateMockEmail(
            elements.senderName.value.trim(),
            elements.recipientName.value.trim(),
            elements.emailTone.value,
            elements.emailDetail.value,
            elements.emailContent.value.trim()
          );
        } else {
          // Reply mode
          mockResponse = generateMockReply(
            elements.replySenderName.value.trim(),
            elements.replyRecipientName.value.trim(),
            elements.replyTone.value,
            elements.replyDetail.value,
            elements.replyContent.value.trim(),
            elements.originalEmail.value.trim()
          );
        }
        
        resolve(mockResponse);
      }, 2000);
    });
  } else {
    // PRODUCTION MODE: Call backend server
    console.log('🚀 Calling API:', CONFIG.API_ENDPOINT);
    console.log('📝 Mode:', mode);
    
    try {
      const requestData = {
        senderName: mode === 'compose' ? elements.senderName.value.trim() : elements.replySenderName.value.trim(),
        recipientName: mode === 'compose' ? elements.recipientName.value.trim() : elements.replyRecipientName.value.trim(),
        tone: mode === 'compose' ? elements.emailTone.value : elements.replyTone.value,
        detail: mode === 'compose' ? elements.emailDetail.value : elements.replyDetail.value,
        content: mode === 'compose' ? elements.emailContent.value.trim() : elements.replyContent.value.trim(),
        isReply: mode === 'reply',
        originalEmail: mode === 'reply' ? elements.originalEmail.value.trim() : undefined
      };
      
      console.log('📤 Sending request:', requestData);
      
      const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        
        throw new Error(errorData.error || 'Failed to generate email');
      }
      
      const data = await response.json();
      console.log('✅ Success:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ API Error:', error);
      throw new Error(error.message || 'Failed to generate email. Please try again.');
    }
  }
}

// Mock Email Generator (for demo/testing purposes)
function generateMockEmail(senderName, recipientName, tone, detail, content) {
  const toneValue = tone || 'balanced';
  const detailValue = detail || 'balanced';

  // Detect if content is about being sick/absence
  const isSickLeave = /sick|ill|unwell|不舒服|生病|krank/i.test(content);
  const isAbsence = /can't|cannot|won't|unable|不能|nicht können/i.test(content);
  
  let subject, body;
  
  if (isSickLeave && isAbsence) {
    // Sick leave email
    if (toneValue === 'formal' || toneValue === 'reserved') {
      subject = 'Sick Leave Notification';
      body = `Dear ${recipientName},

I am writing to inform you that I am unwell and will not be able to attend work today. I apologize for any inconvenience this may cause.

I will keep you updated on my condition and expect to return as soon as I have recovered.

Thank you for your understanding.

Best regards,
${senderName}`;
    } else if (toneValue === 'casual' || toneValue === 'enthusiastic') {
      subject = 'Not Feeling Well Today';
      body = `Hi ${recipientName}!

I wanted to let you know that I'm not feeling well today and won't be able to make it to work. I'm sorry for the short notice!

I'll make sure to catch up on anything I miss once I'm back on my feet.

Thanks for understanding!

Best,
${senderName}`;
  } else {
      // balanced or assertive
      subject = 'Sick Leave for Today';
  body = `Hi ${recipientName},

I wanted to inform you that I'm not feeling well today and will need to take a sick day. I apologize for any inconvenience this may cause.

Please let me know if there's anything urgent I should be aware of, and I'll do my best to address it.

Thank you for your understanding.

Thanks,
${senderName}`;
    }
  } else {
    // Generic professional email
    subject = getGenericSubject(toneValue, detailValue);
    body = getGenericBody(recipientName, senderName, toneValue, detailValue, content);
  }
  
  return { subject, body };
}

// Mock Reply Generator (for demo/testing purposes)
function generateMockReply(senderName, recipientName, tone, detail, replyContent, originalEmail) {
  const toneValue = tone || 'balanced';
  const detailValue = detail || 'balanced';

  // Analyze original email to determine topic
  let topic = 'your email';
  if (originalEmail.toLowerCase().includes('project')) topic = 'Project Update';
  if (originalEmail.toLowerCase().includes('report')) topic = 'Report Request';
  if (originalEmail.toLowerCase().includes('meeting')) topic = 'Meeting Request';
  if (originalEmail.toLowerCase().includes('question')) topic = 'Your Question';
  
  const subject = `Re: ${topic}`;
  
  // Check common reply patterns
  const isAgreement = /yes|sure|ok|好的|可以|没问题|ja|oui/i.test(replyContent);
  const isApology = /sorry|apologize|regret|抱歉|对不起|entschuldigung/i.test(replyContent);
  const isConfirmation = /will|confirm|确认|会|werden/i.test(replyContent);
  
  let body;

  const apologyLine = isApology ? 'I apologize for any inconvenience this may have caused.' : 'Please let me know if you need anything else.';

  if (toneValue === 'formal' || toneValue === 'reserved') {
    body = `Dear ${recipientName},

Thank you for your email.

${isAgreement ? 'I confirm that I can accommodate your request.' : 'I acknowledge receipt of your message and will address it promptly.'}

${isConfirmation ? 'I will ensure this is completed as discussed.' : 'I will review this matter and respond accordingly.'}

${detailValue === 'detailed' ? 'For clarity, I will follow up with a summary of next steps and any required materials.' : apologyLine}

Best regards,
${senderName}`;
  } else if (toneValue === 'casual' || toneValue === 'enthusiastic') {
    body = `Hi ${recipientName}!

Thanks for reaching out!

${isAgreement ? 'Absolutely, I can help with that!' : 'I got your message and I\'m on it!'}

${isConfirmation ? 'I\'ll make sure to get this done.' : 'I\'ll take a look and get back to you soon.'}

${detailValue === 'detailed' ? 'Here\'s a quick rundown of what I\'ll cover in my follow-up:\n- Current status\n- What I need from you (if anything)\n- Expected timing' : apologyLine}

Talk soon,
${senderName}`;
  } else if (toneValue === 'assertive') {
    body = `Hi ${recipientName},

Thanks for your note.

${isAgreement ? 'I can take this on, and I need the final materials before end of day to stay on schedule.' : 'I received your message and I want to clarify the expectations before I proceed.'}

${isConfirmation ? 'I will move forward as outlined and will flag any blockers immediately.' : 'Please confirm the priority so I can plan accordingly.'}

${detailValue === 'detailed' ? 'To keep things on track, I propose the following steps:\n1. Align on the exact deliverable\n2. Confirm who is responsible for each input\n3. Set a target deadline for completion' : apologyLine}

Regards,
${senderName}`;
  } else {
    // balanced default
    body = `Hi ${recipientName},

Thank you for your email.

${isAgreement ? 'Yes, I can help with that.' : 'I received your message and will look into it right away.'}

${isConfirmation ? 'I will take care of this and keep you updated.' : 'I\'ll review the details and get back to you shortly.'}

${detailValue === 'detailed' ? 'I will follow up with a brief summary of next steps and any additional information you might need.' : apologyLine}

Thanks,
${senderName}`;
  }

  return { subject, body };
}

function getGenericSubject(tone, detail) {
  const key = `${tone}-${detail}`;
  const subjects = {
    'formal-concise': 'Brief Update',
    'formal-balanced': 'Professional Follow-Up',
    'formal-detailed': 'Detailed Status Update',
    'casual-concise': 'Quick Hello',
    'casual-balanced': 'Checking In',
    'casual-detailed': 'Catching Up In Detail',
    'enthusiastic-balanced': 'Exciting Update',
    'enthusiastic-detailed': 'Great News With Details',
    'reserved-concise': 'Quick Note',
    'reserved-balanced': 'Professional Update',
    'assertive-concise': 'Immediate Action Needed',
    'assertive-balanced': 'Important Follow-Up',
    'assertive-detailed': 'Action Plan Overview',
    'balanced-concise': 'Quick Update',
    'balanced-balanced': 'Following Up',
    'balanced-detailed': 'Detailed Information Request'
  };
  return subjects[key] || 'Professional Email';
}

function getGenericBody(recipientName, senderName, tone, detail, content) {
  const greetings = {
    formal: `Dear ${recipientName},`,
    casual: `Hi ${recipientName}!`,
    enthusiastic: `Hi ${recipientName}!`,
    reserved: `Hello ${recipientName},`,
    assertive: `Hi ${recipientName},`,
    balanced: `Hi ${recipientName},`
  };

  const closings = {
    formal: 'Yours sincerely,',
    casual: 'Best,',
    enthusiastic: 'Cheers,',
    reserved: 'Best regards,',
    assertive: 'Regards,',
    balanced: 'Thanks,'
  };

  const intro = {
    formal: 'I hope this message finds you well.',
    casual: 'Hope you\'re doing well!',
    enthusiastic: 'I hope your week has been going great!',
    reserved: 'I hope you are doing well.',
    assertive: 'I want to get straight to the point regarding the matter below.',
    balanced: 'I hope you\'re doing well.'
  };

  const truncate = (text, max = 200) => (text.length > max ? `${text.slice(0, max)}...` : text);
  const cleanedContent = content.trim();
  const baseMessage = cleanedContent || 'I wanted to follow up on our recent conversation and share a quick update.';
  const greetingLine = greetings[tone] || greetings.balanced;
  const closingSignature = `${closings[tone] || closings.balanced}
${senderName}`;

  if (detail === 'concise') {
    const conciseMain = truncate(baseMessage, 110);
    const conciseClosing = tone === 'formal' ? 'Please let me know if you need anything else.' : 'Let me know if that works for you.';
    return `${greetingLine}

${conciseMain}

${conciseClosing}

${closingSignature}`;
  }

  if (detail === 'detailed') {
    const detailedIntro = intro[tone] || intro.balanced;
    const detailedSummary = truncate(baseMessage, 220);
    return `${greetingLine}

${detailedIntro}

${detailedSummary}

Key details:
- Background: ${truncate(baseMessage, 140)}
- Considerations: Please review any dependencies or questions before we proceed.
- Next steps: Share confirmations, updates, or adjustments so we can move forward.

I appreciate your attention and look forward to your feedback.

${closingSignature}`;
  }

  // Balanced default: two short paragraphs
  const balancedIntro = intro[tone] || intro.balanced;
  const balancedMain = truncate(baseMessage, 180);
  const balancedClosing = 'I look forward to your response.';

  return `${greetingLine}

${balancedIntro}

${balancedMain}

${balancedClosing}

${closingSignature}`;
}

// Display Email
function displayEmail(result) {
  resetEditState();
  elements.emailSubject.textContent = result.subject;
  elements.emailBody.textContent = result.body;
  elements.outputSection.style.display = 'block';
}

// Copy to Clipboard
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    // Show success feedback
    const originalText = button.innerHTML;
    button.innerHTML = '✓ Copied!';
    button.classList.add('btn-copied');
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('btn-copied');
    }, 2000);
  }).catch(err => {
    showError('Failed to copy to clipboard');
    console.error('Copy error:', err);
  });
}

// Show Error
function showError(message) {
  // Remove existing error messages
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Create error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  // Insert after generate button
  elements.generateBtn.parentElement.appendChild(errorDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + Enter to generate
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (!elements.generateBtn.disabled) {
      elements.generateBtn.click();
    }
  }
});

// Auto-save to localStorage
function saveToLocalStorage() {
  const data = {
    // Compose mode
    senderName: elements.senderName.value,
    recipientName: elements.recipientName.value,
    emailTone: elements.emailTone.value,
    emailDetail: elements.emailDetail.value,
    emailContent: elements.emailContent.value,
    // Reply mode
    replySenderName: elements.replySenderName.value,
    replyRecipientName: elements.replyRecipientName.value,
    replyTone: elements.replyTone.value,
    replyDetail: elements.replyDetail.value,
    replyContent: elements.replyContent.value,
    originalEmail: elements.originalEmail.value
  };
  localStorage.setItem('email4better_draft', JSON.stringify(data));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('email4better_draft');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      const legacyMap = {
        balanced: { tone: 'balanced', detail: 'balanced' },
        formal: { tone: 'formal', detail: 'balanced' },
  friendly: { tone: 'casual', detail: 'balanced' },
        concise: { tone: 'balanced', detail: 'concise' },
        detailed: { tone: 'balanced', detail: 'detailed' },
  apologetic: { tone: 'casual', detail: 'balanced' },
        enthusiastic: { tone: 'enthusiastic', detail: 'balanced' }
      };
      // Compose mode
      if (data.senderName) elements.senderName.value = data.senderName;
      if (data.recipientName) elements.recipientName.value = data.recipientName;
      if (data.emailTone) elements.emailTone.value = data.emailTone;
      if (data.emailDetail) elements.emailDetail.value = data.emailDetail;
      if (!data.emailTone && data.emailStyle) {
        const mapped = legacyMap[data.emailStyle] || legacyMap.balanced;
        elements.emailTone.value = mapped.tone;
        elements.emailDetail.value = mapped.detail;
      }
      if (data.emailContent) {
        elements.emailContent.value = data.emailContent;
        elements.charCount.textContent = data.emailContent.length;
      }
      // Reply mode
      if (data.replySenderName) elements.replySenderName.value = data.replySenderName;
      if (data.replyRecipientName) elements.replyRecipientName.value = data.replyRecipientName;
      if (data.replyTone) elements.replyTone.value = data.replyTone;
      if (data.replyDetail) elements.replyDetail.value = data.replyDetail;
      if (!data.replyTone && data.replyStyle) {
        const mappedReply = legacyMap[data.replyStyle] || legacyMap.balanced;
        elements.replyTone.value = mappedReply.tone;
        elements.replyDetail.value = mappedReply.detail;
      }
      if (data.replyContent) {
        elements.replyContent.value = data.replyContent;
        elements.replyCharCount.textContent = data.replyContent.length;
      }
      if (data.originalEmail) elements.originalEmail.value = data.originalEmail;
    } catch (e) {
      console.error('Failed to load saved data:', e);
    }
  }
}

// Auto-save on input (both modes)
[
  elements.senderName, elements.recipientName, elements.emailTone, elements.emailDetail, elements.emailContent,
  elements.replySenderName, elements.replyRecipientName, elements.replyTone, elements.replyDetail,
  elements.replyContent, elements.originalEmail
].forEach(el => {
  el.addEventListener('input', saveToLocalStorage);
  el.addEventListener('change', saveToLocalStorage);
});

// Auto-resize textarea based on content
function autoResizeTextarea(textarea) {
  // Reset height to recalculate
  textarea.style.height = 'auto';
  // Set new height based on scrollHeight (minimum 100px, maximum 1000px)
  const newHeight = Math.min(Math.max(textarea.scrollHeight, 100), 1000);
  textarea.style.height = newHeight + 'px';
}

// Initialize auto-resize for all textareas
document.querySelectorAll('textarea').forEach(textarea => {
  // Set initial height
  autoResizeTextarea(textarea);
  
  // Add input event listener for auto-resize
  textarea.addEventListener('input', function() {
    autoResizeTextarea(this);
  });
  
  // Also handle paste events
  textarea.addEventListener('paste', function() {
    setTimeout(() => autoResizeTextarea(this), 10);
  });
});

function applyTemplate(mode, templateKey) {
  const templates = window.quickStartTemplates || {};
  const template = templates[mode] && templates[mode][templateKey];
  if (!template) {
    return;
  }

  const content = typeof template === 'string' ? template : template.content || '';
  const recipientName = typeof template === 'object' ? template.recipient || '' : '';

  if (mode === 'compose') {
    elements.emailTone.value = 'balanced';
    elements.emailDetail.value = 'balanced';
    elements.senderName.value = '';
    elements.recipientName.value = recipientName;
    elements.recipientName.dispatchEvent(new Event('input'));
    elements.emailTone.dispatchEvent(new Event('change'));
    elements.emailDetail.dispatchEvent(new Event('change'));

    elements.emailContent.value = content;
    elements.charCount.textContent = content.length;
    autoResizeTextarea(elements.emailContent);
    elements.emailContent.focus();
  } else {
    elements.replyTone.value = 'balanced';
    elements.replyDetail.value = 'balanced';
    elements.replySenderName.value = '';
    elements.replyRecipientName.value = recipientName;
    elements.replyRecipientName.dispatchEvent(new Event('input'));
    elements.replyTone.dispatchEvent(new Event('change'));
    elements.replyDetail.dispatchEvent(new Event('change'));

  elements.originalEmail.value = template.originalEmail || '';
  autoResizeTextarea(elements.originalEmail);
  elements.originalEmail.dispatchEvent(new Event('input'));

  elements.replyContent.value = content;
  elements.replyCharCount.textContent = content.length;
    autoResizeTextarea(elements.replyContent);
    elements.replyContent.focus();
  }
}

document.querySelectorAll('.template-btn').forEach(button => {
  button.addEventListener('click', () => handleTemplateClick(button));
});

// Load saved data on page load
loadFromLocalStorage();

// Initialize
console.log('Email4Better loaded successfully!');
console.log(`Running in ${CONFIG.MODE.toUpperCase()} mode`);
if (CONFIG.MODE === 'demo') {
  console.log('Note: Currently in DEMO mode with mock responses.');
  console.log('To use real AI, set CONFIG.MODE = "production" and run the backend server.');
}

function toggleEditMode(targetType) {
  if (!['subject', 'body'].includes(targetType)) {
    return;
  }

  if (!editState[targetType]) {
    enterEditMode(targetType);
  } else {
    exitEditMode(targetType);
  }
}

// Toggle inline editing for generated subject/body so users can tweak results.
function enterEditMode(targetType) {
  const targetElement = targetType === 'subject' ? elements.emailSubject : elements.emailBody;
  const buttonElement = targetType === 'subject' ? elements.editSubjectBtn : elements.editBodyBtn;

  if (!targetElement || !buttonElement) {
    return;
  }

  editCache[targetType] = targetElement.textContent;
  targetElement.setAttribute('contenteditable', 'true');
  targetElement.classList.add('is-editing');
  buttonElement.textContent = 'Save';
  buttonElement.setAttribute('aria-pressed', 'true');
  editState[targetType] = true;

  if (targetType === 'subject') {
    targetElement.addEventListener('keydown', subjectKeydownHandler);
  }

  focusAtEnd(targetElement);
}

function exitEditMode(targetType) {
  const targetElement = targetType === 'subject' ? elements.emailSubject : elements.emailBody;
  const buttonElement = targetType === 'subject' ? elements.editSubjectBtn : elements.editBodyBtn;

  if (!targetElement || !buttonElement) {
    return;
  }

  if (targetType === 'subject') {
    targetElement.removeEventListener('keydown', subjectKeydownHandler);
  }

  const rawValue = targetElement.innerText;
  const sanitizedValue = targetType === 'subject'
    ? sanitizeSubject(rawValue)
    : sanitizeBody(rawValue);

  targetElement.textContent = sanitizedValue || editCache[targetType];
  targetElement.removeAttribute('contenteditable');
  targetElement.classList.remove('is-editing');
  buttonElement.textContent = 'Edit';
  buttonElement.setAttribute('aria-pressed', 'false');
  editState[targetType] = false;
}

function sanitizeSubject(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function sanitizeBody(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function focusAtEnd(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  selection.removeAllRanges();
  selection.addRange(range);
  element.focus();
}

function resetEditState() {
  ['subject', 'body'].forEach(type => {
    const targetElement = type === 'subject' ? elements.emailSubject : elements.emailBody;
    const buttonElement = type === 'subject' ? elements.editSubjectBtn : elements.editBodyBtn;

    if (targetElement) {
      targetElement.removeEventListener('keydown', subjectKeydownHandler);
      targetElement.removeAttribute('contenteditable');
      targetElement.classList.remove('is-editing');
    }

    if (buttonElement) {
      buttonElement.textContent = 'Edit';
      buttonElement.setAttribute('aria-pressed', 'false');
    }

    editState[type] = false;
  });
}

function handleTemplateClick(button) {
  const mode = button.dataset.mode;
  const templateKey = button.dataset.template;
  if (!mode || !templateKey) {
    return;
  }

  const isActive = button.classList.contains('active');

  if (isActive) {
    clearTemplateSelection(mode);
    clearTemplateInputs(mode);
    return;
  }

  setActiveTemplateButton(mode, button);
  applyTemplate(mode, templateKey);
}

// Maintain a single active template button per mode with persistent styling.
function setActiveTemplateButton(mode, button) {
  const previousButton = templateState[mode];
  if (previousButton && previousButton !== button) {
    previousButton.classList.remove('active');
  }

  button.classList.add('active');
  templateState[mode] = button;
}

function clearTemplateSelection(mode) {
  const previousButton = templateState[mode];
  if (previousButton) {
    previousButton.classList.remove('active');
    templateState[mode] = null;
  }
}

function clearTemplateInputs(mode) {
  if (mode === 'compose') {
    elements.senderName.value = '';
    elements.senderName.dispatchEvent(new Event('input'));

    elements.recipientName.value = '';
    elements.recipientName.dispatchEvent(new Event('input'));

    elements.emailTone.value = 'balanced';
    elements.emailTone.dispatchEvent(new Event('change'));

    elements.emailDetail.value = 'balanced';
    elements.emailDetail.dispatchEvent(new Event('change'));

    elements.emailContent.value = '';
    elements.emailContent.dispatchEvent(new Event('input'));
    autoResizeTextarea(elements.emailContent);
  } else if (mode === 'reply') {
    elements.replySenderName.value = '';
    elements.replySenderName.dispatchEvent(new Event('input'));

    elements.replyRecipientName.value = '';
    elements.replyRecipientName.dispatchEvent(new Event('input'));

    elements.replyTone.value = 'balanced';
    elements.replyTone.dispatchEvent(new Event('change'));

    elements.replyDetail.value = 'balanced';
    elements.replyDetail.dispatchEvent(new Event('change'));

    elements.replyContent.value = '';
    elements.replyContent.dispatchEvent(new Event('input'));
    autoResizeTextarea(elements.replyContent);

    elements.originalEmail.value = '';
    elements.originalEmail.dispatchEvent(new Event('input'));
    autoResizeTextarea(elements.originalEmail);
  }

  saveToLocalStorage();
}

function clearAllInputs() {
  clearTemplateSelection('compose');
  clearTemplateSelection('reply');
  clearTemplateInputs('compose');
  clearTemplateInputs('reply');
  localStorage.removeItem('email4better_draft');
}
