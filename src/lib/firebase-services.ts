import { ref, push, set, get, update as fbUpdate, remove, onValue, off } from "firebase/database"
import { db } from "./firebase"
import type { 
  EmployeeLedgerEntry, 
  EmployeeAdvance, 
  SalespersonBonus, 
  SupplierLedgerEntry, 
  CustomProduct, 
  ProductCategory 
} from "@/types/custom"

// Re-export types for use in components
export type { 
  EmployeeLedgerEntry, 
  EmployeeAdvance, 
  SalespersonBonus, 
  SupplierLedgerEntry, 
  CustomProduct, 
  ProductCategory 
} from "@/types/custom"

// Helper function to check if Firebase is initialized
const isFirebaseInitialized = () => {
  return typeof window !== 'undefined' && db !== null;
};

// Type definitions
export interface Product {
  id: string
  name: string
  code: string
  fabricType: string
  size: string
  purchaseCost: number
  minSalePrice: number
  maxSalePrice: number
  currentPrice: number
  stock: number
  minStock: number
  maxStock: number
  supplier: string
  batchInfo: string
  status: "active" | "inactive" | "discontinued"
  createdDate: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductPriceHistoryEntry {
  date: string
  purchaseCost: number
  minSalePrice: number
  maxSalePrice: number
  currentPrice: number
}

export interface Supplier {
  id: string
  name: string
  contact: string
  address: string
  balance: number
  createdAt: string
  updatedAt?: string
}

export interface PurchaseItem {
  productId: string
  name: string
  code: string
  quantity: number
  unitPrice: number
  subtotal: number
  fabricType?: string
  size?: string
}

export interface Purchase {
  id: string
  invoiceNumber: string
  supplierId: string
  supplierName: string
  supplierContact: string
  supplierAddress: string
  items: PurchaseItem[]
  subtotal: number
  discount: number
  totalAmount: number
  createdAt: string
  createdBy: string
  notes?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  joinDate: string
  salary: number
  commission: number
  status: "active" | "inactive" | "on-leave"
  avatar?: string
  address: string
  emergencyContact: string
  bankAccount: string
  cnic: string
  role?: "admin" | "cashier"
  monthlySales: number
  monthlyTarget: number
  attendanceRate: number
  performanceScore: number
  totalSales: number
  totalCommission: number
  createdAt?: string
  updatedAt?: string
}

export interface SaleRecord {
  id: string
  invoiceNumber: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  customerType: "walk-in" | "regular" | "vip"
  items: SaleItem[]
  tradeDiscountItems?: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
  }>
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: "cash" | "card" | "mobile" | "credit"
  paymentStatus: "paid" | "partial" | "pending"
  deliveryStatus: "pickup" | "delivered" | "pending" | "cancelled"
  deliveryType: "pickup" | "delivery"
  deliveryAddress?: string
  deliveryDate?: string
  staffMember: string
  notes: string
  returnStatus: "none" | "partial" | "full"
  createdAt?: string
  updatedAt?: string
}

export interface CustomerReturnRecord {
  id: string
  returnNumber: string
  originalSaleId?: string
  originalInvoiceNumber?: string
  customerName: string
  customerPhone: string
  returnDate: string
  returnTime: string
  items: Array<{
    productId: string
    productName: string
    productCode: string
    quantity: number
    originalPrice: number
    returnReason: string
  }>
  totalAmount: number
  returnType: "manual" | "invoice"
  staffMember: string
  notes: string
  createdAt: string
}

export interface SupplierReturnRecord {
  id: string
  returnNumber: string
  originalPurchaseId?: string
  originalInvoiceNumber?: string
  supplierId: string
  supplierName: string
  supplierContact: string
  supplierAddress?: string
  returnDate: string
  returnTime: string
  items: Array<{
    productId: string
    productName: string
    productCode: string
    quantity: number
    originalPrice: number
    returnReason: string
  }>
  totalAmount: number
  returnType: "manual" | "invoice"
  staffMember: string
  notes: string
  createdAt: string
}

export interface SaleItem {
  id: string
  name: string
  code: string
  quantity: number
  originalPrice: number
  finalPrice: number
  discount: number
}

