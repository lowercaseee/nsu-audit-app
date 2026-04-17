#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NSU Audit CLI - Python CLI for NSU Student Audit System
Uses Google OAuth2 Device Flow (RFC 8628) for authentication
Uses keyring for secure token storage
"""

import click
import requests
import json
import sys
import time
import webbrowser
import os
from urllib.parse import urlencode
from keyring import get_password, set_password, delete_password

# Fix Windows encoding issues
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Configuration
SERVER_URL = "http://localhost:5000"
GOOGLE_CLIENT_ID = "871051854278-tgov2na9jbu53n5680n9e3qpdlvh338b.apps.googleusercontent.com"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_DEVICE_CODE_URL = "https://oauth2.googleapis.com/device/code"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
SERVICE_NAME = "nsu-audit-cli"


def print_success(msg):
    print(f"[+] {msg}")


def print_error(msg):
    print(f"[!] {msg}", file=sys.stderr)


def print_info(msg):
    print(f"[i] {msg}")


def print_warning(msg):
    print(f"[?] {msg}")


def get_stored_token():
    """Retrieve token from keyring"""
    return get_password(SERVICE_NAME, "token")


def get_stored_user():
    """Retrieve user info from keyring"""
    user_data = get_password(SERVICE_NAME, "user")
    if user_data:
        return json.loads(user_data)
    return None


def store_token(token, user):
    """Store token and user in keyring"""
    set_password(SERVICE_NAME, "token", token)
    set_password(SERVICE_NAME, "user", json.dumps(user))


def clear_credentials():
    """Clear stored credentials"""
    try:
        delete_password(SERVICE_NAME, "token")
        delete_password(SERVICE_NAME, "user")
    except:
        pass


def make_request(method, endpoint, data=None, auth_token=None):
    """Make HTTP request to server"""
    url = f"{SERVER_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if auth_token:
        # Use x-api-key header for API key authentication
        headers["x-api-key"] = auth_token
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        
        return response
    except requests.exceptions.ConnectionError:
        print_error("Could not connect to server. Make sure server is running.")
        return None


# ============================================================
# Google OAuth2 Device Authorization Grant (RFC 8628)
# ============================================================

def request_device_code():
    """Step 1: Request device code from Google"""
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "scope": "openid email profile https://www.googleapis.com/auth/userinfo.email"
    }
    
    response = requests.post(GOOGLE_DEVICE_CODE_URL, json=data, timeout=10)
    if response.status_code == 200:
        return response.json()
    else:
        print_error(f"Failed to get device code: {response.text}")
        return None


def poll_for_token(device_code):
    """Step 2: Poll for token"""
    print(f"\n[*] Please visit: {device_code['verification_url']}")
    print(f"[*] Enter this code: {device_code['user_code']}")
    print(f"\n[*] Waiting for authorization... (press Ctrl+C to cancel)")
    
    poll_data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": "GOCSPX-K9eQ2eG3WjV7xH9kM4nL2pQ6rT0",
        "device_code": device_code["device_code"],
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
    }
    
    max_attempts = 36  # 3 minutes (36 * 5 seconds)
    
    for attempt in range(max_attempts):
        time.sleep(5)
        
        try:
            response = requests.post(GOOGLE_TOKEN_URL, json=poll_data, timeout=10)
            result = response.json()
            
            if "access_token" in result:
                return result
            elif result.get("error") == "authorization_pending":
                sys.stdout.write(".")
                sys.stdout.flush()
                continue
            elif result.get("error") == "slow_down":
                print_warning("Slowing down polling...")
                time.sleep(5)
                continue
            elif result.get("error") == "expired_token":
                print_error("Authorization timed out. Please try again.")
                return None
            elif result.get("error") == "access_denied":
                print_error("Authorization denied by user.")
                return None
            else:
                print_error(f"OAuth error: {result.get('error_description', result.get('error'))}")
                return None
                
        except Exception as e:
            print_error(f"Polling error: {str(e)}")
            return None
    
    print_error("Authorization timed out. Please try again.")
    return None


def get_user_info(access_token):
    """Step 3: Get user info from Google"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(GOOGLE_USERINFO_URL, headers=headers, timeout=10)
    
    if response.status_code == 200:
        return response.json()
    else:
        print_error(f"Failed to get user info: {response.text}")
        return None


# ============================================================
# CLI Commands
# ============================================================

@click.group()
def cli():
    """NSU Audit CLI - Student Audit System"""
    pass


