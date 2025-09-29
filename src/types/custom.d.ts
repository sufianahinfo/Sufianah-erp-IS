// Type declarations for modules without type definitions

// Label Printing Types
export interface LabelTemplate {
  id: string
  name: string
  type: 'product' | 'price' | 'barcode' | 'custom'
  size: {
    width: number // in mm
    height: number // in mm
  }
  layout: {
    showProductName: boolean
    showPrice: boolean
    showBarcode: boolean
    showQRCode: boolean
    showArabicName: boolean
    showUrduName: boolean
    fontSize: number
    fontFamily: string
    textAlign: 'left' | 'center' | 'right'
    margin: {
      top: number
      right: number
      bottom: number
      left: number
    }
  }
  printerSettings: {
    printerType: 'zebra' | 'brother' | 'dymo' | 'generic'
    dpi: number
    printSpeed: number
    darkness: number
  }
  createdAt: string
  updatedAt: string
}

export interface LabelPrintJob {
  id: string
  templateId: string
  productId: string
  quantity: number
  status: 'pending' | 'printing' | 'completed' | 'failed'
  printerName?: string
  createdAt: string
  completedAt?: string
  error?: string
}

export interface PrinterConfig {
  id: string
  name: string
  type: 'zebra' | 'brother' | 'dymo' | 'generic'
  connection: 'usb' | 'network' | 'bluetooth'
  address?: string
  isDefault: boolean
  settings: {
    dpi: number
    printSpeed: number
    darkness: number
    paperSize: string
  }
}

// Multi-Store/Branch Management Types
export interface Branch {
  id: string
  name: string
  code: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  contact: {
    phone: string
    email: string
    manager: string
  }
  settings: {
    currency: string
    timezone: string
    isActive: boolean
    isDefault: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface BranchTransfer {
  id: string
  fromBranchId: string
  toBranchId: string
  productId: string
  quantity: number
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled'
  requestedBy: string
  approvedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface BranchInventory {
  id: string
  branchId: string
  productId: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  lastUpdated: string
}

// Advanced Inventory Types
export interface Batch {
  id: string
  productId: string
  batchNumber: string
  lotNumber?: string
  quantity: number
  expiryDate?: string
  manufacturingDate?: string
  supplier?: string
  cost: number
  status: 'active' | 'expired' | 'recalled' | 'sold'
  createdAt: string
  updatedAt: string
}

export interface WarehouseLocation {
  id: string
  name: string
  code: string
  address: string
  capacity: number
  currentStock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductAssembly {
  id: string
  productId: string
  componentId: string
  quantity: number
  unit: string
  createdAt: string
  updatedAt: string
}

export interface ReorderRule {
  id: string
  productId: string
  minQuantity: number
  maxQuantity: number
  reorderPoint: number
  reorderQuantity: number
  supplierId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryTransfer {
  id: string
  fromLocation: string
  toLocation: string
  productId: string
  quantity: number
  batchId?: string
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled'
  requestedBy: string
  approvedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface ProductValuation {
  id: string
  productId: string
  method: 'fifo' | 'lifo' | 'average' | 'standard'
  cost: number
  lastUpdated: string
}

// Pricing & Promotions Types
export interface PriceList {
  id: string
  name: string
  description: string
  type: 'customer' | 'product' | 'category' | 'volume'
  isActive: boolean
  validFrom: string
  validTo?: string
  createdAt: string
  updatedAt: string
}

export interface PriceListItem {
  id: string
  priceListId: string
  productId: string
  customerId?: string
  categoryId?: string
  minQuantity?: number
  maxQuantity?: number
  price: number
  discountPercentage?: number
  discountAmount?: number
  createdAt: string
  updatedAt: string
}

export interface DiscountTier {
  id: string
  name: string
  description: string
  type: 'percentage' | 'fixed' | 'buy_x_get_y'
  value: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  applicableProducts?: string[]
  applicableCategories?: string[]
  isActive: boolean
  validFrom: string
  validTo?: string
  createdAt: string
  updatedAt: string
}

export interface LoyaltyProgram {
  id: string
  name: string
  description: string
  pointsPerDollar: number
  pointsPerPurchase: number
  redemptionRate: number // Points per dollar for redemption
  tiers: {
    name: string
    minPoints: number
    multiplier: number
    benefits: string[]
  }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerLoyalty {
  id: string
  customerId: string
  programId: string
  currentPoints: number
  totalEarned: number
  totalRedeemed: number
  currentTier: string
  joinedAt: string
  lastActivity: string
}

export interface PromotionalCampaign {
  id: string
  name: string
  description: string
  type: 'discount' | 'bogo' | 'free_shipping' | 'gift_with_purchase'
  discountType: 'percentage' | 'fixed' | 'free_item'
  discountValue: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  applicableProducts?: string[]
  applicableCategories?: string[]
  isActive: boolean
  validFrom: string
  validTo: string
  usageLimit?: number
  currentUsage: number
  createdAt: string
  updatedAt: string
}

// Employee Ledger Types
export interface EmployeeLedgerEntry {
  id: string
  employeeId: string
  employeeName: string
  type: 'salary' | 'advance' | 'bonus' | 'commission' | 'deduction' | 'refund'
  amount: number
  description: string
  date: string
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  approvedBy?: string
  paidDate?: string
  reference?: string
  createdAt: string
  updatedAt: string
}

export interface EmployeeAdvance {
  id: string
  employeeId: string
  employeeName: string
  amount: number
  reason: string
  requestedDate: string
  approvedDate?: string
  paidDate?: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  approvedBy?: string
  repaymentPlan?: {
    installments: number
    monthlyAmount: number
    startDate: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SalespersonBonus {
  id: string
  employeeId: string
  employeeName: string
  period: string // e.g., "2024-01"
  salesTarget: number
  actualSales: number
  bonusRate: number
  bonusAmount: number
  status: 'pending' | 'approved' | 'paid'
  approvedBy?: string
  paidDate?: string
  createdAt: string
  updatedAt: string
}

// Supplier Ledger Types
export interface SupplierLedgerEntry {
  id: string
  supplierId: string
  supplierName: string
  type: 'purchase' | 'payment' | 'return' | 'adjustment' | 'refund'
  amount: number
  description: string
  date: string
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  reference?: string
  invoiceNumber?: string
  createdAt: string
  updatedAt: string
}

// Custom Inventory Types
export interface CustomProduct {
  id: string
  name: string
  code: string
  category: string
  subcategory?: string
  description?: string
  fabricType?: string
  size?: string
  color?: string
  brand?: string
  purchaseCost: number
  minSalePrice: number
  maxSalePrice: number
  currentPrice: number
  stock: number
  minStock: number
  maxStock: number
  supplier?: string
  batchInfo?: string
  status: "active" | "inactive" | "discontinued"
  images?: string[]
  tags?: string[]
  createdBy: string
  createdDate: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  parentId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Add any other missing type declarations here