export interface StockMovement {
  id: string
  itemId: string
  itemName: string
  type: "in" | "out" | "adjustment" | "damaged" | "returned"
  quantity: number
  reason: string
  staff: string
  date: string
  reference: string
  createdAt?: string
  updatedAt?: string
}

export interface CreditEntry {
  id: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate: string
  saleDate: string
  invoiceNumber: string
  status: "pending" | "partial" | "paid" | "overdue"
  paidAmount: number
  remainingAmount: number
  paymentHistory: PaymentRecord[]
  notes: string
  createdAt?: string
  updatedAt?: string
}

export interface DebitEntry {
  id: string
  supplierName: string
  supplierPhone: string
  amount: number
  dueDate: string
  purchaseDate: string
  invoiceNumber: string
  status: "pending" | "partial" | "paid" | "overdue"
  paidAmount: number
  remainingAmount: number
  paymentHistory: PaymentRecord[]
  description: string
  category: string
  createdAt?: string
  updatedAt?: string
}

export interface PaymentRecord {
  id: string
  amount: number
  date: string
  method: string
  reference: string
  notes: string
}

export interface BargainRecord {
  id: string
  date: string
  time: string
  productName: string
  productCode: string
  originalPrice: number
  finalPrice: number
  discountAmount: number
  discountPercentage: number
  customerName?: string
  customerPhone?: string
  staffMember: string
  reason: string
  invoiceNumber: string
  category: string
  profitMargin: number
  status: "approved" | "rejected" | "pending"
  createdAt?: string
  updatedAt?: string
}

export interface DisposalRecord {
  id: string
  itemName: string
  itemCode: string
  category: string
  originalPrice: number
  disposalValue: number
  lossAmount: number
  quantity: number
  disposalDate: string
  reason: string
  condition: "damaged" | "expired" | "defective" | "unsold" | "stolen"
  disposalMethod: "discard" | "donate" | "sell-discount" | "return-supplier" | "recycle"
  approvedBy: string
  notes: string
  photos?: string[]
  batchNumber?: string
  supplierName?: string
  createdAt?: string
  updatedAt?: string
}

export interface DailyExpense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  expenseType: "food" | "beverages" | "utilities" | "maintenance" | "other"
  customerRelated: boolean
  customerName?: string
  customerPhone?: string
  staffMember: string
  paymentMethod: "cash" | "card" | "mobile"
  receiptNumber?: string
  notes: string
  approvedBy?: string
  status: "pending" | "approved" | "rejected"
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  hoursWorked: number
  status: "present" | "absent" | "late" | "half-day"
  notes: string
  createdAt?: string
  updatedAt?: string
}

export interface SalaryRecord {
  id: string
  employeeId: string
  employeeName: string
  month: string
  basicSalary: number
  commission: number
  bonus: number
  deductions: number
  totalSalary: number
  status: "paid" | "pending" | "processing"
  paidDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  customerType: "walk-in" | "regular" | "vip"
  totalPurchases: number
  totalSpent: number
  lastPurchaseDate?: string
  creditLimit: number
  currentCredit: number
  notes: string
  status: "active" | "inactive"
  createdAt?: string
  updatedAt?: string
}

// Generic Firebase CRUD operations
export class FirebaseService {
  // Create
  static async create(path: string, data: Record<string, unknown>): Promise<string | null> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping create operation');
      return null;
    }
    try {
      const newRef = push(ref(db!, path))
      await set(newRef, { ...data, id: newRef.key, createdAt: new Date().toISOString() })
      return newRef.key
    } catch (error) {
      console.error(`Error creating ${path}:`, error)
      throw error
    }
  }

  // Read all with proper typing
  static async getAll<T>(path: string): Promise<T[]> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning empty array');
      return [];
    }
    try {
      const snapshot = await get(ref(db!, path))
      if (snapshot.exists()) {
        const data = snapshot.val()
        return Object.values(data) as T[]
      }
      return []
    } catch (error) {
      console.error(`Error getting ${path}:`, error)
      throw error
    }
  }

  // Read by ID
  static async getById<T>(path: string, id: string): Promise<T | null> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning null');
      return null;
    }
    try {
      const snapshot = await get(ref(db!, `${path}/${id}`))
      return snapshot.exists() ? (snapshot.val() as T) : null
    } catch (error) {
      console.error(`Error getting ${path}/${id}:`, error)
      throw error
    }
  }

  // Update
  static async update(path: string, id: string, data: Record<string, unknown>): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping update operation');
      return;
    }
    try {
      await fbUpdate(ref(db!, `${path}/${id}`), { ...data, updatedAt: new Date().toISOString() })
    } catch (error) {
      console.error(`Error updating ${path}/${id}:`, error)
      throw error
    }
  }

  // Delete
  static async delete(path: string, id: string): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping delete operation');
      return;
    }
    try {
      await remove(ref(db!, `${path}/${id}`))
    } catch (error) {
      console.error(`Error deleting ${path}/${id}:`, error)
      throw error
    }
  }

  // Real-time listener with proper typing
  static subscribe<T>(path: string, callback: (data: T[]) => void): () => void {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning no-op unsubscribe function');
      return () => {};
    }
    const dbRef = ref(db!, path)
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        callback(Object.values(data) as T[])
      } else {
        callback([])
      }
    })
    return () => off(dbRef)
  }
}

