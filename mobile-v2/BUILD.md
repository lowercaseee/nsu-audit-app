# How to Build NSU Audit APK

## Method 1: Online APK Builder (FREE - Easiest)

1. First, start the server:
```
cd D:\Opencode\Project 1\project 2\nsu-audit-mcp
python server.py
```

2. Get your computer's IP address:
- Run `ipconfig` in cmd
- Look for IPv4 Address (e.g., 192.168.0.184)

3. Go to one of these FREE sites:
- https://www.jexbus.com
- https://www.apkbuilders.com
- https://www.pngtor.com

4. Enter: `http://YOUR_IP:5000`

5. Download the APK

---

## Method 2: PWA Install (No Build Needed)

1. Start server: `python server.py`
2. On your phone, open Chrome
3. Go to `http://YOUR_COMPUTER_IP:5000`
4. Tap Menu → Install App
5. Creates a native app icon on home screen

---

## Method 3: Capacitor (If npm works)

```bash
npm install -g @capacitor/cli
npm install @capacitor/core @capacitor/android
npx cap add android
npx cap build android
```

---

## Server First (Required)

The server must run first for the app to work:

```powershell
cd "D:\Opencode\Project 1\project 2\nsu-audit-mcp"
pip install fastapi uvicorn PyJWT httpx pydantic google-auth
python server.py
```

Server runs on port 5000