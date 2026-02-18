import os

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    token = authorization[7:]

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["sub", "iss", "aud", "exp"]},
            issuer="taskflow-web",
            audience="taskflow-api",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_id
