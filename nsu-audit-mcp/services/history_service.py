"""
History Service - API logging + Transcript storage
"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any

HISTORY_FILE = Path(__file__).parent / "api-history.json"
TRANSCRIPTS_FILE = Path(__file__).parent / "transcripts.json"


def load_history():
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except:
            pass
    return []


def save_history(history):
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)


def load_transcripts():
    if TRANSCRIPTS_FILE.exists():
        try:
            with open(TRANSCRIPTS_FILE, "r") as f:
                return json.load(f)
        except:
            pass
    return {}


def save_transcripts(data):
    with open(TRANSCRIPTS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def log(endpoint, user, success=True):
    history = load_history()
    entry = {
        "endpoint": endpoint,
        "user": user or "anonymous",
        "timestamp": datetime.now().isoformat(),
        "status": "success" if success else "failed"
    }
    history.insert(0, entry)
    if len(history) > 100:
        history = history[:100]
    save_history(history)


def get_all():
    return load_history()


def get_by_user(user):
    history = load_history()
    return [h for h in history if h.get("user") == user]


def get_recent(limit=10):
    history = load_history()
    return history[:limit]


def clear():
    save_history([])


# Transcript History Functions

def save_transcript(
    student_id: str,
    student_name: str,
    ocr_data: Dict[str, Any],
    audit_data: Dict[str, Any],
    user: str = "anonymous"
) -> Dict:
    """Save complete transcript data"""
    transcripts = load_transcripts()
    
    timestamp = datetime.now().isoformat()
    entry = {
        "timestamp": timestamp,
        "user": user,
        "student_id": student_id,
        "student_name": student_name,
        "ocr_data": ocr_data,
        "audit_data": audit_data
    }
    
    if student_id not in transcripts:
        transcripts[student_id] = []
    
    transcripts[student_id].insert(0, entry)
    
    if len(transcripts[student_id]) > 50:
        transcripts[student_id] = transcripts[student_id][:50]
    
    save_transcripts(transcripts)
    return entry


def get_transcripts_by_student(student_id: str) -> List[Dict]:
    """Get all transcripts for a student"""
    transcripts = load_transcripts()
    return transcripts.get(student_id, [])


def get_latest_transcript(student_id: str) -> Optional[Dict]:
    """Get most recent transcript for a student"""
    transcripts = load_transcripts()
    student_transcripts = transcripts.get(student_id, [])
    if student_transcripts:
        return student_transcripts[0]
    return None


def get_all_students() -> List[Dict]:
    """Get list of all students with their latest transcript"""
    transcripts = load_transcripts()
    result = []
    for student_id, student_transcripts in transcripts.items():
        if student_transcripts:
            latest = student_transcripts[0]
            result.append({
                "student_id": student_id,
                "student_name": latest.get("student_name", "Unknown"),
                "timestamp": latest.get("timestamp", ""),
                "cgpa": latest.get("audit_data", {}).get("level2", {}).get("cgpa", 0)
            })
    return result