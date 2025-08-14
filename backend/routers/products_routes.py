#!/usr/bin/env python3
"""
Products management routes for Medical Management System
نظام إدارة المنتجات للنظام الطبي المتكامل
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
import os
import jwt
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import uuid
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration  
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Create router
router = APIRouter(prefix="/api", tags=["products"])

# Product Models
class Product(BaseModel):
    id: str
    name: str
    code: str
    brand: str  # تغيير من category إلى brand
    description: Optional[str] = None
    price: float
    cost: Optional[float] = None
    unit: str = "قطعة"
    stock_quantity: int = 0
    minimum_stock: int = 10
    maximum_stock: int = 1000
    is_active: bool = True
    created_at: str
    updated_at: str
    created_by: str
    updated_by: Optional[str] = None
    
    # حقول إضافية للنظام الطبي
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = None
    supplier_info: Optional[Dict[str, Any]] = None
    medical_category: Optional[str] = None
    requires_prescription: bool = False

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    brand: str = Field(..., min_length=1, max_length=100)  # تغيير من category
    description: Optional[str] = Field(None, max_length=1000)
    price: float = Field(..., gt=0)
    cost: Optional[float] = Field(None, gt=0)
    unit: str = Field(default="قطعة", max_length=20)
    stock_quantity: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=10, ge=0)
    maximum_stock: int = Field(default=1000, ge=1)
    
    # حقول إضافية للنظام الطبي
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = None
    supplier_info: Optional[Dict[str, Any]] = None
    medical_category: Optional[str] = None
    requires_prescription: bool = False

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    brand: Optional[str] = Field(None, min_length=1, max_length=100)  # تغيير من category
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, gt=0)
    cost: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, max_length=20)
    stock_quantity: Optional[int] = Field(None, ge=0)
    minimum_stock: Optional[int] = Field(None, ge=0)
    maximum_stock: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None
    
    # حقول إضافية للنظام الطبي
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = None
    supplier_info: Optional[Dict[str, Any]] = None
    medical_category: Optional[str] = None
    requires_prescription: Optional[bool] = None

def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = verify_jwt_token(token)
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# Helper function to get stock status
def get_stock_status(stock_quantity: int, minimum_stock: int) -> str:
    """Get stock status based on quantity"""
    if stock_quantity == 0:
        return "out_of_stock"
    elif stock_quantity <= minimum_stock:
        return "critical"
    elif stock_quantity <= minimum_stock * 2:
        return "low"
    else:
        return "good"

# Sample data creation function
async def ensure_sample_products():
    """Create sample products if none exist"""
    products_count = await db.products.count_documents({})
    if products_count == 0:
        sample_products = [
            {
                "id": "prod-panadol-500mg",
                "name": "بانادول 500 مجم",
                "code": "PAN500",
                "brand": "GSK",
                "description": "مسكن للآلام وخافض للحرارة",
                "price": 15.50,
                "cost": 12.00,
                "unit": "علبة",
                "stock_quantity": 150,
                "minimum_stock": 20,
                "maximum_stock": 500,
                "is_active": True,
                "medical_category": "مسكنات الألم",
                "requires_prescription": False,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "created_by": "admin-001"
            },
            {
                "id": "prod-augmentin-1gm",
                "name": "أوجمنتين 1 جرام",
                "code": "AUG1GM",
                "brand": "GSK",
                "description": "مضاد حيوي واسع المجال",
                "price": 45.00,
                "cost": 38.00,
                "unit": "علبة",
                "stock_quantity": 8,  # مخزون منخفض
                "minimum_stock": 15,
                "maximum_stock": 200,
                "is_active": True,
                "medical_category": "مضادات حيوية",
                "requires_prescription": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "created_by": "admin-001"
            },
            {
                "id": "prod-insulin-lantus",
                "name": "لانتوس إنسولين",
                "code": "LANTUS",
                "brand": "Sanofi",
                "description": "إنسولين طويل المفعول لعلاج السكري",
                "price": 320.00,
                "cost": 280.00,
                "unit": "قلم",
                "stock_quantity": 25,
                "minimum_stock": 10,
                "maximum_stock": 100,
                "is_active": True,
                "medical_category": "أدوية السكري",
                "requires_prescription": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "created_by": "admin-001"
            },
            {
                "id": "prod-vitamins-centrum",
                "name": "فيتامينات سنتروم",
                "code": "CENTRUM",
                "brand": "Pfizer",
                "description": "مكمل غذائي متعدد الفيتامينات",
                "price": 85.00,
                "cost": 68.00,
                "unit": "علبة",
                "stock_quantity": 0,  # نفد من المخزون
                "minimum_stock": 25,
                "maximum_stock": 300,
                "is_active": True,
                "medical_category": "مكملات غذائية",
                "requires_prescription": False,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "created_by": "admin-001"
            }
        ]
        
        await db.products.insert_many(sample_products)
        print("✅ تم إنشاء منتجات نموذجية للنظام")

# Routes

@router.get("/products", response_model=List[Dict[str, Any]])
async def get_products(
    current_user: dict = Depends(get_current_user),
    search: Optional[str] = Query(None, description="البحث في اسم المنتج أو الكود"),
    brand: Optional[str] = Query(None, description="تصفية حسب البراند"),
    medical_category: Optional[str] = Query(None, description="تصفية حسب الفئة الطبية"),
    stock_status: Optional[str] = Query(None, description="تصفية حسب حالة المخزون"),
    is_active: Optional[bool] = Query(None, description="تصفية حسب حالة النشاط"),
    skip: int = Query(0, ge=0, description="عدد العناصر المتجاهلة"),
    limit: int = Query(100, ge=1, le=1000, description="الحد الأقصى للعناصر المسترجعة")
):
    """Get all products with filtering and pagination"""
    try:
        # Ensure sample data exists
        await ensure_sample_products()
        
        # Build query filter
        query = {}
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"code": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        if brand:
            # Search in both 'brand' and 'category' fields for compatibility
            query["$or"] = query.get("$or", []) + [
                {"brand": {"$regex": brand, "$options": "i"}},
                {"category": {"$regex": brand, "$options": "i"}}
            ]
        
        if medical_category:
            query["medical_category"] = {"$regex": medical_category, "$options": "i"}
        
        if is_active is not None:
            query["is_active"] = is_active
        
        # Check if user can see prices based on role
        user_role = current_user.get("role", "")
        can_see_prices = user_role in ["admin", "gm", "accounting", "finance", "manager", "line_manager"]
        
        # Get products from database
        products = []
        async for product in db.products.find(query, {"_id": 0}).skip(skip).limit(limit):
            # Normalize product data for compatibility with both old and new structures
            normalized_product = {
                "id": product.get("id"),
                "name": product.get("name"),
                "code": product.get("code", product.get("id", "")[:8]),  # Use first 8 chars of ID if no code
                "brand": product.get("brand", product.get("category", "Unknown")),  # Map category to brand
                "description": product.get("description", ""),
                "unit": product.get("unit", "قطعة"),
                "stock_quantity": product.get("stock_quantity", product.get("current_stock", 0)),  # Map current_stock
                "minimum_stock": product.get("minimum_stock", 10),
                "maximum_stock": product.get("maximum_stock", 1000),
                "is_active": product.get("is_active", True),
                "created_at": product.get("created_at"),
                "updated_at": product.get("updated_at"),
                "created_by": product.get("created_by"),
                "updated_by": product.get("updated_by"),
                "expiry_date": product.get("expiry_date"),
                "batch_number": product.get("batch_number"),
                "supplier_info": product.get("supplier_info"),
                "medical_category": product.get("medical_category"),
                "requires_prescription": product.get("requires_prescription", False)
            }
            
            # Add price information only if user has permission to see prices
            if can_see_prices:
                normalized_product["price"] = product.get("price", 0)
                normalized_product["cost"] = product.get("cost", 0)
            else:
                # For medical reps and other restricted roles, prices are hidden
                normalized_product["price"] = None
                normalized_product["cost"] = None
            
            # Add stock status
            normalized_product["stock_status"] = get_stock_status(
                normalized_product["stock_quantity"],
                normalized_product["minimum_stock"]
            )
            
            # Filter by stock status if requested
            if stock_status and normalized_product["stock_status"] != stock_status:
                continue
                
            products.append(normalized_product)
        
        return products
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving products: {str(e)}")

@router.post("/products", response_model=Dict[str, Any])
async def create_product(
    product_data: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new product (Admin and GM only)"""
    try:
        # Check permissions - only admin, gm, and line_manager can create products
        if current_user.get("role") not in ["admin", "gm", "line_manager"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to create products"
            )
        
        # Check if product code already exists
        existing_product = await db.products.find_one({"code": product_data.code})
        if existing_product:
            raise HTTPException(
                status_code=400,
                detail=f"Product with code '{product_data.code}' already exists"
            )
        
        # Create new product
        product_id = str(uuid.uuid4())
        new_product = {
            "id": product_id,
            "name": product_data.name,
            "code": product_data.code,
            "brand": product_data.brand,
            "description": product_data.description,
            "price": product_data.price,
            "cost": product_data.cost,
            "unit": product_data.unit,
            "stock_quantity": product_data.stock_quantity,
            "minimum_stock": product_data.minimum_stock,
            "maximum_stock": product_data.maximum_stock,
            "is_active": True,
            "expiry_date": product_data.expiry_date,
            "batch_number": product_data.batch_number,
            "supplier_info": product_data.supplier_info,
            "medical_category": product_data.medical_category,
            "requires_prescription": product_data.requires_prescription,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("user_id", "unknown")
        }
        
        # Insert product into database
        await db.products.insert_one(new_product)
        
        # Add stock status for response
        new_product["stock_status"] = get_stock_status(
            new_product["stock_quantity"],
            new_product["minimum_stock"]
        )
        
        # Return product data without MongoDB _id
        new_product.pop("_id", None)
        new_product["message"] = "Product created successfully"
        
        return new_product
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")

