# Import all models from different modules
from .user_models import *
from .organization_models import *
from .clinic_models import *
from .order_models import *
from .visit_models import *
from .warehouse_models import *
# from .financial_models import *  # Temporarily disabled due to Pydantic validator issues
from .support_models import *
from .movement_models import *
from .system_models import *
from .geographic_models import *

# Export all models for easy import
__all__ = [
    # User Models
    'UserRole', 'User', 'UserCreate', 'UserUpdate', 'UserLogin', 'UserPerformanceStats',
    
    # Organization Models
    'Line', 'Area', 'District', 'Region', 'AreaCreate', 'RegionCreate', 'DistrictCreate', 'LineManagementCreate',
    
    # Geographic Models (New)
    'LineBase', 'LineCreate', 'Line', 'AreaBase', 'AreaCreate', 'Area', 'DistrictBase', 'DistrictCreate', 'District',
    'LineProductAssignment', 'LineUserAssignment', 'GeographicStatistics',
    
    # Clinic Models
    'ClinicClassification', 'Clinic', 'ClinicCreate', 'ClinicRequest', 'ClinicRequestCreate', 'Doctor', 'DoctorCreate',
    
    # Order Models
    'OrderEnhanced', 'OrderCreate', 'OrderItem', 'OrderWorkflow', 'Order',
    
    # Visit Models
    'Visit', 'VisitCreate', 'VoiceNote',
    
    # Warehouse Models
    'Warehouse', 'WarehouseCreate', 'Product', 'ProductCreate', 'ProductStock', 'StockMovement', 'StockMovementCreate',
    
    # Financial Models (Enhanced Phase 2) - Temporarily disabled
    # 'DebtStatus', 'CollectionStatus', 'PaymentMethod', 
    # 'DebtRecord', 'CollectionRecord', 'PaymentPlan', 'DebtSummary', 'CollectionSummary',
    # 'DebtRecordCreate', 'CollectionRecordCreate', 'PaymentPlanCreate',
    # 'Invoice', 'PaymentRecord', 'InvoiceItem', 'ClinicDebt',
    
    # Support Models
    'SupportTicket', 'SupportTicketCreate', 'SupportTicketUpdate', 'SupportResponse',
    
    # Movement Models
    'MovementLog', 'MovementLogCreate', 'MovementLogFilter',
    
    # System Models
    'SystemSettings', 'SystemLog', 'Notification', 'ApprovalRequest', 'ApprovalAction'
]