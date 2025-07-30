from fastapi import APIRouter, HTTPException, Depends
from models.all_models import User, UserLogin, UserRole
import hashlib
import jwt
from datetime import datetime, timedelta

router = APIRouter()

# JWT Configuration (should be imported from main server)
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "username": user_data["username"],
        "role": user_data["role"],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

@router.post("/auth/login")
async def login(user_data: UserLogin):
    """تسجيل الدخول - User Login"""
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    # Database connection (should be shared from main server)
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    user = await db.users.find_one({"username": user_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not hash_password(user_data.password) == user["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    # Normalize role
    user["role"] = UserRole.normalize_role(user["role"])
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"last_login": datetime.utcnow()},
            "$inc": {"login_count": 1}
        }
    )
    
    # Create JWT token
    token = create_jwt_token(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"],
            "email": user.get("email"),
            "phone": user.get("phone")
        }
    }

@router.post("/auth/logout")
async def logout():
    """تسجيل الخروج - User Logout"""
    return {"message": "Logged out successfully"}