"""
NSU Audit FastAPI Server
Simple standalone server that runs on port 5000
"""

import os
import re
import base64
import json
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt
import httpx

import services.audit_logic as AuditService
import services.cert_service as CertificateService
import services.history_service as HistoryService

app = FastAPI(title="NSU Audit API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "871051854278-tgov2na9jbu53n5680n9e3qpdlvh338b.apps.googleusercontent.com")
JWT_SECRET = os.getenv("JWT_SECRET", "nsu-audit-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

DATA_DIR = Path(__file__).parent.parent / "app"
USERS_FILE = DATA_DIR / "users.json"

api_keys = {}


def load_users():
    if USERS_FILE.exists():
        try:
            return json.loads(USERS_FILE.read_text())
        except:
            pass
    return {}


def save_users(users):
    USERS_FILE.write_text(json.dumps(users, indent=2))


def generate_token(user):
    payload = {
        "sub": user.get("email", ""),
        "name": user.get("name", ""),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        return None


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return verify_token(authorization[7:])


def get_api_key_user(x_api_key: str = Header(None, alias="x-api-key")):
    return api_keys.get(x_api_key) if x_api_key else None


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    access_token: Optional[str] = None


class ProcessTranscriptRequest(BaseModel):
    image: Optional[str] = None
    courses: Optional[list] = None


class GenerateKeyRequest(BaseModel):
    name: Optional[str] = None


@app.get("/test")
def health_check():
    return {"status": "ok", "message": "Server working"}


async def verify_google_token(access_token: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                return response.json()
    except:
        pass
    return None


@app.post("/auth/google")
async def google_auth(req: GoogleAuthRequest):
    payload = None
    
    if req.access_token:
        payload = await verify_google_token(req.access_token)
        if not payload:
            HistoryService.log("POST /auth/google", "unknown", False)
            raise HTTPException(status_code=401, detail="Invalid access_token")
    elif req.credential:
        raise HTTPException(status_code=400, detail="Use access_token")
    else:
        raise HTTPException(status_code=400, detail="Missing token")
    
    if not payload or not payload.get("email"):
        raise HTTPException(status_code=400, detail="Invalid token")
    
    if not payload["email"].endswith("@northsouth.edu"):
        HistoryService.log("POST /auth/google", payload["email"], False)
        raise HTTPException(status_code=403, detail="Only @northsouth.edu emails allowed")
    
    users = load_users()
    email = payload["email"]
    if email not in users:
        users[email] = {
            "email": email,
            "name": payload.get("name", email.split("@")[0]),
            "picture": payload.get("picture", ""),
            "googleId": payload.get("id", ""),
            "created": datetime.now().isoformat()
        }
        save_users(users)
    
    user = users[email]
    token = generate_token(user)
    HistoryService.log("POST /auth/google", email, True)
    
    return {"token": token, "user": {"id": email, "name": user["name"], "email": user["email"], "picture": user.get("picture", "")}}


@app.post("/auth/cli-login")
async def cli_login(req: GoogleAuthRequest):
    return await google_auth(req)


@app.post("/generate-key")
def generate_key(req: GenerateKeyRequest = None):
    key = f"nsu_{os.urandom(16).hex()}"
    name = req.name if req and req.name else "CLI"
    api_keys[key] = name
    HistoryService.log("POST /generate-key", name, True)
    return {"apiKey": key, "name": name}


@app.get("/api-history")
def get_api_history(
    current_user: Optional[dict] = Depends(get_current_user),
    api_key_user: Optional[str] = Depends(get_api_key_user)
):
    user = current_user.get("sub") if current_user else api_key_user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    HistoryService.log("GET /api-history", user, True)
    return {"history": HistoryService.get_by_user(user)}


@app.get("/certificates")
def get_certificates(
    current_user: Optional[dict] = Depends(get_current_user),
    api_key_user: Optional[str] = Depends(get_api_key_user)
):
    user = current_user.get("sub") if current_user else api_key_user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {"certificates": CertificateService.get_by_user(user)}


@app.get("/certificates/{filename}")
def get_certificate(
    filename: str,
    current_user: Optional[dict] = Depends(get_current_user),
    api_key_user: Optional[str] = Depends(get_api_key_user)
):
    user = current_user.get("sub") if current_user else api_key_user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    certs = CertificateService.get_by_user(user)
    if not any(c["filename"] == filename for c in certs):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    pdf_data = CertificateService.get_file(filename)
    if not pdf_data:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    from fastapi.responses import Response
    return Response(content=pdf_data, media_type="application/pdf")


@app.post("/process-transcript")
async def process_transcript(
    req: ProcessTranscriptRequest,
    current_user: Optional[dict] = Depends(get_current_user),
    api_key_user: Optional[str] = Depends(get_api_key_user)
):
    user = current_user.get("sub") if current_user else api_key_user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = None
    
    if req.courses and isinstance(req.courses, list):
        audit = AuditService.audit_courses(req.courses)
        result = AuditService.build_result({"courses": req.courses, "name": "Student", "id": "000000"}, audit)
    else:
        image_buffer = None
        if req.image:
            try:
                base64_data = re.sub(r'^data:image/\w+;base64,', '', req.image)
                image_buffer = base64.b64decode(base64_data)
            except:
                pass
        
        if image_buffer or True:
            result = AuditService.get_demo_result()
    
    if not result:
        result = AuditService.get_demo_result()
    
    pdf_bytes = f"Certificate for {result.get('student', {}).get('name', 'Student')}".encode('utf-8')
    cert_info = CertificateService.save(user, pdf_bytes, result.get("student", {}).get("name", "student"))
    
    HistoryService.log("POST /process-transcript", user, True)
    
    return {**result, "pdf": None, "certificate": cert_info}


@app.get("/")
def root():
    return {"message": "NSU Audit API", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5001))
    print(f"Starting NSU Audit Server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)