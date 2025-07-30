from fastapi import APIRouter, HTTPException, Depends
from models.all_models import User, UserRole
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import jwt

router = APIRouter()

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

def verify_jwt_token(token: str):
    """التحقق من JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = None):
    """الحصول على المستخدم الحالي من JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    payload = verify_jwt_token(token)
    
    # Get user from database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    user = await db.users.find_one({"id": payload["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@router.get("/dashboard/stats")
async def get_dashboard_stats(authorization: str = None):
    """احصائيات لوحة التحكم - Dashboard Statistics"""
    user = await get_current_user(authorization)
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    try:
        # Basic statistics
        total_users = await db.users.count_documents({})
        total_clinics = await db.clinics.count_documents({})
        total_visits = await db.visits.count_documents({})
        total_orders = await db.orders.count_documents({})
        
        # Today's statistics
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        today_visits = await db.visits.count_documents({
            "created_at": {"$gte": today, "$lt": tomorrow}
        })
        
        today_orders = await db.orders.count_documents({
            "created_at": {"$gte": today, "$lt": tomorrow}
        })
        
        # Role-based statistics
        if user["role"] == "admin":
            # Admin sees everything
            stats = {
                "total_users": total_users,
                "total_clinics": total_clinics,
                "total_visits": total_visits,
                "total_orders": total_orders,
                "today_visits": today_visits,
                "today_orders": today_orders,
                "pending_approvals": await db.orders.count_documents({"status": "PENDING"}),
                "active_reps": await db.users.count_documents({"role": {"$in": ["sales_rep", "medical_rep"]}, "is_active": True})
            }
        else:
            # Other roles see limited statistics
            stats = {
                "total_visits": today_visits,
                "total_orders": today_orders,
                "my_stats": True
            }
        
        return {
            "success": True,
            "data": stats,
            "user_role": user["role"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "data": {
                "total_users": 0,
                "total_clinics": 0,
                "total_visits": 0,
                "total_orders": 0,
                "today_visits": 0,
                "today_orders": 0,
                "pending_approvals": 0,
                "active_reps": 0
            }
        }
    finally:
        if 'client' in locals():
            client.close()