@cli.command()
def login():
    """Login with Google OAuth2 (Device Flow)"""
    print_info("Starting Google OAuth Device Flow...")
    
    # Step 1: Get device code
    device_code = request_device_code()
    if not device_code:
        sys.exit(1)
    
    # Step 2: Open browser
    try:
        webbrowser.open(device_code["verification_url"])
        print_info("Browser opened for authorization")
    except:
        pass
    
    # Step 3: Poll for token
    token_response = poll_for_token(device_code.get("device_code"))
    if not token_response:
        # Try polling with actual device code
        token_response = poll_for_token(device_code)
        if not token_response:
            sys.exit(1)
    
    print()  # New line after polling
    
    # Step 4: Get user info
    user_info = get_user_info(token_response["access_token"])
    if not user_info:
        print_error("Failed to get user info")
        sys.exit(1)
    
    print_success(f"Authenticated as: {user_info.get('name', user_info.get('email'))}")
    print_info(f"Email: {user_info.get('email')}")
    
    # Step 5: Send to server
    response = make_request("POST", "/auth/cli-login", {"access_token": token_response["access_token"]})
    
    if response and response.status_code == 200:
        data = response.json()
        store_token(data["token"], data["user"])
        print_success("Logged into NSU Audit System!")
        
        if not data["user"]["email"].endswith("@northsouth.edu"):
            print_warning("Note: Only @northsouth.edu emails can use this system")
    elif response:
        print_error(f"Server error: {response.json().get('error', 'Unknown error')}")
        sys.exit(1)
    else:
        sys.exit(1)


@cli.command()
def status():
    """Check authentication status"""
    token = get_stored_token()
    user = get_stored_user()
    
    if token and user:
        print_success("Authenticated")
        print_info(f"Name: {user.get('name', 'N/A')}")
        print_info(f"Email: {user.get('email', 'N/A')}")
        
        # Verify token is still valid
        response = make_request("GET", "/api-history", auth_token=token)
        if response and response.status_code == 200:
            print_success("Token is valid")
        else:
            print_warning("Token may be expired. Please login again.")
    else:
        print_warning("Not authenticated")
        print_info("Run 'python cli.py login' to authenticate")


@cli.command()
def logout():
    """Logout and clear stored credentials"""
    clear_credentials()
    print_success("Logged out successfully")


