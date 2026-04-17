from typing import List, Dict, Any


def get_api_history(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get API call history.
    
    Args:
        limit: Maximum number of entries to return (default: 10)
    
    Returns:
        List of API history entries
    """
    from ..services.history import HistoryService
    
    return HistoryService.get_recent(limit)


def get_user_history(user: str) -> List[Dict[str, Any]]:
    """
    Get history for a specific user.
    
    Args:
        user: User identifier (email or ID)
    
    Returns:
        List of user's API history entries
    """
    from ..services.history import HistoryService
    
    return HistoryService.get_by_user(user)


def get_recent_history(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent API history.
    
    Args:
        limit: Maximum number of entries (default: 10)
    
    Returns:
        List of recent entries
    """
    from ..services.history import HistoryService
    
    return HistoryService.get_recent(limit)