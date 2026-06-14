from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY           = os.getenv("SECRET_KEY")
ALGORITHM            = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 8


def create_token(data: dict):
    payload              = data.copy()
    expire               = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload["exp"]       = int(expire.timestamp())
    token                = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token if isinstance(token, str) else token.decode("utf-8")


def decode_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("user_id")
        if user_id is None:
            return None
        return payload
    except JWTError:
        return None