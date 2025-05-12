from fastapi import Cookie, HTTPException, status
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_session_id(session_id: str | None = Cookie(None)) -> str:
    if not session_id:
        logger.error("No session_id cookie found")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated")
    return session_id