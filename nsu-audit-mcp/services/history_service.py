"""
History Service - API logging
"""
import json
from pathlib import Path
from datetime import datetime

HISTORY_FILE = Path(__file__).parent / "api-history.json"


def load():
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except:
            pass
    return []


def save(history):
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)


def log(endpoint, user, success=True):
    history = load()
    entry = {
        "endpoint": endpoint,
        "user": user or "anonymous",
        "timestamp": datetime.now().isoformat(),
        "status": "success" if success else "failed"
    }
    history.insert(0, entry)
    if len(history) > 100:
        history = history[:100]
    save(history)


def get_all():
    return load()


def get_by_user(user):
    history = load()
    return [h for h in history if h.get("user") == user]


def get_recent(limit=10):
    history = load()
    return history[:limit]


def clear():
    save([])