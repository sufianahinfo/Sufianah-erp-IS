// Migration script for existing invoice numbers
// This script helps migrate existing sales with timestamp-based invoice numbers
// to the new sequential numbering system

import { SalesService } from '../lib/firebase-services'
import { InvoiceCounterService } from '../lib/invoice-counter-service'

export class InvoiceMigrationService {
  /**
   * Analyze existing sales to understand the current invoice number format
   */
  static async analyzeExistingSales(): Promise<{
    totalSales: number
    timestampBasedInvoices: number
    sequentialInvoices: number
    otherFormatInvoices: number
    sampleInvoices: string[]
  }> {
    console.log('=== Analyzing Existing Sales ===')
    
    try {
      const allSales = await SalesService.getAllSales()
      const totalSales = allSales.length
      
      let timestampBasedInvoices = 0
      let sequentialInvoices = 0
      let otherFormatInvoices = 0
      const sampleInvoices: string[] = []
      
      for (const sale of allSales) {
        const invoiceNumber = sale.invoiceNumber
        
        // Check if it's timestamp-based (INV- followed by numbers)
        if (invoiceNumber.startsWith('INV-') && /^\d+$/.test(invoiceNumber.substring(4))) {
          timestampBasedInvoices++
        }
        // Check if it's already sequential (just numbers)
        else if (/^\d+$/.test(invoiceNumber)) {
          sequentialInvoices++
        }
        // Other formats
        else {
          otherFormatInvoices++
        }
        
        // Collect sample invoices
        if (sampleInvoices.length < 10) {
          sampleInvoices.push(invoiceNumber)
        }
      }
      
      const analysis = {
        totalSales,
        timestampBasedInvoices,
        sequentialInvoices,
        otherFormatInvoices,
        sampleInvoices
      }
      
      console.log('Analysis Results:')
      console.log(`- Total sales: ${totalSales}`)
      console.log(`- Timestamp-based invoices: ${timestampBasedInvoices}`)
      console.log(`- Sequential invoices: ${sequentialInvoices}`)
      console.log(`- Other format invoices: ${otherFormatInvoices}`)
      console.log('Sample invoices:', sampleInvoices)
      
      return analysis
      
    } catch (error) {
      console.error('Error analyzing sales:', error)
      throw error
    }
  }
  
  /**
   * Set the invoice counter to a specific value based on existing sales
   * This should be used when migrating from timestamp-based to sequential numbering
   */
  static async setCounterBasedOnExistingSales(): Promise<void> {
    console.log('=== Setting Counter Based on Existing Sales ===')
    
    try {
      const analysis = await this.analyzeExistingSales()
      
      if (analysis.sequentialInvoices > 0) {
        // If there are already sequential invoices, find the highest one
        const allSales = await SalesService.getAllSales()
        let highestSequentialNumber = 999 // Start below 1000
        
        for (const sale of allSales) {
          const invoiceNumber = sale.invoiceNumber
          if (/^\d+$/.test(invoiceNumber)) {
            const number = parseInt(invoiceNumber)
            if (number > highestSequentialNumber) {
              highestSequentialNumber = number
            }
          }
        }
        
        console.log(`Found highest sequential invoice number: ${highestSequentialNumber}`)
        console.log(`Setting counter to: ${highestSequentialNumber}`)
        
        await InvoiceCounterService.setCounter(highestSequentialNumber)
        
      } else {
        // No sequential invoices found, start from 1000
        console.log('No sequential invoices found, starting from 1000')
        await InvoiceCounterService.resetCounter()
      }
      
      console.log('✅ Counter set successfully')
      
    } catch (error) {
      console.error('Error setting counter:', error)
      throw error
    }
  }
  
  /**
   * Generate a report of invoice number distribution
   */
  static async generateInvoiceReport(): Promise<void> {
    console.log('=== Invoice Number Report ===')
    
    try {
      const analysis = await this.analyzeExistingSales()
      const currentCounter = await InvoiceCounterService.getCurrentCounter()
      
      console.log('')
      console.log('📊 INVOICE NUMBER REPORT')
      console.log('=======================')
      console.log(`Total Sales: ${analysis.totalSales}`)
      console.log(`Current Counter: ${currentCounter}`)
      console.log('')
      console.log('Invoice Number Types:')
      console.log(`- Timestamp-based (INV-XXXXX): ${analysis.timestampBasedInvoices}`)
      console.log(`- Sequential (XXXX): ${analysis.sequentialInvoices}`)
      console.log(`- Other formats: ${analysis.otherFormatInvoices}`)
      console.log('')
      console.log('Sample Invoice Numbers:')
      analysis.sampleInvoices.forEach((invoice, index) => {
        console.log(`  ${index + 1}. ${invoice}`)
      })
      console.log('')
      console.log('Next Invoice Number Will Be:', currentCounter + 1)
      
    } catch (error) {
      console.error('Error generating report:', error)
      throw error
    }
  }
}

// Export for use in other files
export default InvoiceMigrationService

// Usage:
// For analysis: InvoiceMigrationService.analyzeExistingSales()
// For setting counter: InvoiceMigrationService.setCounterBasedOnExistingSales()
// For report: InvoiceMigrationService.generateInvoiceReport()
