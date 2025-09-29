import { ref, get, set } from "firebase/database"
import { db } from "./firebase"

export class SupplierInvoiceCounterService {
  private static readonly COUNTER_PATH = "settings/supplierInvoiceCounter"

  static async getNextSupplierInvoiceNumber(): Promise<string> {
    if (!db) {
      throw new Error("Firebase not initialized")
    }

    try {
      const counterRef = ref(db, this.COUNTER_PATH)
      const snapshot = await get(counterRef)
      
      let currentNumber = 1000 // Start from 1000-S
      
      if (snapshot.exists()) {
        currentNumber = snapshot.val() || 1000
      }
      
      const nextNumber = currentNumber + 1
      const invoiceNumber = `${nextNumber}-S`
      
      // Update the counter in Firebase
      await set(counterRef, nextNumber)
      
      return invoiceNumber
    } catch (error) {
      console.error("Error getting next supplier invoice number:", error)
      // Fallback to timestamp-based number
      const timestamp = Date.now()
      return `${timestamp}-S`
    }
  }

  static async getCurrentSupplierInvoiceNumber(): Promise<number> {
    if (!db) {
      throw new Error("Firebase not initialized")
    }

    try {
      const counterRef = ref(db, this.COUNTER_PATH)
      const snapshot = await get(counterRef)
      
      return snapshot.exists() ? snapshot.val() || 1000 : 1000
    } catch (error) {
      console.error("Error getting current supplier invoice number:", error)
      return 1000
    }
  }

  static async resetSupplierInvoiceCounter(startNumber: number = 1000): Promise<void> {
    if (!db) {
      throw new Error("Firebase not initialized")
    }

    try {
      const counterRef = ref(db, this.COUNTER_PATH)
      await set(counterRef, startNumber)
    } catch (error) {
      console.error("Error resetting supplier invoice counter:", error)
      throw error
    }
  }
}
