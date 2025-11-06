<!-- GitHub-friendly styled title using site colors -->
<!-- <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin-bottom: 1rem;">
	<h1 style="margin:0; font-size:3.6rem; font-weight:800; line-height:1.1;">
		<span style="color:#0066cc;">Email</span><span style="color:#000; font-weight:900;">4</span><span style="color:#28a745;">Better</span>
	</h1>
	<h2 style="margin:0; margin-top:0.25rem; font-size:1.6rem; font-weight:600; color:#000;">
		<span>Write </span><span style="color:#28a745; font-weight:700;">Better</span><span> English Emails </span><span style="color:#0066cc; font-weight:600;">From Any Language</span>
	</h2>
</div> -->

![Email4Better logo](logo.png)

[![Website](https://img.shields.io/badge/Website-Online-brightgreen)](https://email4better.com) [![Powered by Groq](https://img.shields.io/badge/Powered%20by-Groq-orange)](https://groq.com/) [![Hosted on Cloudflare](https://img.shields.io/badge/Hosted%20on-Cloudflare-blue)](https://www.cloudflare.com/)

Email4Better([https://email4better.com](https://email4better.com/)) is a simple, user-friendly website that helps people write and reply and English emails professionally, clearly, and appropriately from any language.

It supports multiple tones and levels of detail and can generate contextual replies when an original message is provided.

## Demo
![Demo](demo.gif)

## Features
- AI-powered English email writing from any language  
- Multiple tones (formal, casual, assertive, etc.)  
- Adjustable detail levels (concise, balanced, detailed)  
- Free and no login required

## Tech Stack
- Frontend: HTML + JS  
- Backend: Cloudflare Worker  
- Model API: `openai/gpt-oss-120b` via Groq  
- Deployment: Cloudflare Pages  
 
## Structure 
```
site/
├── index.html      # Main HTML file
├──favicon.png		# Website LOGO
├── styles.css      # Styling
├── script.js       # JavaScript functionality
├── prompt-config.js # Prompt used for email generator
├── templates.js # A few templates
└── README.md       # This file
```




## How to deploy

### Prerequisites
- Cloudflare account (Pages + Workers enabled)
- Groq API key (store it as a secret; never commit it)
- Node.js 18+ and npm
- Wrangler CLI

```powershell
npm i -g wrangler
wrangler --version
```

### 1) Deploy the Worker API (Groq)
The frontend calls a POST endpoint at `API_ENDPOINT`. If you already have a Worker, ensure the route and CORS headers match your site. Otherwise, you can use this minimal Worker as a starting point.

There is an example worker in `site/index.js`

wrangler.toml example:

```toml
name = "email4better"
main = "src/index.js"
compatibility_date = "2024-10-01"
# Optional: bind to a custom route instead of *.workers.dev
# routes = [ { pattern = "api.email4better.com", zone_id = "<YOUR_ZONE_ID>" } ]
```

Deploy steps (PowerShell):

```powershell
# 1) Authenticate Cloudflare
wrangler login

# 2) Create a Worker project (if you don’t have one yet)
wrangler init email4better-worker --yes --type=javascript

# 3) Add the sample code to src/index.js and the toml above

# 4) Store your Groq API key as a secret
wrangler secret put GROQ_API_KEY

# 5) Deploy
wrangler deploy
```

After deploy, you’ll get a URL like: `https://<name>.<account>.workers.dev/api/generate-email`.

Update the frontend endpoint in `site/script.js` if needed:

```javascript
// site/script.js
const CONFIG = {
	MODE: 'production',
	API_ENDPOINT: 'https://<your-worker>.<account>.workers.dev/api/generate-email',
	// ...
};
```

Tip: For stricter security, replace `*` CORS with your domain (and your Pages preview domain if needed).

### 2) Deploy the frontend (Cloudflare Pages)
Cloudflare Pages hosts the static site from the `site/` folder.

Options:
1) Connect GitHub repo in Cloudflare Pages dashboard
	 - Project settings:
		 - Build command: none
		 - Output directory: `site`
	 - Deploy → Pages will serve your site

2) Direct upload
	 - Create a Pages project → “Upload assets” → drag the contents of `site/`

Custom domain: point `your custom domain` to your Pages project (Pages → Custom domains) and, if you use a custom API domain or route for the Worker, add the appropriate DNS and route there as well.

### 3) Local development
- Run the Worker locally:

```powershell
wrangler dev
```

- Open `site/index.html` directly in the browser for the frontend. For local API testing, temporarily set `CONFIG.API_ENDPOINT` to `http://127.0.0.1:8787/api/generate-email`.

---

Made by [Tianyue Xu](https://github.com/xutianyue) • © 2025 Email4Better
