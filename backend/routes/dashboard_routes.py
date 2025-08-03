from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.all_models import User, UserRole
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import jwt
from typing import Optional

router = APIRouter()
security = HTTPBearer()

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
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token verification failed")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """الحصول على المستخدم الحالي من JWT token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = credentials.credentials
    payload = verify_jwt_token(token)
    
    # Get user from database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    try:
        user = await db.users.find_one({"id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    finally:
        client.close()

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """احصائيات لوحة التحكم - Dashboard Statistics"""
    user = current_user
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    try:
        # Basic statistics - Enhanced with all system entities
        total_users = await db.users.count_documents({})
        total_clinics = await db.clinics.count_documents({})
        total_visits = await db.visits.count_documents({})
        total_orders = await db.orders.count_documents({})
        total_products = await db.products.count_documents({})  # Added
        total_warehouses = await db.warehouses.count_documents({})  # Added
        total_doctors = await db.doctors.count_documents({})  # Added
        total_lines = await db.lines.count_documents({})  # Added
        total_areas = await db.areas.count_documents({})  # Added
        
        # Financial statistics
        total_debt_records = await db.debt_records.count_documents({}) if await db.list_collection_names().__contains__("debt_records") else 0
        total_invoices = await db.invoices.count_documents({}) if await db.list_collection_names().__contains__("invoices") else 0
        
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