import { ref, get, set, push, update, remove, query, orderByChild, equalTo } from 'firebase/database'
import { db } from './firebase'
import type { Batch, WarehouseLocation, ProductAssembly, ReorderRule, InventoryTransfer, ProductValuation } from '@/types/custom'

export class AdvancedInventoryService {
  private static readonly BATCHES_PATH = 'batches'
  private static readonly WAREHOUSE_LOCATIONS_PATH = 'warehouseLocations'
  private static readonly PRODUCT_ASSEMBLIES_PATH = 'productAssemblies'
  private static readonly REORDER_RULES_PATH = 'reorderRules'
  private static readonly INVENTORY_TRANSFERS_PATH = 'inventoryTransfers'
  private static readonly PRODUCT_VALUATIONS_PATH = 'productValuations'

  // Batch Management
  static async createBatch(batch: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const batchRef = push(ref(db, this.BATCHES_PATH))
    const batchId = batchRef.key!
    
    const batchData: Batch = {
      ...batch,
      id: batchId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(batchRef, batchData)
    return batchId
  }

  static async getAllBatches(): Promise<Batch[]> {
    const snapshot = await get(ref(db, this.BATCHES_PATH))
    if (!snapshot.exists()) return []
    
    const batches: Batch[] = []
    snapshot.forEach((child) => {
      batches.push(child.val())
    })
    
    return batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async getBatchesByProduct(productId: string): Promise<Batch[]> {
    const q = query(ref(db, this.BATCHES_PATH), orderByChild('productId'), equalTo(productId))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return []
    
    const batches: Batch[] = []
    snapshot.forEach((child) => {
      batches.push(child.val())
    })
    
    return batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async updateBatch(batchId: string, updates: Partial<Batch>): Promise<void> {
    const batchRef = ref(db, `${this.BATCHES_PATH}/${batchId}`)
    await update(batchRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteBatch(batchId: string): Promise<void> {
    const batchRef = ref(db, `${this.BATCHES_PATH}/${batchId}`)
    await remove(batchRef)
  }

  // Warehouse Locations
  static async createWarehouseLocation(location: Omit<WarehouseLocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const locationRef = push(ref(db, this.WAREHOUSE_LOCATIONS_PATH))
    const locationId = locationRef.key!
    
    const locationData: WarehouseLocation = {
      ...location,
      id: locationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(locationRef, locationData)
    return locationId
  }

  static async getAllWarehouseLocations(): Promise<WarehouseLocation[]> {
    const snapshot = await get(ref(db, this.WAREHOUSE_LOCATIONS_PATH))
    if (!snapshot.exists()) return []
    
    const locations: WarehouseLocation[] = []
    snapshot.forEach((child) => {
      locations.push(child.val())
    })
    
    return locations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async updateWarehouseLocation(locationId: string, updates: Partial<WarehouseLocation>): Promise<void> {
    const locationRef = ref(db, `${this.WAREHOUSE_LOCATIONS_PATH}/${locationId}`)
    await update(locationRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  // Product Assemblies
  static async createProductAssembly(assembly: Omit<ProductAssembly, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const assemblyRef = push(ref(db, this.PRODUCT_ASSEMBLIES_PATH))
    const assemblyId = assemblyRef.key!
    
    const assemblyData: ProductAssembly = {
      ...assembly,
      id: assemblyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(assemblyRef, assemblyData)
    return assemblyId
  }

  static async getProductAssemblies(productId: string): Promise<ProductAssembly[]> {
    const q = query(ref(db, this.PRODUCT_ASSEMBLIES_PATH), orderByChild('productId'), equalTo(productId))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return []
    
    const assemblies: ProductAssembly[] = []
    snapshot.forEach((child) => {
      assemblies.push(child.val())
    })
    
    return assemblies
  }

  static async updateProductAssembly(assemblyId: string, updates: Partial<ProductAssembly>): Promise<void> {
    const assemblyRef = ref(db, `${this.PRODUCT_ASSEMBLIES_PATH}/${assemblyId}`)
    await update(assemblyRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteProductAssembly(assemblyId: string): Promise<void> {
    const assemblyRef = ref(db, `${this.PRODUCT_ASSEMBLIES_PATH}/${assemblyId}`)
    await remove(assemblyRef)
  }

  // Reorder Rules
  static async createReorderRule(rule: Omit<ReorderRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleRef = push(ref(db, this.REORDER_RULES_PATH))
    const ruleId = ruleRef.key!
    
    const ruleData: ReorderRule = {
      ...rule,
      id: ruleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(ruleRef, ruleData)
    return ruleId
  }

  static async getAllReorderRules(): Promise<ReorderRule[]> {
    const snapshot = await get(ref(db, this.REORDER_RULES_PATH))
    if (!snapshot.exists()) return []
    
    const rules: ReorderRule[] = []
    snapshot.forEach((child) => {
      rules.push(child.val())
    })
    
    return rules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async getReorderRulesByProduct(productId: string): Promise<ReorderRule[]> {
    const q = query(ref(db, this.REORDER_RULES_PATH), orderByChild('productId'), equalTo(productId))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return []
    
    const rules: ReorderRule[] = []
    snapshot.forEach((child) => {
      rules.push(child.val())
    })
    
    return rules
  }

  static async updateReorderRule(ruleId: string, updates: Partial<ReorderRule>): Promise<void> {
    const ruleRef = ref(db, `${this.REORDER_RULES_PATH}/${ruleId}`)
    await update(ruleRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteReorderRule(ruleId: string): Promise<void> {
    const ruleRef = ref(db, `${this.REORDER_RULES_PATH}/${ruleId}`)
    await remove(ruleRef)
  }

  // Inventory Transfers
  static async createInventoryTransfer(transfer: Omit<InventoryTransfer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const transferRef = push(ref(db, this.INVENTORY_TRANSFERS_PATH))
    const transferId = transferRef.key!
    
    const transferData: InventoryTransfer = {
      ...transfer,
      id: transferId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(transferRef, transferData)
    return transferId
  }

  static async getAllInventoryTransfers(): Promise<InventoryTransfer[]> {
    const snapshot = await get(ref(db, this.INVENTORY_TRANSFERS_PATH))
    if (!snapshot.exists()) return []
    
    const transfers: InventoryTransfer[] = []
    snapshot.forEach((child) => {
      transfers.push(child.val())
    })
    
    return transfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async updateInventoryTransfer(transferId: string, updates: Partial<InventoryTransfer>): Promise<void> {
    const transferRef = ref(db, `${this.INVENTORY_TRANSFERS_PATH}/${transferId}`)
    await update(transferRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async approveInventoryTransfer(transferId: string, approvedBy: string): Promise<void> {
    await this.updateInventoryTransfer(transferId, {
      status: 'in-transit',
      approvedBy
    })
  }

  static async completeInventoryTransfer(transferId: string): Promise<void> {
    await this.updateInventoryTransfer(transferId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    })
  }

  // Product Valuations
  static async createProductValuation(valuation: Omit<ProductValuation, 'id' | 'lastUpdated'>): Promise<string> {
    const valuationRef = push(ref(db, this.PRODUCT_VALUATIONS_PATH))
    const valuationId = valuationRef.key!
    
    const valuationData: ProductValuation = {
      ...valuation,
      id: valuationId,
      lastUpdated: new Date().toISOString()
    }
    
    await set(valuationRef, valuationData)
    return valuationId
  }

  static async getProductValuation(productId: string): Promise<ProductValuation | null> {
    const q = query(ref(db, this.PRODUCT_VALUATIONS_PATH), orderByChild('productId'), equalTo(productId))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return null
    
    let valuation: ProductValuation | null = null
    snapshot.forEach((child) => {
      valuation = child.val()
    })
    
    return valuation
  }

  static async updateProductValuation(valuationId: string, updates: Partial<ProductValuation>): Promise<void> {
    const valuationRef = ref(db, `${this.PRODUCT_VALUATIONS_PATH}/${valuationId}`)
    await update(valuationRef, {
      ...updates,
      lastUpdated: new Date().toISOString()
    })
  }

  // Utility methods
  static async checkExpiringBatches(days: number = 30): Promise<Batch[]> {
    const batches = await this.getAllBatches()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)
    
    return batches.filter(batch => {
      if (!batch.expiryDate) return false
      const expiryDate = new Date(batch.expiryDate)
      return expiryDate <= cutoffDate && batch.status === 'active'
    })
  }

  static async checkLowStockProducts(): Promise<{ productId: string; currentStock: number; reorderPoint: number }[]> {
    const rules = await this.getAllReorderRules()
    const lowStockProducts: { productId: string; currentStock: number; reorderPoint: number }[] = []
    
    for (const rule of rules) {
      if (rule.isActive) {
        // In a real implementation, you would check actual stock levels
        // For now, we'll simulate this
        const currentStock = Math.floor(Math.random() * rule.reorderPoint * 2) // Simulated stock
        if (currentStock <= rule.reorderPoint) {
          lowStockProducts.push({
            productId: rule.productId,
            currentStock,
            reorderPoint: rule.reorderPoint
          })
        }
      }
    }
    
    return lowStockProducts
  }

  static async calculateProductCost(productId: string, method: 'fifo' | 'lifo' | 'average' | 'standard'): Promise<number> {
    const batches = await this.getBatchesByProduct(productId)
    
    if (batches.length === 0) return 0
    
    switch (method) {
      case 'fifo':
        // First In, First Out - return cost of oldest batch
        const sortedFifo = batches.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        return sortedFifo[0]?.cost || 0
        
      case 'lifo':
        // Last In, First Out - return cost of newest batch
        const sortedLifo = batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return sortedLifo[0]?.cost || 0
        
      case 'average':
        // Average cost of all batches
        const totalCost = batches.reduce((sum, batch) => sum + (batch.cost * batch.quantity), 0)
        const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0)
        return totalQuantity > 0 ? totalCost / totalQuantity : 0
        
      case 'standard':
        // Standard cost - would be set manually
        const valuation = await this.getProductValuation(productId)
        return valuation?.cost || 0
        
      default:
        return 0
    }
  }

  // Initialize default data
  static async initializeDefaultData(): Promise<void> {
    if (!db) {
      console.warn('Database not initialized, skipping advanced inventory initialization')
      return
    }
    
    const existingLocations = await this.getAllWarehouseLocations()
    if (existingLocations.length > 0) return

    const defaultLocations = [
      {
        name: 'Main Warehouse',
        code: 'MAIN',
        address: '123 Warehouse St, City, State 12345',
        capacity: 10000,
        currentStock: 0,
        isActive: true
      },
      {
        name: 'Secondary Storage',
        code: 'SEC',
        address: '456 Storage Ave, City, State 12345',
        capacity: 5000,
        currentStock: 0,
        isActive: true
      }
    ]

    for (const location of defaultLocations) {
      await this.createWarehouseLocation(location)
    }
  }
}