// Product Services
export class ProductService extends FirebaseService {
  static async createProduct(product: Omit<Product, "id">): Promise<string | null> {
    return this.create("products", product)
  }

  static async getAllProducts(): Promise<Product[]> {
    return this.getAll<Product>("products")
  }

  static async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    return this.update("products", id, product)
  }

  static async deleteProduct(id: string): Promise<void> {
    return this.delete("products", id)
  }

  static subscribeToProducts(callback: (products: Product[]) => void): () => void {
    return this.subscribe<Product>("products", callback)
  }

  static async getProductPriceHistory(id: string): Promise<ProductPriceHistoryEntry[]> {
    return this.getAll<ProductPriceHistoryEntry>(`products/${id}/history`)
  }

  static async addPriceHistory(id: string, entry: ProductPriceHistoryEntry): Promise<string | null> {
    return this.create(`products/${id}/history`, entry as unknown as Record<string, unknown>)
  }

  // Stock Movements for products
  static async getAllStockMovements() {
    return this.getAll<StockMovement>("stockMovements");
  }
  static async addStockMovement(movement: Omit<StockMovement, "id">) {
    return this.create("stockMovements", movement);
  }
}

// Employee Services
export class EmployeeService extends FirebaseService {
  static async createEmployee(employee: Omit<Employee, "id">): Promise<string | null> {
    return this.create("employees", employee)
  }

  static async getAllEmployees(): Promise<Employee[]> {
    return this.getAll<Employee>("employees")
  }

  static async updateEmployee(id: string, employee: Partial<Employee>): Promise<void> {
    return this.update("employees", id, employee)
  }

  static async deleteEmployee(id: string): Promise<void> {
    return this.delete("employees", id)
  }

  static async createAttendanceRecord(record: Omit<AttendanceRecord, "id">): Promise<string | null> {
    return this.create("attendance", record)
  }

  static async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return this.getAll<AttendanceRecord>("attendance")
  }

  static async createSalaryRecord(record: Omit<SalaryRecord, "id">): Promise<string | null> {
    return this.create("salaryRecords", record)
  }

  static async updateSalaryRecord(id: string, record: Partial<SalaryRecord>): Promise<void> {
    return this.update("salaryRecords", id, record)
  }

  static async getAllSalaryRecords(): Promise<SalaryRecord[]> {
    return this.getAll<SalaryRecord>("salaryRecords")
  }

  static subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
    return this.subscribe<Employee>("employees", callback)
  }
}

// Sales Services
export class SalesService extends FirebaseService {
  static async createSale(sale: Omit<SaleRecord, "id">): Promise<string | null> {
    return this.create("sales", sale)
  }

  static async getAllSales(): Promise<SaleRecord[]> {
    return this.getAll<SaleRecord>("sales")
  }

  static async updateSale(id: string, sale: Partial<SaleRecord>): Promise<void> {
    return this.update("sales", id, sale)
  }

  static async deleteSale(id: string): Promise<void> {
    return this.delete("sales", id)
  }

