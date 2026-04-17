# NSU Audit Mobile App

## Quick Start

### 1. Start the Server

```powershell
cd "D:\Opencode\Project 1\project 2\nsu-audit-mcp"
pip install -r requirements.txt
python server.py
```

Server runs on **http://localhost:5000**

### 2. Run the Web App

**Option A - In Browser:**
Open `index.html` directly in your browser, or serve it:

```powershell
cd "D:\Opencode\Project 1\project 2\mobile-v2"
python -m http.server 8080
```

Then open `http://localhost:8080`

**Option B - Convert to APK (Free Online):**

1. Upload `index.html` to any web hosting (or use the Python server)
2. Go to https://www.pngtor.com/ or https://pwa-builder.com/
3. Enter your server URL
4. Download the APK

### 3. App Features

- Google OAuth Login (@northsouth.edu only)
- Capture transcript (camera/gallery)
- Level 1/2/3 Audit Results
- History with user email
- Certificates
- Server URL config

### 4. For Play Store

The PWA (index.html) can be installed directly on Android:
1. Open in Chrome
2. Menu → Install App
3. Or use https://www.webapk.com/ to convert to a real APK

---

## Files

- `index.html` - Complete mobile app (works in any browser)
- `manifest.json` - PWA manifest
- `capacitor.config.json` - For Capacitor build