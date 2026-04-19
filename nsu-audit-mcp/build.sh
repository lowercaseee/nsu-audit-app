#!/bin/bash
# Install system packages for OCR
apt-get update
apt-get install -y tesseract-ocr

# Install Python packages
pip install -r requirements.txt

# Start server
python server.py