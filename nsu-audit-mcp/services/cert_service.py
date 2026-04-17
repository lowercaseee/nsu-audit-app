"""
Certificate Service - Save/Retrieve PDFs
"""
import os
from pathlib import Path
from datetime import datetime

CERTS_DIR = Path(__file__).parent / "certificates"


def ensure_dir():
    if not CERTS_DIR.exists():
        CERTS_DIR.mkdir(parents=True, exist_ok=True)


def save(user, pdf_data, student_name="student"):
    ensure_dir()
    timestamp = datetime.now().isoformat().replace(":", "-").replace(".", "-")
    safe_user = "".join(c if c.isalnum() else "_" for c in user)
    safe_name = "".join(c if c.isalnum() else "_" for c in student_name)
    filename = f"cert_{safe_user}_{safe_name}_{timestamp}.pdf"
    filepath = CERTS_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(pdf_data)
    
    return {"filename": filename, "path": str(filepath), "timestamp": timestamp}


def get_by_user(user):
    ensure_dir()
    safe_user = "".join(c if c.isalnum() else "_" for c in user)
    
    files = []
    for f in CERTS_DIR.iterdir():
        if f.is_file() and f.name.startswith(f"cert_{safe_user}") and f.suffix == ".pdf":
            stats = f.stat()
            files.append({
                "filename": f.name,
                "timestamp": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                "size": stats.st_size
            })
    
    return sorted(files, key=lambda x: x["timestamp"], reverse=True)


def get_file(filename):
    filepath = CERTS_DIR / filename
    if filepath.exists():
        with open(filepath, "rb") as f:
            return f.read()
    return None