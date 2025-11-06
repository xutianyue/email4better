# Email4Better - Professional Email Generator

## Overview
Email4Better helps people worldwide write professional English emails from any language. Users can input their message in Chinese, German, Spanish, or any other language, and receive a professionally crafted English email.

## Features

✅ **Multi-language Input**: Write your message in any language
✅ **Professional English Output**: Get perfectly formatted English emails
✅ **Multiple Styles**: Choose from 7 different email tones
  - Balanced (default)
  - Formal
  - Friendly
  - Concise
  - Detailed
  - Apologetic
  - Enthusiastic

✅ **Personalization**: Input sender and recipient names
✅ **Subject & Body**: Generates both subject line and email body
✅ **Easy Copy**: One-click copy to clipboard
✅ **Auto-save**: Drafts automatically saved to browser
✅ **Responsive Design**: Works on all devices

## File Structure

```
site/
├── index.html      # Main HTML file
├── styles.css      # Styling
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Setup Instructions

### 1. Basic Setup
Simply open `index.html` in a web browser. The site will work in DEMO mode with mock responses.

### 2. AI API Integration

To connect with a real AI service, you need to modify the `callAI` function in `script.js`.

#### Option A: Using OpenAI API

1. Get an API key from https://platform.openai.com/
2. In `script.js`, replace the `callAI` function with:

```javascript
async function callAI(prompt) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_OPENAI_API_KEY_HERE'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a professional email writing assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    const data = await response.json();
    const emailText = data.choices[0].message.content;
    
    // Parse the JSON response from AI
    const emailData = JSON.parse(emailText);
    return emailData;
    
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to generate email');
  }
}
```

**Important**: Never expose your API key in client-side code for production! Use a backend server.

#### Option B: Using Azure OpenAI

```javascript
async function callAI(prompt) {
  const response = await fetch('YOUR_AZURE_ENDPOINT/openai/deployments/YOUR_DEPLOYMENT/chat/completions?api-version=2023-05-15', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': 'YOUR_AZURE_API_KEY'
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a professional email writing assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    })
  });
  
  const data = await response.json();
  const emailText = data.choices[0].message.content;
  return JSON.parse(emailText);
}
```

#### Option C: Using a Backend Server (Recommended for Production)

Create a backend API endpoint that handles the AI calls securely:

```javascript
async function callAI(prompt) {
  const response = await fetch('/api/generate-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      senderName: elements.senderName.value.trim(),
      recipientName: elements.recipientName.value.trim(),
      style: elements.emailStyle.value,
      content: elements.emailContent.value.trim()
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate email');
  }
  
  const data = await response.json();
  return data;
}
```

Then create a backend server (Node.js example):

```javascript
// server.js (Node.js + Express)
const express = require('express');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/generate-email', async (req, res) => {
  try {
    const { senderName, recipientName, style, content } = req.body;
    
    const prompt = buildPrompt(senderName, recipientName, style, content);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a professional email writing assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    const emailData = JSON.parse(completion.choices[0].message.content);
    res.json(emailData);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### 3. Deploy to Web

#### GitHub Pages (Free)
1. Create a GitHub repository
2. Upload all files from the `site` folder
3. Enable GitHub Pages in repository settings
4. Your site will be live at `https://yourusername.github.io/repository-name`

#### Netlify (Free)
1. Sign up at https://netlify.com
2. Drag and drop the `site` folder
3. Your site will be live immediately

#### Vercel (Free)
1. Sign up at https://vercel.com
2. Import your GitHub repository or upload files
3. Deploy automatically

## Domain Setup

You mentioned you have `email4better.com`. To connect it:

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Update DNS settings to point to your hosting provider
3. For GitHub Pages: Add CNAME record pointing to `yourusername.github.io`
4. For Netlify/Vercel: Follow their custom domain instructions

## Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
  --primary-color: #0066cc;  /* Change to your brand color */
  --secondary-color: #28a745;
}
```

### Add More Styles
Edit the `<select>` in `index.html` and add corresponding descriptions in `script.js`:
```javascript
const styleDescriptions = {
  yourNewStyle: 'description here',
  // ...
};
```

### Modify Email Templates
Edit the `generateMockEmail` function in `script.js` to change how emails are structured.

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Security Notes

⚠️ **Important for Production**:
1. Never expose API keys in client-side code
2. Use a backend server to handle AI API calls
3. Implement rate limiting to prevent abuse
4. Add user authentication if needed
5. Sanitize user inputs
6. Use HTTPS always

## Testing

The site currently runs in DEMO mode. Test with:
- Chinese: "我今天不想上班，我生病了"
- German: "Ich kann heute nicht zur Arbeit kommen"
- English: "I can't come to work today, I'm sick"

## Support

For issues or questions:
- Check the browser console for errors
- Ensure all files are in the same directory
- Verify API credentials if using real AI service

## License

This project is created for email4better.com. All rights reserved.

## Version

Current Version: 1.0.0
Last Updated: October 27, 2025
