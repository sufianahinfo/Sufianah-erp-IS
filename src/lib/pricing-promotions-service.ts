import { ref, get, set, push, update, remove, query, orderByChild, equalTo } from 'firebase/database'
import { db } from './firebase'
import type { PriceList, PriceListItem, DiscountTier, LoyaltyProgram, CustomerLoyalty, PromotionalCampaign } from '@/types/custom'

export class PricingPromotionsService {
  private static readonly PRICE_LISTS_PATH = 'priceLists'
  private static readonly PRICE_LIST_ITEMS_PATH = 'priceListItems'
  private static readonly DISCOUNT_TIERS_PATH = 'discountTiers'
  private static readonly LOYALTY_PROGRAMS_PATH = 'loyaltyPrograms'
  private static readonly CUSTOMER_LOYALTY_PATH = 'customerLoyalty'
  private static readonly PROMOTIONAL_CAMPAIGNS_PATH = 'promotionalCampaigns'

  // Price Lists
  static async createPriceList(priceList: Omit<PriceList, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const priceListRef = push(ref(db, this.PRICE_LISTS_PATH))
    const priceListId = priceListRef.key!
    
    const priceListData: PriceList = {
      ...priceList,
      id: priceListId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(priceListRef, priceListData)
    return priceListId
  }

  static async getAllPriceLists(): Promise<PriceList[]> {
    const snapshot = await get(ref(db, this.PRICE_LISTS_PATH))
    if (!snapshot.exists()) return []
    
    const priceLists: PriceList[] = []
    snapshot.forEach((child) => {
      priceLists.push(child.val())
    })
    
    return priceLists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async getPriceList(priceListId: string): Promise<PriceList | null> {
    const snapshot = await get(ref(db, `${this.PRICE_LISTS_PATH}/${priceListId}`))
    return snapshot.exists() ? snapshot.val() : null
  }

  static async updatePriceList(priceListId: string, updates: Partial<PriceList>): Promise<void> {
    const priceListRef = ref(db, `${this.PRICE_LISTS_PATH}/${priceListId}`)
    await update(priceListRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deletePriceList(priceListId: string): Promise<void> {
    const priceListRef = ref(db, `${this.PRICE_LISTS_PATH}/${priceListId}`)
    await remove(priceListRef)
  }

  // Price List Items
  static async createPriceListItem(item: Omit<PriceListItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const itemRef = push(ref(db, this.PRICE_LIST_ITEMS_PATH))
    const itemId = itemRef.key!
    
    const itemData: PriceListItem = {
      ...item,
      id: itemId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(itemRef, itemData)
    return itemId
  }

  static async getPriceListItems(priceListId: string): Promise<PriceListItem[]> {
    const q = query(ref(db, this.PRICE_LIST_ITEMS_PATH), orderByChild('priceListId'), equalTo(priceListId))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return []
    
    const items: PriceListItem[] = []
    snapshot.forEach((child) => {
      items.push(child.val())
    })
    
    return items
  }

  static async updatePriceListItem(itemId: string, updates: Partial<PriceListItem>): Promise<void> {
    const itemRef = ref(db, `${this.PRICE_LIST_ITEMS_PATH}/${itemId}`)
    await update(itemRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deletePriceListItem(itemId: string): Promise<void> {
    const itemRef = ref(db, `${this.PRICE_LIST_ITEMS_PATH}/${itemId}`)
    await remove(itemRef)
  }

  // Discount Tiers
  static async createDiscountTier(tier: Omit<DiscountTier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const tierRef = push(ref(db, this.DISCOUNT_TIERS_PATH))
    const tierId = tierRef.key!
    
    const tierData: DiscountTier = {
      ...tier,
      id: tierId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(tierRef, tierData)
    return tierId
  }

  static async getAllDiscountTiers(): Promise<DiscountTier[]> {
    const snapshot = await get(ref(db, this.DISCOUNT_TIERS_PATH))
    if (!snapshot.exists()) return []
    
    const tiers: DiscountTier[] = []
    snapshot.forEach((child) => {
      tiers.push(child.val())
    })
    
    return tiers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async updateDiscountTier(tierId: string, updates: Partial<DiscountTier>): Promise<void> {
    const tierRef = ref(db, `${this.DISCOUNT_TIERS_PATH}/${tierId}`)
    await update(tierRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteDiscountTier(tierId: string): Promise<void> {
    const tierRef = ref(db, `${this.DISCOUNT_TIERS_PATH}/${tierId}`)
    await remove(tierRef)
  }

  // Loyalty Programs
  static async createLoyaltyProgram(program: Omit<LoyaltyProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const programRef = push(ref(db, this.LOYALTY_PROGRAMS_PATH))
    const programId = programRef.key!
    
    const programData: LoyaltyProgram = {
      ...program,
      id: programId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(programRef, programData)
    return programId
  }

  static async getAllLoyaltyPrograms(): Promise<LoyaltyProgram[]> {
    const snapshot = await get(ref(db, this.LOYALTY_PROGRAMS_PATH))
    if (!snapshot.exists()) return []
    
    const programs: LoyaltyProgram[] = []
    snapshot.forEach((child) => {
      programs.push(child.val())
    })
    
    return programs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async updateLoyaltyProgram(programId: string, updates: Partial<LoyaltyProgram>): Promise<void> {
    const programRef = ref(db, `${this.LOYALTY_PROGRAMS_PATH}/${programId}`)
    await update(programRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteLoyaltyProgram(programId: string): Promise<void> {
    const programRef = ref(db, `${this.LOYALTY_PROGRAMS_PATH}/${programId}`)
    await remove(programRef)
  }

  // Customer Loyalty
  static async getCustomerLoyalty(customerId: string): Promise<CustomerLoyalty | null> {
    const q = query(ref(db, this.CUSTOMER_LOYALTY_PATH), orderByChild('customerId'), equalTo(customerId))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return null
    
    let loyalty: CustomerLoyalty | null = null
    snapshot.forEach((child) => {
      loyalty = child.val()
    })
    
    return loyalty
  }

  static async updateCustomerLoyalty(customerId: string, programId: string, points: number, action: 'earn' | 'redeem'): Promise<void> {
    const loyaltyRef = ref(db, `${this.CUSTOMER_LOYALTY_PATH}/${customerId}_${programId}`)
    const snapshot = await get(loyaltyRef)
    
    if (snapshot.exists()) {
      const currentLoyalty = snapshot.val()
      const newPoints = action === 'earn' 
        ? currentLoyalty.currentPoints + points
        : Math.max(0, currentLoyalty.currentPoints - points)
      
      await update(loyaltyRef, {
        currentPoints: newPoints,
        totalEarned: action === 'earn' ? currentLoyalty.totalEarned + points : currentLoyalty.totalEarned,
        totalRedeemed: action === 'redeem' ? currentLoyalty.totalRedeemed + points : currentLoyalty.totalRedeemed,
        lastActivity: new Date().toISOString()
      })
    } else {
      // Create new loyalty record
      const loyaltyData: CustomerLoyalty = {
        id: `${customerId}_${programId}`,
        customerId,
        programId,
        currentPoints: action === 'earn' ? points : 0,
        totalEarned: action === 'earn' ? points : 0,
        totalRedeemed: action === 'redeem' ? points : 0,
        currentTier: 'Bronze',
        joinedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }
      
      await set(loyaltyRef, loyaltyData)
    }
  }

  // Promotional Campaigns
  static async createPromotionalCampaign(campaign: Omit<PromotionalCampaign, 'id' | 'createdAt' | 'updatedAt' | 'currentUsage'>): Promise<string> {
    const campaignRef = push(ref(db, this.PROMOTIONAL_CAMPAIGNS_PATH))
    const campaignId = campaignRef.key!
    
    const campaignData: PromotionalCampaign = {
      ...campaign,
      id: campaignId,
      currentUsage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(campaignRef, campaignData)
    return campaignId
  }

  static async getAllPromotionalCampaigns(): Promise<PromotionalCampaign[]> {
    const snapshot = await get(ref(db, this.PROMOTIONAL_CAMPAIGNS_PATH))
    if (!snapshot.exists()) return []
    
    const campaigns: PromotionalCampaign[] = []
    snapshot.forEach((child) => {
      campaigns.push(child.val())
    })
    
    return campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async updatePromotionalCampaign(campaignId: string, updates: Partial<PromotionalCampaign>): Promise<void> {
    const campaignRef = ref(db, `${this.PROMOTIONAL_CAMPAIGNS_PATH}/${campaignId}`)
    await update(campaignRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deletePromotionalCampaign(campaignId: string): Promise<void> {
    const campaignRef = ref(db, `${this.PROMOTIONAL_CAMPAIGNS_PATH}/${campaignId}`)
    await remove(campaignRef)
  }

  static async usePromotionalCampaign(campaignId: string): Promise<boolean> {
    const campaignRef = ref(db, `${this.PROMOTIONAL_CAMPAIGNS_PATH}/${campaignId}`)
    const snapshot = await get(campaignRef)
    
    if (!snapshot.exists()) return false
    
    const campaign = snapshot.val()
    
    // Check if campaign is still valid and has usage limit
    if (!campaign.isActive) return false
    if (campaign.usageLimit && campaign.currentUsage >= campaign.usageLimit) return false
    
    const now = new Date()
    const validFrom = new Date(campaign.validFrom)
    const validTo = new Date(campaign.validTo)
    
    if (now < validFrom || now > validTo) return false
    
    // Increment usage
    await update(campaignRef, {
      currentUsage: campaign.currentUsage + 1,
      updatedAt: new Date().toISOString()
    })
    
    return true
  }

  // Utility methods
  static async calculateDiscount(
    productId: string,
    customerId: string,
    quantity: number,
    basePrice: number
  ): Promise<{ finalPrice: number; discountAmount: number; appliedDiscounts: string[] }> {
    let finalPrice = basePrice
    let discountAmount = 0
    const appliedDiscounts: string[] = []

    // Check price lists
    const priceLists = await this.getAllPriceLists()
    for (const priceList of priceLists) {
      if (!priceList.isActive) continue
      
      const items = await this.getPriceListItems(priceList.id)
      const applicableItem = items.find(item => 
        item.productId === productId &&
        (!item.customerId || item.customerId === customerId) &&
        (!item.minQuantity || quantity >= item.minQuantity) &&
        (!item.maxQuantity || quantity <= item.maxQuantity)
      )
      
      if (applicableItem) {
        finalPrice = applicableItem.price
        discountAmount = basePrice - finalPrice
        appliedDiscounts.push(`Price List: ${priceList.name}`)
        break
      }
    }

    // Check discount tiers
    const discountTiers = await this.getAllDiscountTiers()
    for (const tier of discountTiers) {
      if (!tier.isActive) continue
      
      const now = new Date()
      const validFrom = new Date(tier.validFrom)
      const validTo = tier.validTo ? new Date(tier.validTo) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      
      if (now < validFrom || now > validTo) continue
      
      if (tier.applicableProducts && !tier.applicableProducts.includes(productId)) continue
      
      let tierDiscount = 0
      if (tier.type === 'percentage') {
        tierDiscount = (finalPrice * tier.value) / 100
        if (tier.maxDiscountAmount) {
          tierDiscount = Math.min(tierDiscount, tier.maxDiscountAmount)
        }
      } else if (tier.type === 'fixed') {
        tierDiscount = tier.value
      }
      
      if (tierDiscount > 0) {
        finalPrice = Math.max(0, finalPrice - tierDiscount)
        discountAmount += tierDiscount
        appliedDiscounts.push(`Discount: ${tier.name}`)
      }
    }

    return {
      finalPrice: Math.max(0, finalPrice),
      discountAmount,
      appliedDiscounts
    }
  }

  static async calculateLoyaltyPoints(
    customerId: string,
    programId: string,
    purchaseAmount: number
  ): Promise<number> {
    const program = await this.getLoyaltyProgram(programId)
    if (!program || !program.isActive) return 0
    
    const loyalty = await this.getCustomerLoyalty(customerId)
    if (!loyalty) return 0
    
    // Find current tier
    const currentTier = program.tiers.find(tier => 
      loyalty.currentPoints >= tier.minPoints
    ) || program.tiers[0]
    
    const basePoints = Math.floor(purchaseAmount * program.pointsPerDollar)
    const tierMultiplier = currentTier?.multiplier || 1
    
    return Math.floor(basePoints * tierMultiplier)
  }

  static async getLoyaltyProgram(programId: string): Promise<LoyaltyProgram | null> {
    const snapshot = await get(ref(db, `${this.LOYALTY_PROGRAMS_PATH}/${programId}`))
    return snapshot.exists() ? snapshot.val() : null
  }

  // Initialize default data
  static async initializeDefaultData(): Promise<void> {
    if (!db) {
      console.warn('Database not initialized, skipping pricing promotions initialization')
      return
    }
    
    const existingPrograms = await this.getAllLoyaltyPrograms()
    if (existingPrograms.length > 0) return

    const defaultLoyaltyProgram: Omit<LoyaltyProgram, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Sufianah Rewards',
      description: 'Earn points on every purchase and redeem for discounts',
      pointsPerDollar: 1,
      pointsPerPurchase: 10,
      redemptionRate: 100, // 100 points = $1
      tiers: [
        {
          name: 'Bronze',
          minPoints: 0,
          multiplier: 1,
          benefits: ['1 point per dollar', 'Basic support']
        },
        {
          name: 'Silver',
          minPoints: 1000,
          multiplier: 1.2,
          benefits: ['1.2 points per dollar', 'Priority support', 'Free shipping on orders over $50']
        },
        {
          name: 'Gold',
          minPoints: 5000,
          multiplier: 1.5,
          benefits: ['1.5 points per dollar', 'VIP support', 'Free shipping on all orders', 'Exclusive products']
        }
      ],
      isActive: true
    }

    await this.createLoyaltyProgram(defaultLoyaltyProgram)
  }
}
