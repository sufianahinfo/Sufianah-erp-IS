import { ref, get, set, push, update, remove, query, orderByChild, equalTo } from 'firebase/database'
import { db } from './firebase'
import type { LabelTemplate, LabelPrintJob, PrinterConfig } from '@/types/custom'

export class LabelPrintingService {
  private static readonly LABEL_TEMPLATES_PATH = 'labelTemplates'
  private static readonly PRINT_JOBS_PATH = 'labelPrintJobs'
  private static readonly PRINTERS_PATH = 'printers'

  // Label Templates
  static async createTemplate(template: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const templateRef = push(ref(db, this.LABEL_TEMPLATES_PATH))
    const templateId = templateRef.key!
    
    const templateData: LabelTemplate = {
      ...template,
      id: templateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(templateRef, templateData)
    return templateId
  }

  static async getAllTemplates(): Promise<LabelTemplate[]> {
    const snapshot = await get(ref(db, this.LABEL_TEMPLATES_PATH))
    if (!snapshot.exists()) return []
    
    const templates: LabelTemplate[] = []
    snapshot.forEach((child) => {
      templates.push(child.val())
    })
    
    return templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async getTemplate(templateId: string): Promise<LabelTemplate | null> {
    const snapshot = await get(ref(db, `${this.LABEL_TEMPLATES_PATH}/${templateId}`))
    return snapshot.exists() ? snapshot.val() : null
  }

  static async updateTemplate(templateId: string, updates: Partial<LabelTemplate>): Promise<void> {
    const templateRef = ref(db, `${this.LABEL_TEMPLATES_PATH}/${templateId}`)
    await update(templateRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  static async deleteTemplate(templateId: string): Promise<void> {
    const templateRef = ref(db, `${this.LABEL_TEMPLATES_PATH}/${templateId}`)
    await remove(templateRef)
  }

  // Print Jobs
  static async createPrintJob(job: Omit<LabelPrintJob, 'id' | 'createdAt'>): Promise<string> {
    const jobRef = push(ref(db, this.PRINT_JOBS_PATH))
    const jobId = jobRef.key!
    
    const jobData: LabelPrintJob = {
      ...job,
      id: jobId,
      createdAt: new Date().toISOString()
    }
    
    await set(jobRef, jobData)
    return jobId
  }

  static async getAllPrintJobs(): Promise<LabelPrintJob[]> {
    const snapshot = await get(ref(db, this.PRINT_JOBS_PATH))
    if (!snapshot.exists()) return []
    
    const jobs: LabelPrintJob[] = []
    snapshot.forEach((child) => {
      jobs.push(child.val())
    })
    
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static async updatePrintJob(jobId: string, updates: Partial<LabelPrintJob>): Promise<void> {
    const jobRef = ref(db, `${this.PRINT_JOBS_PATH}/${jobId}`)
    await update(jobRef, updates)
  }

  // Printer Configuration
  static async createPrinter(printer: Omit<PrinterConfig, 'id'>): Promise<string> {
    const printerRef = push(ref(db, this.PRINTERS_PATH))
    const printerId = printerRef.key!
    
    const printerData: PrinterConfig = {
      ...printer,
      id: printerId
    }
    
    await set(printerRef, printerData)
    return printerId
  }

  static async getAllPrinters(): Promise<PrinterConfig[]> {
    const snapshot = await get(ref(db, this.PRINTERS_PATH))
    if (!snapshot.exists()) return []
    
    const printers: PrinterConfig[] = []
    snapshot.forEach((child) => {
      printers.push(child.val())
    })
    
    return printers
  }

  static async getDefaultPrinter(): Promise<PrinterConfig | null> {
    const q = query(ref(db, this.PRINTERS_PATH), orderByChild('isDefault'), equalTo(true))
    const snapshot = await get(q)
    
    if (!snapshot.exists()) return null
    
    let defaultPrinter: PrinterConfig | null = null
    snapshot.forEach((child) => {
      defaultPrinter = child.val()
    })
    
    return defaultPrinter
  }

  static async updatePrinter(printerId: string, updates: Partial<PrinterConfig>): Promise<void> {
    const printerRef = ref(db, `${this.PRINTERS_PATH}/${printerId}`)
    await update(printerRef, updates)
  }

  static async deletePrinter(printerId: string): Promise<void> {
    const printerRef = ref(db, `${this.PRINTERS_PATH}/${printerId}`)
    await remove(printerRef)
  }

  // Utility methods
  static generateBarcode(productCode: string): string {
    // Simple barcode generation - in production, use a proper barcode library
    return `*${productCode}*`
  }

  static generateQRCode(productCode: string): string {
    // QR code generation - in production, use a proper QR library
    return `QR:${productCode}`
  }

  static async printLabel(templateId: string, productId: string, quantity: number = 1): Promise<string> {
    // Create print job
    const jobId = await this.createPrintJob({
      templateId,
      productId,
      quantity,
      status: 'pending'
    })

    // In a real implementation, this would trigger the actual printing
    // For now, we'll simulate the printing process
    setTimeout(async () => {
      await this.updatePrintJob(jobId, {
        status: 'printing'
      })
      
      // Simulate printing delay
      setTimeout(async () => {
        await this.updatePrintJob(jobId, {
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      }, 2000)
    }, 100)

    return jobId
  }

  // Initialize default templates
  static async initializeDefaultTemplates(): Promise<void> {
    if (!db) {
      console.warn('Database not initialized, skipping label template initialization')
      return
    }
    
    const existingTemplates = await this.getAllTemplates()
    if (existingTemplates.length > 0) return

    const defaultTemplates = [
      {
        name: 'Small Product Label',
        type: 'product' as const,
        size: { width: 25, height: 15 },
        layout: {
          showProductName: true,
          showPrice: true,
          showBarcode: true,
          showQRCode: false,
          showArabicName: false,
          showUrduName: false,
          fontSize: 8,
          fontFamily: 'Arial',
          textAlign: 'center' as const,
          margin: { top: 1, right: 1, bottom: 1, left: 1 }
        },
        printerSettings: {
          printerType: 'zebra' as const,
          dpi: 203,
          printSpeed: 4,
          darkness: 8
        }
      },
      {
        name: 'Medium Price Label',
        type: 'price' as const,
        size: { width: 40, height: 25 },
        layout: {
          showProductName: true,
          showPrice: true,
          showBarcode: false,
          showQRCode: false,
          showArabicName: true,
          showUrduName: true,
          fontSize: 12,
          fontFamily: 'Arial',
          textAlign: 'center' as const,
          margin: { top: 2, right: 2, bottom: 2, left: 2 }
        },
        printerSettings: {
          printerType: 'brother' as const,
          dpi: 300,
          printSpeed: 3,
          darkness: 10
        }
      },
      {
        name: 'Large Barcode Label',
        type: 'barcode' as const,
        size: { width: 60, height: 40 },
        layout: {
          showProductName: true,
          showPrice: true,
          showBarcode: true,
          showQRCode: true,
          showArabicName: false,
          showUrduName: false,
          fontSize: 14,
          fontFamily: 'Arial',
          textAlign: 'center' as const,
          margin: { top: 3, right: 3, bottom: 3, left: 3 }
        },
        printerSettings: {
          printerType: 'zebra' as const,
          dpi: 300,
          printSpeed: 2,
          darkness: 12
        }
      }
    ]

    for (const template of defaultTemplates) {
      await this.createTemplate(template)
    }
  }
}
