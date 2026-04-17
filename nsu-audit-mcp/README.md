# NSU Audit FastAPI Server

## Installation

```bash
cd nsu-audit-mcp
pip install -r requirements.txt
```

## Run Server

```bash
python server.py
```

The server runs on port 5000 (or PORT from environment).

## Deployment to Render.com

### Prerequisites
- GitHub account
- Render.com account (free tier)

### Steps

1. **Push to GitHub:**
   ```bash
   cd D:\Opencode\Project 1\project 2\app
   git add .
   git commit -m "Prepare for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nsu-audit.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - Name: `nsu-audit`
     - Environment: `Python`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `python server.py`
   - Click "Create Web Service"

3. **Environment Variables** (in Render dashboard):
   - `PORT` = `5000` (or let Render assign)
   - `GOOGLE_CLIENT_ID` = `YOUR_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET` = `YOUR_GOOGLE_CLIENT_SECRET`
   - `JWT_SECRET` = `YOUR_JWT_SECRET`

4. **After deployment**, update Flutter app's `ApiService.serverUrl` to your Render URL (e.g., `https://nsu-audit.onrender.com`)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/test` | GET | Health check |
| `/auth/google` | POST | Google OAuth login |
| `/auth/cli-login` | POST | CLI device flow |
| `/generate-key` | POST | Generate API key |
| `/api-history` | GET | User's history |
| `/certificates` | GET | User's certificates |
| `/process-transcript` | POST | Process transcript |