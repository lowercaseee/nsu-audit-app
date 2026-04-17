@echo off
echo ========================================
echo NSU Audit - Build APK Helper
echo ========================================
echo.
echo This script helps you get the mobile app working.
echo.
echo STEP 1: Start the server
echo.
echo Run in a new terminal:
echo   cd "D:\Opencode\Project 1\project 2\nsu-audit-mcp"
echo   python server.py
echo.
echo STEP 2: Get the app on your phone
echo.
echo Option A - Web App (Recommended):
echo   1. Connect your phone to the same WiFi as computer
echo   2. Find your computer's IP (run: ipconfig)
echo   3. Note: D:\Opencode\Project 1\project 2\nsu-audit-mcp\server.py has line with your IP
echo   4. On phone browser, go to: http://YOUR_IP:5000
echo   5. Tap menu ^3 dots ^and select "Add to Home Screen"
echo.
echo Option B - Convert to APK (Free):
echo   1. Host the index.html somewhere (upload to GitHub Pages, Netlify, etc)
echo   2. Go to: https://www.pngtor.com/
echo   3. Enter your URL and download APK
echo.
echo Option C - APK Builder (Free):
echo   1. Go to: https://www.jexbus.com/ (or search "PWA to APK converter")
echo   2. Enter: http://YOUR_IP:5000
echo   3. Download the APK
echo.
echo ========================================
pause