  static async discardSale(id: string): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping discard sale operation');
      return;
    }

    try {
      // Get the sale record
      const saleSnapshot = await get(ref(db!, `sales/${id}`));
      if (!saleSnapshot.exists()) {
        throw new Error('Sale not found');
      }
      
      const sale = { id: saleSnapshot.key, ...saleSnapshot.val() } as SaleRecord;
      
      // Restore inventory for each item in the sale
      const updates: Record<string, string | number | Record<string, string | number>> = {};
      
      for (const item of sale.items) {
        const productRef = ref(db!, `products/${item.id}`);
        const productSnapshot = await get(productRef);
        
        if (productSnapshot.exists()) {
          const product = productSnapshot.val();
          const newStock = (product.stock || 0) + item.quantity;
          
          // Update product stock
          updates[`products/${item.id}/stock`] = newStock;
          updates[`products/${item.id}/updatedAt`] = new Date().toISOString();
          
          // Record stock movement
          const movementRef = push(ref(db!, 'stockMovements'));
          updates[`stockMovements/${movementRef.key}`] = {
            itemId: item.id,
            itemName: item.name,
            type: 'in',
            quantity: item.quantity,
            reason: 'Sale discard/return',
            staff: 'System',
            date: new Date().toISOString(),
            reference: `Sale: ${sale.invoiceNumber}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      }
      
      // Mark sale as cancelled and update timestamps
      updates[`sales/${id}/deliveryStatus`] = 'cancelled';
      updates[`sales/${id}/paymentStatus`] = 'pending';
      updates[`sales/${id}/updatedAt`] = new Date().toISOString();
      
      // Update all changes in a single transaction
      await fbUpdate(ref(db!), updates);
      
    } catch (error) {
      console.error('Error discarding sale:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  static subscribeToSales(callback: (sales: SaleRecord[]) => void): () => void {
    return this.subscribe<SaleRecord>("sales", callback);
  }
}

// Credit/Debit Services
export class LedgerService extends FirebaseService {
  static async createCreditEntry(entry: Omit<CreditEntry, "id">): Promise<string | null> {
    return this.create("creditEntries", entry)
  }

  static async getAllCreditEntries(): Promise<CreditEntry[]> {
    return this.getAll<CreditEntry>("creditEntries")
  }

  static async updateCreditEntry(id: string, entry: Partial<CreditEntry>): Promise<void> {
    return this.update("creditEntries", id, entry)
  }

  static async createDebitEntry(entry: Omit<DebitEntry, "id">): Promise<string | null> {
    return this.create("debitEntries", entry)
  }

  static async getAllDebitEntries(): Promise<DebitEntry[]> {
    return this.getAll<DebitEntry>("debitEntries")
  }

  static async updateDebitEntry(id: string, entry: Partial<DebitEntry>): Promise<void> {
    return this.update("debitEntries", id, entry)
  }

  static subscribeToCreditEntries(callback: (entries: CreditEntry[]) => void): () => void {
    return this.subscribe<CreditEntry>("creditEntries", callback)
  }

  static subscribeToDebitEntries(callback: (entries: DebitEntry[]) => void): () => void {
    return this.subscribe<DebitEntry>("debitEntries", callback)
  }
}

// Bargaining Services
export class BargainingService extends FirebaseService {
  static async createBargainRecord(record: Omit<BargainRecord, "id">): Promise<string | null> {
    return this.create("bargainRecords", record)
  }

  static async getAllBargainRecords(): Promise<BargainRecord[]> {
    return this.getAll<BargainRecord>("bargainRecords")
  }

  static async updateBargainRecord(id: string, record: Partial<BargainRecord>): Promise<void> {
    return this.update("bargainRecords", id, record)
  }

  static subscribeToBargainRecords(callback: (records: BargainRecord[]) => void): () => void {
    return this.subscribe<BargainRecord>("bargainRecords", callback)
  }
}

// Disposal Services
export class DisposalService extends FirebaseService {
  static async createDisposalRecord(record: Omit<DisposalRecord, "id">): Promise<string | null> {
    return this.create("disposalRecords", record)
  }

  static async getAllDisposalRecords(): Promise<DisposalRecord[]> {
    return this.getAll<DisposalRecord>("disposalRecords")
  }

  static async updateDisposalRecord(id: string, record: Partial<DisposalRecord>): Promise<void> {
    return this.update("disposalRecords", id, record)
  }

  static async deleteDisposalRecord(id: string): Promise<void> {
    return this.delete("disposalRecords", id)
  }

  static subscribeToDisposalRecords(callback: (records: DisposalRecord[]) => void): () => void {
    return this.subscribe<DisposalRecord>("disposalRecords", callback)
  }
}

// Daily Expense Services
export class DailyExpenseService extends FirebaseService {
  static async createDailyExpense(expense: Omit<DailyExpense, "id">): Promise<string | null> {
    return this.create("dailyExpenses", expense)
  }

  static async getAllDailyExpenses(): Promise<DailyExpense[]> {
    return this.getAll<DailyExpense>("dailyExpenses")
  }

  static async updateDailyExpense(id: string, expense: Partial<DailyExpense>): Promise<void> {
    return this.update("dailyExpenses", id, expense)
  }

  static async deleteDailyExpense(id: string): Promise<void> {
    return this.delete("dailyExpenses", id)
  }

  static subscribeToDailyExpenses(callback: (expenses: DailyExpense[]) => void): () => void {
    return this.subscribe<DailyExpense>("dailyExpenses", callback)
  }
}

// Customer Services
export class CustomerService extends FirebaseService {
  static async createCustomer(customer: Omit<Customer, "id">): Promise<string | null> {
    return this.create("customers", customer)
  }

  static async getAllCustomers(): Promise<Customer[]> {
    return this.getAll<Customer>("customers")
  }

  static async getCustomerById(id: string): Promise<Customer | null> {
    return this.getById<Customer>("customers", id)
  }

  static async updateCustomer(id: string, customer: Partial<Customer>): Promise<void> {
    return this.update("customers", id, customer)
  }

  static async deleteCustomer(id: string): Promise<void> {
    return this.delete("customers", id)
  }

  static subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    return this.subscribe<Customer>("customers", callback)
  }

  // Get customer sales history
  static async getCustomerSales(customerPhone: string): Promise<SaleRecord[]> {
    const allSales = await SalesService.getAllSales()
    return allSales.filter(sale => sale.customerPhone === customerPhone)
  }

  // Update customer stats based on sales
  static async updateCustomerStats(customerPhone: string): Promise<void> {
    const sales = await this.getCustomerSales(customerPhone)
    const customers = await this.getAllCustomers()
    const customer = customers.find(c => c.phone === customerPhone)
    
    if (customer) {
      const totalPurchases = sales.length
      const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0)
      const lastPurchaseDate = sales.length > 0 
        ? sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : undefined

      await this.updateCustomer(customer.id, {
        totalPurchases,
        totalSpent,
        lastPurchaseDate
      })
    }
  }
}

// Supplier Services
export class SupplierService extends FirebaseService {
  static async createSupplier(supplier: Omit<Supplier, "id">): Promise<string | null> {
    return this.create("suppliers", supplier)
  }

  static async getAllSuppliers(): Promise<Supplier[]> {
    return this.getAll<Supplier>("suppliers")
  }

  static async getSupplierById(id: string): Promise<Supplier | null> {
    return this.getById<Supplier>("suppliers", id)
  }

  static async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<void> {
    return this.update("suppliers", id, supplier)
  }

  static async deleteSupplier(id: string): Promise<void> {
    return this.delete("suppliers", id)
  }

  static subscribeToSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
    return this.subscribe<Supplier>("suppliers", callback)
  }
}

// Purchase Services
export class PurchaseService extends FirebaseService {
  static async createPurchase(purchase: Omit<Purchase, "id">): Promise<string | null> {
    return this.create("purchases", purchase)
  }

  static async getAllPurchases(): Promise<Purchase[]> {
    return this.getAll<Purchase>("purchases")
  }

  static async getPurchaseById(id: string): Promise<Purchase | null> {
    return this.getById<Purchase>("purchases", id)
  }

  static async updatePurchase(id: string, purchase: Partial<Purchase>): Promise<void> {
    return this.update("purchases", id, purchase)
  }

  static async deletePurchase(id: string): Promise<void> {
    return this.delete("purchases", id)
  }

  static subscribeToPurchases(callback: (purchases: Purchase[]) => void): () => void {
    return this.subscribe<Purchase>("purchases", callback)
  }

  static async getPurchasesBySupplier(supplierId: string): Promise<Purchase[]> {
    const purchases = await this.getAll<Purchase>("purchases")
    return purchases.filter(purchase => purchase.supplierId === supplierId)
  }
}

// Customer Return Services
export class CustomerReturnService extends FirebaseService {
  static async createCustomerReturn(customerReturn: Omit<CustomerReturnRecord, "id">): Promise<string | null> {
    return this.create("customerReturns", customerReturn)
  }

  static async getAllCustomerReturns(): Promise<CustomerReturnRecord[]> {
    return this.getAll<CustomerReturnRecord>("customerReturns")
  }

  static async getCustomerReturnById(id: string): Promise<CustomerReturnRecord | null> {
    return this.getById<CustomerReturnRecord>("customerReturns", id)
  }

  static async updateCustomerReturn(id: string, customerReturn: Partial<CustomerReturnRecord>): Promise<void> {
    return this.update("customerReturns", id, customerReturn)
  }

  static async deleteCustomerReturn(id: string): Promise<void> {
    return this.delete("customerReturns", id)
  }
}

// Supplier Return Services
export class SupplierReturnService extends FirebaseService {
  static async createSupplierReturn(supplierReturn: Omit<SupplierReturnRecord, "id">): Promise<string | null> {
    return this.create("supplierReturns", supplierReturn)
  }

  static async getAllSupplierReturns(): Promise<SupplierReturnRecord[]> {
    return this.getAll<SupplierReturnRecord>("supplierReturns")
  }

  static async getSupplierReturnById(id: string): Promise<SupplierReturnRecord | null> {
    return this.getById<SupplierReturnRecord>("supplierReturns", id)
  }

  static async updateSupplierReturn(id: string, supplierReturn: Partial<SupplierReturnRecord>): Promise<void> {
    return this.update("supplierReturns", id, supplierReturn)
  }

  static async deleteSupplierReturn(id: string): Promise<void> {
    return this.delete("supplierReturns", id)
  }
}

// Return Counter Services
export class ReturnCounterService extends FirebaseService {
  static async getNextCustomerReturnNumber(): Promise<string> {
    try {
      if (!isFirebaseInitialized()) {
        throw new Error("Firebase not initialized")
      }

      // Get all existing customer returns to find the maximum number
      const customerReturns = await CustomerReturnService.getAllCustomerReturns()
      
      let maxNumber = 999 // Default starting point
      
      // Find the highest return number
      for (const returnRecord of customerReturns) {
        const returnNumber = returnRecord.returnNumber
        if (returnNumber && returnNumber.endsWith('-R')) {
          const numberPart = returnNumber.replace('-R', '')
          const num = parseInt(numberPart, 10)
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num
          }
        }
      }
      
      const nextNumber = maxNumber + 1
      
      // Update the counter for future reference
      const counterRef = ref(db, "counters/customerReturns")
      await set(counterRef, nextNumber)
      
      return `${nextNumber}-R`
    } catch (error) {
      console.error("Error getting next customer return number:", error)
      throw error
    }
  }

  static async getNextSupplierReturnNumber(): Promise<string> {
    try {
      if (!isFirebaseInitialized()) {
        throw new Error("Firebase not initialized")
      }

      // Get all existing supplier returns to find the maximum number
      const supplierReturns = await SupplierReturnService.getAllSupplierReturns()
      
      let maxNumber = 999 // Default starting point
      
      // Find the highest return number
      for (const returnRecord of supplierReturns) {
        const returnNumber = returnRecord.returnNumber
        if (returnNumber && returnNumber.endsWith('-SR')) {
          const numberPart = returnNumber.replace('-SR', '')
          const num = parseInt(numberPart, 10)
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num
          }
        }
      }
      
      const nextNumber = maxNumber + 1
      
      // Update the counter for future reference
      const counterRef = ref(db, "counters/supplierReturns")
      await set(counterRef, nextNumber)
      
      return `${nextNumber}-SR`
    } catch (error) {
      console.error("Error getting next supplier return number:", error)
      throw error
    }
  }
}

// Employee Ledger Service
export class EmployeeLedgerService {
  private static readonly COLLECTION = "employeeLedger"

  static async addLedgerEntry(entry: Omit<EmployeeLedgerEntry, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entryRef = ref(db, `${this.COLLECTION}`)
    const newEntryRef = push(entryRef)
    
    const entryData: EmployeeLedgerEntry = {
      ...entry,
      id: newEntryRef.key!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(newEntryRef, entryData)
    return newEntryRef.key!
  }

  static async getAllLedgerEntries(): Promise<EmployeeLedgerEntry[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entriesRef = ref(db, this.COLLECTION)
    const snapshot = await get(entriesRef)
    
    if (!snapshot.exists()) return []
    
    const entries: EmployeeLedgerEntry[] = []
    snapshot.forEach((childSnapshot) => {
      entries.push(childSnapshot.val())
    })
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  static async getLedgerEntriesByEmployee(employeeId: string): Promise<EmployeeLedgerEntry[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entriesRef = ref(db, this.COLLECTION)
    const snapshot = await get(entriesRef)
    
    if (!snapshot.exists()) return []
    
    const entries: EmployeeLedgerEntry[] = []
    snapshot.forEach((childSnapshot) => {
      const entry = childSnapshot.val()
      if (entry.employeeId === employeeId) {
        entries.push(entry)
      }
    })
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  static async updateLedgerEntry(id: string, updates: Partial<EmployeeLedgerEntry>): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entryRef = ref(db, `${this.COLLECTION}/${id}`)
    await fbUpdate(entryRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteLedgerEntry(id: string): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entryRef = ref(db, `${this.COLLECTION}/${id}`)
    await remove(entryRef)
  }
}

// Employee Advance Service
export class EmployeeAdvanceService {
  private static readonly COLLECTION = "employeeAdvances"

  static async addAdvance(advance: Omit<EmployeeAdvance, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const advanceRef = ref(db, this.COLLECTION)
    const newAdvanceRef = push(advanceRef)
    
    const advanceData: EmployeeAdvance = {
      ...advance,
      id: newAdvanceRef.key!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(newAdvanceRef, advanceData)
    return newAdvanceRef.key!
  }

  static async getAllAdvances(): Promise<EmployeeAdvance[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const advancesRef = ref(db, this.COLLECTION)
    const snapshot = await get(advancesRef)
    
    if (!snapshot.exists()) return []
    
    const advances: EmployeeAdvance[] = []
    snapshot.forEach((childSnapshot) => {
      advances.push(childSnapshot.val())
    })
    
    return advances.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime())
  }

  static async getAdvancesByEmployee(employeeId: string): Promise<EmployeeAdvance[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const advancesRef = ref(db, this.COLLECTION)
    const snapshot = await get(advancesRef)
    
    if (!snapshot.exists()) return []
    
    const advances: EmployeeAdvance[] = []
    snapshot.forEach((childSnapshot) => {
      const advance = childSnapshot.val()
      if (advance.employeeId === employeeId) {
        advances.push(advance)
      }
    })
    
    return advances.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime())
  }

  static async updateAdvance(id: string, updates: Partial<EmployeeAdvance>): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const advanceRef = ref(db, `${this.COLLECTION}/${id}`)
    await fbUpdate(advanceRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }
}

// Salesperson Bonus Service
export class SalespersonBonusService {
  private static readonly COLLECTION = "salespersonBonuses"

  static async addBonus(bonus: Omit<SalespersonBonus, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const bonusRef = ref(db, this.COLLECTION)
    const newBonusRef = push(bonusRef)
    
    const bonusData: SalespersonBonus = {
      ...bonus,
      id: newBonusRef.key!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(newBonusRef, bonusData)
    return newBonusRef.key!
  }

  static async getAllBonuses(): Promise<SalespersonBonus[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const bonusesRef = ref(db, this.COLLECTION)
    const snapshot = await get(bonusesRef)
    
    if (!snapshot.exists()) return []
    
    const bonuses: SalespersonBonus[] = []
    snapshot.forEach((childSnapshot) => {
      bonuses.push(childSnapshot.val())
    })
    
    return bonuses.sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
  }

  static async getBonusesByEmployee(employeeId: string): Promise<SalespersonBonus[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const bonusesRef = ref(db, this.COLLECTION)
    const snapshot = await get(bonusesRef)
    
    if (!snapshot.exists()) return []
    
    const bonuses: SalespersonBonus[] = []
    snapshot.forEach((childSnapshot) => {
      const bonus = childSnapshot.val()
      if (bonus.employeeId === employeeId) {
        bonuses.push(bonus)
      }
    })
    
    return bonuses.sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
  }

  static async updateBonus(id: string, updates: Partial<SalespersonBonus>): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const bonusRef = ref(db, `${this.COLLECTION}/${id}`)
    await fbUpdate(bonusRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }
}

// Supplier Ledger Service
export class SupplierLedgerService {
  private static readonly COLLECTION = "supplierLedger"

  static async addLedgerEntry(entry: Omit<SupplierLedgerEntry, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entryRef = ref(db, this.COLLECTION)
    const newEntryRef = push(entryRef)
    
    const entryData: SupplierLedgerEntry = {
      ...entry,
      id: newEntryRef.key!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(newEntryRef, entryData)
    return newEntryRef.key!
  }

  static async getAllLedgerEntries(): Promise<SupplierLedgerEntry[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entriesRef = ref(db, this.COLLECTION)
    const snapshot = await get(entriesRef)
    
    if (!snapshot.exists()) return []
    
    const entries: SupplierLedgerEntry[] = []
    snapshot.forEach((childSnapshot) => {
      entries.push(childSnapshot.val())
    })
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  static async getLedgerEntriesBySupplier(supplierId: string): Promise<SupplierLedgerEntry[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entriesRef = ref(db, this.COLLECTION)
    const snapshot = await get(entriesRef)
    
    if (!snapshot.exists()) return []
    
    const entries: SupplierLedgerEntry[] = []
    snapshot.forEach((childSnapshot) => {
      const entry = childSnapshot.val()
      if (entry.supplierId === supplierId) {
        entries.push(entry)
      }
    })
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  static async updateLedgerEntry(id: string, updates: Partial<SupplierLedgerEntry>): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const entryRef = ref(db, `${this.COLLECTION}/${id}`)
    await fbUpdate(entryRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }
}

// Custom Product Service
export class CustomProductService {
  private static readonly COLLECTION = "customProducts"

  static async addProduct(product: Omit<CustomProduct, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const productRef = ref(db, this.COLLECTION)
    const newProductRef = push(productRef)
    
    const productData: CustomProduct = {
      ...product,
      id: newProductRef.key!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(newProductRef, productData)
    return newProductRef.key!
  }

  static async getAllProducts(): Promise<CustomProduct[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const productsRef = ref(db, this.COLLECTION)
    const snapshot = await get(productsRef)
    
    if (!snapshot.exists()) return []
    
    const products: CustomProduct[] = []
    snapshot.forEach((childSnapshot) => {
      products.push(childSnapshot.val())
    })
    
    return products.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
  }

  static async getProductById(id: string): Promise<CustomProduct | null> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const productRef = ref(db, `${this.COLLECTION}/${id}`)
    const snapshot = await get(productRef)
    
    return snapshot.exists() ? snapshot.val() : null
  }

  static async updateProduct(id: string, updates: Partial<CustomProduct>): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const productRef = ref(db, `${this.COLLECTION}/${id}`)
    await fbUpdate(productRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteProduct(id: string): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const productRef = ref(db, `${this.COLLECTION}/${id}`)
    await remove(productRef)
  }
}

// Product Category Service
export class ProductCategoryService {
  private static readonly COLLECTION = "productCategories"

  static async addCategory(category: Omit<ProductCategory, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const categoryRef = ref(db, this.COLLECTION)
    const newCategoryRef = push(categoryRef)
    
    const categoryData: ProductCategory = {
      ...category,
      id: newCategoryRef.key!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(newCategoryRef, categoryData)
    return newCategoryRef.key!
  }

  static async getAllCategories(): Promise<ProductCategory[]> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const categoriesRef = ref(db, this.COLLECTION)
    const snapshot = await get(categoriesRef)
    
    if (!snapshot.exists()) return []
    
    const categories: ProductCategory[] = []
    snapshot.forEach((childSnapshot) => {
      categories.push(childSnapshot.val())
    })
    
    return categories.sort((a, b) => a.name.localeCompare(b.name))
  }

  static async updateCategory(id: string, updates: Partial<ProductCategory>): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const categoryRef = ref(db, `${this.COLLECTION}/${id}`)
    await fbUpdate(categoryRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteCategory(id: string): Promise<void> {
    if (!isFirebaseInitialized()) throw new Error("Firebase not initialized")
    
    const categoryRef = ref(db, `${this.COLLECTION}/${id}`)
    await remove(categoryRef)
  }
}