@cli.command()
@click.option("--image", "-i", type=click.Path(exists=True), help="Path to transcript image")
@click.option("--email", "-e", type=str, help="NSU email (e.g., user@northsouth.edu)")
def run(image, email):
    """Run full sequence: upload > audit > result"""
    import base64
    import os
    
    # Prompt for email if not provided
    if not email:
        email = input("Enter your NSU email (@northsouth.edu): ").strip()
    
    # Validate email
    if not email.endswith("@northsouth.edu"):
        print_error("Only @northsouth.edu emails are allowed!")
        sys.exit(1)
    
    print_success(f"Email verified: {email}")
    
    # Generate API key for this session
    print_info("Authenticating...")
    response = make_request("POST", "/generate-key", {"name": email.split('@')[0]})
    if response and response.status_code == 200:
        data = response.json()
        token = data["apiKey"]
        print_success(f"Authenticated as: {email}")
    else:
        print_error("Failed to authenticate")
        sys.exit(1)
    
    # Step 2: Upload and process
    if not image:
        print_info("No image provided, using demo data...")
        image_b64 = None
    else:
        print_info(f"Uploading: {image}")
        ext = os.path.splitext(image)[1].lower()
        mime_type = "image/png" if ext == ".png" else "image/jpeg"
        
        with open(image, "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
            image_b64 = f"data:{mime_type};base64,{image_data}"
    
    # Step 3: Process transcript (creates API history entry)
    print_info("Processing transcript...")
    response = make_request("POST", "/process-transcript", 
        {"image": image_b64} if image_b64 else {},
        token)
    
    if response and response.status_code == 200:
        data = response.json()
        # Step 4: Display result
        display_result(data)
    elif response:
        print_error(f"Processing failed: {response.json().get('error', 'Unknown error')}")
        sys.exit(1)
    else:
        print_error("Failed to connect to server")
        sys.exit(1)


@cli.command()
def test():
    """Run 3-level audit tests (triggers all 3 tests via async endpoint)"""
    token = get_stored_token()
    
    print_info("Running 3-Level Audit Tests...\n")
    
    tests = [
        {
            "name": "TEST 1: VALID GRADUATE",
            "description": "40 courses, 122 credits, CGPA 3.43 - Should PASS",
            "courses": [
                {"code": "ACT201", "grade": "A-", "credits": 3, "semester": "Spring 2007"},
                {"code": "ENG102", "grade": "B+", "credits": 3, "semester": "Spring 2007"},
                {"code": "MIS101", "grade": "B+", "credits": 3, "semester": "Spring 2007"},
                {"code": "ACT201", "grade": "A-", "credits": 3, "semester": "Summer 2007"},
                {"code": "BUS101", "grade": "A-", "credits": 3, "semester": "Summer 2007"},
                {"code": "MIS201", "grade": "A", "credits": 3, "semester": "Summer 2007"},
                {"code": "ACT202", "grade": "B-", "credits": 3, "semester": "Fall 2007"},
                {"code": "MGT210", "grade": "A", "credits": 3, "semester": "Fall 2007"},
                {"code": "ECO172", "grade": "B+", "credits": 3, "semester": "Spring 2008"},
                {"code": "ENG103", "grade": "A+", "credits": 3, "semester": "Spring 2008"},
                {"code": "MKT202", "grade": "A-", "credits": 3, "semester": "Spring 2008"},
                {"code": "ECO164", "grade": "B+", "credits": 3, "semester": "Fall 2008"},
                {"code": "ECO134", "grade": "B+", "credits": 3, "semester": "Fall 2008"},
                {"code": "ECO173", "grade": "B-", "credits": 3, "semester": "Fall 2008"},
                {"code": "FIN254", "grade": "B+", "credits": 3, "semester": "Fall 2008"},
                {"code": "LAW200", "grade": "B", "credits": 3, "semester": "Fall 2008"},
                {"code": "ACT330", "grade": "C", "credits": 3, "semester": "Fall 2009"},
                {"code": "BUS251", "grade": "B-", "credits": 3, "semester": "Fall 2009"},
                {"code": "FIN433", "grade": "B+", "credits": 3, "semester": "Fall 2009"},
                {"code": "BIO103", "grade": "A", "credits": 3, "semester": "Spring 2010"},
                {"code": "BUS401", "grade": "B", "credits": 3, "semester": "Spring 2010"},
                {"code": "FIN435", "grade": "B+", "credits": 3, "semester": "Spring 2010"},
                {"code": "MGT314", "grade": "B", "credits": 3, "semester": "Spring 2010"},
                {"code": "ENG105", "grade": "B+", "credits": 3, "semester": "Summer 2010"},
                {"code": "FIN599A", "grade": "A", "credits": 3, "semester": "Summer 2010"},
                {"code": "ACT322", "grade": "A", "credits": 3, "semester": "Fall 2010"},
                {"code": "BUS498", "grade": "B+", "credits": 4, "semester": "Spring 2011"},
                {"code": "MGT101", "grade": "A-", "credits": 3, "semester": "Spring 2007"},
                {"code": "ECO101", "grade": "B+", "credits": 3, "semester": "Fall 2007"},
                {"code": "MKT101", "grade": "B", "credits": 3, "semester": "Spring 2008"},
                {"code": "LAW101", "grade": "B+", "credits": 3, "semester": "Summer 2008"},
                {"code": "FIN101", "grade": "A", "credits": 3, "semester": "Fall 2008"},
                {"code": "ACT101", "grade": "A-", "credits": 3, "semester": "Spring 2009"},
                {"code": "BUS301", "grade": "B+", "credits": 3, "semester": "Fall 2009"},
                {"code": "MGT401", "grade": "A", "credits": 3, "semester": "Spring 2010"},
                {"code": "FIN501", "grade": "B+", "credits": 3, "semester": "Summer 2010"},
                {"code": "ECO301", "grade": "B", "credits": 3, "semester": "Fall 2010"},
                {"code": "MKT301", "grade": "A-", "credits": 3, "semester": "Spring 2011"},
                {"code": "BUS399", "grade": "A", "credits": 4, "semester": "Summer 2011"},
                {"code": "FIN599B", "grade": "A", "credits": 3, "semester": "Fall 2011"}
            ]
        },
        {
            "name": "TEST 2: CREDIT DEFICIT",
            "description": "20 courses, 60 credits - Should FAIL (deficit)",
            "courses": [
                {"code": "ACT201", "grade": "A", "credits": 3, "semester": "Spring 2007"},
                {"code": "ENG102", "grade": "B+", "credits": 3, "semester": "Spring 2007"},
                {"code": "MIS101", "grade": "B", "credits": 3, "semester": "Spring 2007"},
                {"code": "ACT202", "grade": "A-", "credits": 3, "semester": "Summer 2007"},
                {"code": "BUS101", "grade": "B+", "credits": 3, "semester": "Summer 2007"},
                {"code": "MGT210", "grade": "A", "credits": 3, "semester": "Fall 2007"},
                {"code": "ECO172", "grade": "B", "credits": 3, "semester": "Spring 2008"},
                {"code": "ENG103", "grade": "A-", "credits": 3, "semester": "Spring 2008"},
                {"code": "MKT202", "grade": "B+", "credits": 3, "semester": "Spring 2008"},
                {"code": "ECO164", "grade": "B", "credits": 3, "semester": "Fall 2008"},
                {"code": "FIN254", "grade": "A", "credits": 3, "semester": "Fall 2008"},
                {"code": "LAW200", "grade": "B+", "credits": 3, "semester": "Fall 2008"},
                {"code": "ACT330", "grade": "B-", "credits": 3, "semester": "Fall 2009"},
                {"code": "FIN433", "grade": "A", "credits": 3, "semester": "Fall 2009"},
                {"code": "BIO103", "grade": "A", "credits": 3, "semester": "Spring 2010"},
                {"code": "BUS401", "grade": "B+", "credits": 3, "semester": "Spring 2010"},
                {"code": "FIN435", "grade": "A-", "credits": 3, "semester": "Spring 2010"},
                {"code": "MGT314", "grade": "B", "credits": 3, "semester": "Spring 2010"},
                {"code": "ENG105", "grade": "B+", "credits": 3, "semester": "Summer 2010"},
                {"code": "FIN599A", "grade": "A", "credits": 3, "semester": "Summer 2010"}
            ]
        },
        {
            "name": "TEST 3: LOW CGPA",
            "description": "40 courses, 120 credits, CGPA 1.5 - Should FAIL (CGPA)",
            "courses": [
                {"code": f"CRS{i}", "grade": "D" if i % 2 == 0 else "C", "credits": 3, "semester": "Spring 2020"}
                for i in range(40)
            ]
        }
    ]
    
    # If logged in, use async endpoint; otherwise use sync
    auth = {"token": token} if token else {}
    
    for test in tests:
        print(f"\n{test['name']}")
        print("-" * 50)
        print(test["description"])
        
        if token:
            # Use async endpoint
            response = make_request("POST", "/process-transcript-async", {"courses": test["courses"]}, token)
            if response and response.status_code == 200:
                job_id = response.json().get("jobId")
                print_info(f"Job ID: {job_id}")
                
                # Poll for result
                while True:
                    time.sleep(1)
                    status_response = requests.get(f"{SERVER_URL}/job/{job_id}", headers={"Authorization": f"Bearer {token}"}, timeout=10)
                    if status_response.status_code == 200:
                        job_data = status_response.json()
                        if job_data.get("status") == "completed":
                            data = job_data["result"]
                            print(f"Result: {data['result']}")
                            print(f"CGPA: {data['audit']['level2']['cgpa']}")
                            print(f"Credits: {data['audit']['level1']['totalCredits']}")
                            
                            test1_pass = test["name"].startswith("TEST 1") and data["result"] == "GRADUATED"
                            test2_pass = test["name"].startswith("TEST 2") and data["result"] == "NOT GRADUATED"
                            test3_pass = test["name"].startswith("TEST 3") and data["result"] == "NOT GRADUATED"
                            
                            if test1_pass or test2_pass or test3_pass:
                                print_success("PASSED")
                            else:
                                print_error("FAILED - Expected different result")
                            break
                        elif job_data.get("status") == "failed":
                            print_error(f"Error: {job_data.get('error')}")
                            break
            else:
                # Use sync endpoint (no auth)
                response = make_request("POST", "/process-transcript", {"courses": test["courses"]})
            
            if response and response.status_code == 200:
                data = response.json()
                print(f"Result: {data['result']}")
                print(f"CGPA: {data['audit']['level2']['cgpa']}")
                print(f"Credits: {data['audit']['level1']['totalCredits']}")
                
                test1_pass = test["name"].startswith("TEST 1") and data["result"] == "GRADUATED"
                test2_pass = test["name"].startswith("TEST 2") and data["result"] == "NOT GRADUATED"
                test3_pass = test["name"].startswith("TEST 3") and data["result"] == "NOT GRADUATED"
                
                if test1_pass or test2_pass or test3_pass:
                    print_success("PASSED")
                else:
                    print_error("FAILED - Expected different result")
            elif response:
                print_error(f"Error: {response.json().get('error', 'Unknown error')}")
            else:
                print_error("Could not connect to server")
                break
    
    print(f"\n[*] All tests complete!\n")


@cli.command()
def history():
    """View your API history"""
    # Get stored credentials
    api_key = get_stored_token()
    user = get_stored_user()
    
    if not api_key:
        print_error("Not authenticated. Run 'python cli.py run' first.")
        sys.exit(1)
    
    print_info(f"Fetching history for: {user.get('email') if user else api_key[:8]}...")
    
    # Use stored API key
    response = make_request("GET", "/api-history", None, api_key)
    
    if response and response.status_code == 200:
        data = response.json()
        history = data.get("history", [])
        
        if not history:
            print_info("No API history found.")
            return
        
        print(f"\n{'='*60}")
        print(f"{'YOUR API HISTORY':^60}")
        print(f"{'='*60}")
        print(f"{'#':<4} {'Endpoint':<35} {'Status':<10} {'Timestamp':<20}")
        print(f"{'-'*60}")
        
        for i, h in enumerate(history, 1):
            endpoint = h.get('endpoint', '')
            status = h.get('status', '')
            timestamp = h.get('timestamp', '')
            ts = timestamp[:19].replace('T', ' ') if timestamp else 'N/A'
            
            status_color = '\033[92m' if status == 'success' else '\033[91m'
            reset = '\033[0m'
            
            print(f"{i:<4} {endpoint:<35} {status_color}{status:<10}{reset} {ts}")
        
        print(f"{'='*60}")
        print(f"Total: {len(history)} API calls\n")
    elif response:
        print_error(f"Error: {response.json().get('error', 'Unknown error')}")
    else:
        print_error("Could not connect to server")


@cli.command()
def certificates():
    """View your previous certificates"""
    api_key = get_stored_token()
    user = get_stored_user()
    
    if not api_key:
        print_error("Not authenticated. Run 'python cli.py run' first.")
        sys.exit(1)
    
    print_info("Fetching certificates...")
    
    response = make_request("GET", "/certificates", None, api_key)
    
    if response and response.status_code == 200:
        data = response.json()
        certs = data.get("certificates", [])
        
        if not certs:
            print_info("No certificates found.")
            return
        
        print(f"\n{'='*60}")
        print(f"{'YOUR CERTIFICATES':^60}")
        print(f"{'='*60}")
        print(f"{'#':<4} {'Filename':<40} {'Date':<20}")
        print(f"{'-'*60}")
        
        for i, cert in enumerate(certs, 1):
            ts = cert.get('timestamp', '')[:10] if cert.get('timestamp') else 'N/A'
            print(f"{i:<4} {cert.get('filename', ''):<40} {ts:<20}")
        
        print(f"{'='*60}")
        print(f"Total: {len(certs)} certificates\n")
    elif response:
        print_error(f"Error: {response.json().get('error', 'Unknown error')}")
    else:
        print_error("Could not connect to server")


def display_result(data):
    """Display audit result"""
    print(f"\n{'='*50}")
    print(f"{'NSU AUDIT RESULT':^50}")
    print(f"{'='*50}")
    print(f"Student: {data.get('student', {}).get('name', 'N/A')}")
    print(f"ID:      {data.get('student', {}).get('id', 'N/A')}")
    print(f"Status:  {data.get('result', 'N/A')}")
    print(f"{'='*50}")
    print(f"Level 1: Credits")
    print(f"  Total Credits: {data['audit']['level1']['totalCredits']}")
    print(f"  Valid Courses: {data['audit']['level1']['valid']}")
    print(f"{'='*50}")
    print(f"Level 2: CGPA")
    print(f"  CGPA:   {data['audit']['level2']['cgpa']}")
    print(f"  Credits: {data['audit']['level2']['credits']}")
    print(f"{'='*50}")
    print(f"Level 3: Eligibility")
    print(f"  Eligible:   {'YES' if data['audit']['level3']['eligible'] else 'NO'}")
    print(f"  Deficit:    {data['audit']['level3']['creditDeficit']}")
    print(f"{'='*50}")
    
    # Display course list
    courses = data.get('courses', [])
    if courses:
        print(f"\n{'='*50}")
        print(f"{'COURSE LIST (' + str(len(courses)) + ')':^50}")
        print(f"{'='*50}")
        print(f"{'Code':<12} {'Grade':<6} {'Credits':<8} {'Semester':<15}")
        print(f"{'-'*50}")
        for c in courses:
            print(f"{c.get('code', ''):<12} {c.get('grade', ''):<6} {c.get('credits', ''):<8} {c.get('semester', ''):<15}")
    
    print(f"{'='*50}\n")


if __name__ == "__main__":
    cli()
