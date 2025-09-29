import { ref, get, set, push, update, remove, query, orderByChild, equalTo } from 'firebase/database'
import { db } from './firebase'
import type { Branch, BranchTransfer, BranchInventory } from '@/types/custom'

export class BranchManagementService {
  private static readonly BRANCHES_PATH = 'branches'
  private static readonly BRANCH_TRANSFERS_PATH = 'branchTransfers'
  private static readonly BRANCH_INVENTORY_PATH = 'branchInventory'

  // Branch Management
  static async createBranch(branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const branchRef = push(ref(db, this.BRANCHES_PATH))
    const branchId = branchRef.key!
    
    const branchData: Branch = {
      ...branch,
      id: branchId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(branchRef, branchData)
    return branchId
  }

  static async getAllBranches(): Promise<Branch[]> {
    const snapshot = await get(ref(db, this.BRANCHES_PATH))
    if (!snapshot.exists()) return []
    
    const branches: Branch[] = []
    snapshot.forEach((child) => {
      branches.push(child.val())
    })
    
    return branches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async getBranch(branchId: string): Promise<Branch | null> {
    const snapshot = await get(ref(db, `${this.BRANCHES_PATH}/${branchId}`))
    return snapshot.exists() ? snapshot.val() : null
  }

  static async updateBranch(branchId: string, updates: Partial<Branch>): Promise<void> {
    const branchRef = ref(db, `${this.BRANCHES_PATH}/${branchId}`)
    await update(branchRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteBranch(branchId: string): Promise<void> {
    const branchRef = ref(db, `${this.BRANCHES_PATH}/${branchId}`)
    await remove(branchRef)
  }

  static async getDefaultBranch(): Promise<Branch | null> {
    const q = query(ref(db, this.BRANCHES_PATH), orderByChild('settings/isDefault'), equalTo(true))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return null
    
    let defaultBranch: Branch | null = null
    snapshot.forEach((child) => {
      defaultBranch = child.val()
    })
    
    return defaultBranch
  }

  // Branch Transfers
  static async createTransfer(transfer: Omit<BranchTransfer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const transferRef = push(ref(db, this.BRANCH_TRANSFERS_PATH))
    const transferId = transferRef.key!
    
    const transferData: BranchTransfer = {
      ...transfer,
      id: transferId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(transferRef, transferData)
    return transferId
  }

  static async getAllTransfers(): Promise<BranchTransfer[]> {
    const snapshot = await get(ref(db, this.BRANCH_TRANSFERS_PATH))
    if (!snapshot.exists()) return []
    
    const transfers: BranchTransfer[] = []
    snapshot.forEach((child) => {
      transfers.push(child.val())
    })
    
    return transfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async getTransfersByBranch(branchId: string): Promise<BranchTransfer[]> {
    const q = query(ref(db, this.BRANCH_TRANSFERS_PATH), orderByChild('fromBranchId'), equalTo(branchId))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return []
    
    const transfers: BranchTransfer[] = []
    snapshot.forEach((child) => {
      transfers.push(child.val())
    })
    
    return transfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async updateTransfer(transferId: string, updates: Partial<BranchTransfer>): Promise<void> {
    const transferRef = ref(db, `${this.BRANCH_TRANSFERS_PATH}/${transferId}`)
    await update(transferRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async approveTransfer(transferId: string, approvedBy: string): Promise<void> {
    await this.updateTransfer(transferId, {
      status: 'in-transit',
      approvedBy
    })
  }

  static async completeTransfer(transferId: string): Promise<void> {
    await this.updateTransfer(transferId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    })
  }

  // Branch Inventory
  static async getBranchInventory(branchId: string): Promise<BranchInventory[]> {
    const q = query(ref(db, this.BRANCH_INVENTORY_PATH), orderByChild('branchId'), equalTo(branchId))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return []
    
    const inventory: BranchInventory[] = []
    snapshot.forEach((child) => {
      inventory.push(child.val())
    })
    
    return inventory
  }

  static async updateBranchInventory(
    branchId: string, 
    productId: string, 
    quantity: number, 
    reservedQuantity: number = 0
  ): Promise<void> {
    const inventoryRef = ref(db, `${this.BRANCH_INVENTORY_PATH}/${branchId}_${productId}`)
    const availableQuantity = Math.max(0, quantity - reservedQuantity)
    
    const inventoryData: BranchInventory = {
      id: `${branchId}_${productId}`,
      branchId,
      productId,
      quantity,
      reservedQuantity,
      availableQuantity,
      lastUpdated: new Date().toISOString()
    }
    
    await set(inventoryRef, inventoryData)
  }

  static async transferInventory(
    fromBranchId: string,
    toBranchId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    // Get current inventory for both branches
    const fromInventory = await this.getBranchInventory(fromBranchId)
    const toInventory = await this.getBranchInventory(toBranchId)
    
    const fromItem = fromInventory.find(item => item.productId === productId)
    const toItem = toInventory.find(item => item.productId === productId)
    
    // Update from branch (reduce quantity)
    if (fromItem) {
      const newFromQuantity = Math.max(0, fromItem.quantity - quantity)
      await this.updateBranchInventory(fromBranchId, productId, newFromQuantity, fromItem.reservedQuantity)
    }
    
    // Update to branch (increase quantity)
    const currentToQuantity = toItem ? toItem.quantity : 0
    const newToQuantity = currentToQuantity + quantity
    await this.updateBranchInventory(toBranchId, productId, newToQuantity, toItem?.reservedQuantity || 0)
  }

  // Initialize default branch
  static async initializeDefaultBranch(): Promise<void> {
    if (!db) {
      console.warn('Database not initialized, skipping branch initialization')
      return
    }
    
    const existingBranches = await this.getAllBranches()
    if (existingBranches.length > 0) return

    const defaultBranch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Main Store',
      code: 'MAIN',
      address: {
        street: '123 Main Street',
        city: 'Your City',
        state: 'Your State',
        country: 'Your Country',
        postalCode: '12345'
      },
      contact: {
        phone: '+1-234-567-8900',
        email: 'main@store.com',
        manager: 'Store Manager'
      },
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        isActive: true,
        isDefault: true
      }
    }

    await this.createBranch(defaultBranch)
  }
}