@router.get("/products/{product_id}", response_model=Dict[str, Any])
async def get_product_by_id(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get product by ID"""
    try:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if user can see prices based on role
        user_role = current_user.get("role", "")
        can_see_prices = user_role in ["admin", "gm", "accounting", "finance", "manager", "line_manager"]
        
        # Hide price information for unauthorized roles (like medical_rep)
        if not can_see_prices:
            product["price"] = None
            product["cost"] = None
        
        # Add stock status
        product["stock_status"] = get_stock_status(
            product.get("stock_quantity", 0),
            product.get("minimum_stock", 10)
        )
        
        return product
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving product: {str(e)}")

@router.put("/products/{product_id}", response_model=Dict[str, Any])
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update product (Admin, GM, and line_manager only)"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm", "line_manager"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to update products"
            )
        
        # Check if product exists
        existing_product = await db.products.find_one({"id": product_id})
        if not existing_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if new code conflicts with existing products (if code is being updated)
        if product_data.code and product_data.code != existing_product.get("code"):
            code_conflict = await db.products.find_one({"code": product_data.code, "id": {"$ne": product_id}})
            if code_conflict:
                raise HTTPException(
                    status_code=400,
                    detail=f"Product code '{product_data.code}' already exists"
                )
        
        # Prepare update data
        update_data = {}
        
        # Update only provided fields
        for field, value in product_data.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add metadata
        update_data["updated_at"] = datetime.utcnow().isoformat()
        update_data["updated_by"] = current_user.get("user_id", "unknown")
        
        # Update product
        result = await db.products.update_one(
            {"id": product_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made to product")
        
        # Return updated product
        updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
        
        # Add stock status
        updated_product["stock_status"] = get_stock_status(
            updated_product.get("stock_quantity", 0),
            updated_product.get("minimum_stock", 10)
        )
        
        updated_product["message"] = "Product updated successfully"
        
        return updated_product
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete product (Admin only)"""
    try:
        # Only admin can delete products
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only administrators can delete products"
            )
        
        # Check if product exists
        existing_product = await db.products.find_one({"id": product_id})
        if not existing_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Delete product
        result = await db.products.delete_one({"id": product_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete product")
        
        return {
            "message": "Product deleted successfully",
            "deleted_product_id": product_id,
            "deleted_product_name": existing_product.get("name", "Unknown")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")

@router.get("/products/stats/overview")
async def get_products_stats(current_user: dict = Depends(get_current_user)):
    """Get products overview statistics"""
    try:
        # Ensure sample data exists
        await ensure_sample_products()
        
        # Get total products count
        total_products = await db.products.count_documents({"is_active": True})
        
        # Get active products
        active_products = await db.products.count_documents({"is_active": True})
        
        # Get products with low stock (check both field names for compatibility)
        low_stock_products = await db.products.count_documents({
            "is_active": True,
            "$or": [
                {"$expr": {"$lte": ["$stock_quantity", "$minimum_stock"]}},
                {"$expr": {"$lte": ["$current_stock", 10]}}  # Default minimum for old structure
            ]
        })
        
        # Get out of stock products (check both field names)
        out_of_stock_products = await db.products.count_documents({
            "is_active": True,
            "$or": [
                {"stock_quantity": 0},
                {"current_stock": 0}
            ]
        })
        
        # Get products requiring prescription
        prescription_products = await db.products.count_documents({
            "is_active": True,
            "requires_prescription": True
        })
        
        return {
            "total_products": total_products,
            "active_products": active_products,
            "low_stock_products": low_stock_products,
            "out_of_stock_products": out_of_stock_products,
            "prescription_products": prescription_products,
            "stats_updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting products stats: {str(e)}")

@router.get("/products/brands/list")
async def get_product_brands(current_user: dict = Depends(get_current_user)):
    """Get unique list of product brands"""
    try:
        # Get distinct brands (check both 'brand' and 'category' fields for compatibility)
        brands_new = await db.products.distinct("brand", {"is_active": True})
        brands_old = await db.products.distinct("category", {"is_active": True})
        
        # Combine and deduplicate
        all_brands = list(set(brands_new + brands_old))
        # Filter out None values
        all_brands = [brand for brand in all_brands if brand]
        
        return {
            "brands": sorted(all_brands),
            "total_brands": len(all_brands)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting product brands: {str(e)}")

@router.get("/products/categories/list")
async def get_medical_categories(current_user: dict = Depends(get_current_user)):
    """Get unique list of medical categories"""
    try:
        # Get distinct medical categories
        categories = await db.products.distinct("medical_category", {"is_active": True})
        
        # Filter out None values
        categories = [cat for cat in categories if cat]
        
        return {
            "categories": sorted(categories),
            "total_categories": len(categories)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting medical categories: {str(e)}")

@router.post("/products/{product_id}/stock/adjust")
async def adjust_product_stock(
    product_id: str,
    adjustment_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Adjust product stock quantity"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm", "line_manager"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to adjust stock"
            )
        
        # Get adjustment details
        adjustment_type = adjustment_data.get("type")  # "increase" or "decrease"
        quantity = adjustment_data.get("quantity", 0)
        reason = adjustment_data.get("reason", "Manual adjustment")
        
        if adjustment_type not in ["increase", "decrease"]:
            raise HTTPException(
                status_code=400,
                detail="Adjustment type must be 'increase' or 'decrease'"
            )
        
        if quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Adjustment quantity must be greater than 0"
            )
        
        # Get current product
        product = await db.products.find_one({"id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        current_stock = product.get("stock_quantity", 0)
        
        # Calculate new stock
        if adjustment_type == "increase":
            new_stock = current_stock + quantity
        else:  # decrease
            new_stock = max(0, current_stock - quantity)  # Don't allow negative stock
        
        # Update stock
        await db.products.update_one(
            {"id": product_id},
            {
                "$set": {
                    "stock_quantity": new_stock,
                    "updated_at": datetime.utcnow().isoformat(),
                    "updated_by": current_user.get("user_id", "unknown")
                }
            }
        )
        
        # Log the adjustment (optional - for audit trail)
        stock_log = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "product_name": product.get("name"),
            "adjustment_type": adjustment_type,
            "quantity_adjusted": quantity,
            "stock_before": current_stock,
            "stock_after": new_stock,
            "reason": reason,
            "adjusted_by": current_user.get("user_id", "unknown"),
            "adjusted_at": datetime.utcnow().isoformat()
        }
        
        # Optionally store in stock_adjustments collection
        try:
            await db.stock_adjustments.insert_one(stock_log)
        except:
            pass  # Continue even if logging fails
        
        return {
            "message": f"Stock {adjustment_type}d successfully",
            "product_id": product_id,
            "stock_before": current_stock,
            "stock_after": new_stock,
            "adjustment_quantity": quantity,
            "adjustment_type": adjustment_type,
            "stock_status": get_stock_status(new_stock, product.get("minimum_stock", 10))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adjusting stock: {str(e)}")