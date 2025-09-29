// Migration script to add createdAt and updatedAt timestamps to existing sales
// This ensures all sales have proper timestamps for accurate sorting

import { SalesService } from '../lib/firebase-services'
import { db } from '../lib/firebase'

export class SalesTimestampMigration {
  /**
   * Add createdAt and updatedAt timestamps to sales that don't have them
   */
  static async migrateSalesTimestamps(): Promise<void> {
    console.log('=== Sales Timestamp Migration Started ===')
    
    if (!db) {
      throw new Error('Database not initialized')
    }

    try {
      const allSales = await SalesService.getAllSales()
      console.log(`Found ${allSales.length} sales records`)
      
      let updatedCount = 0
      let skippedCount = 0
      
      for (const sale of allSales) {
        const needsUpdate = !sale.createdAt || !sale.updatedAt
        
        if (needsUpdate) {
          // Create timestamps based on existing date and time
          const saleDateTime = new Date(`${sale.date}T${sale.time || '00:00:00'}`)
          const timestamp = saleDateTime.toISOString()
          
          // Update the sale record
          await SalesService.updateSale(sale.id, {
            createdAt: timestamp,
            updatedAt: timestamp
          })
          
          updatedCount++
          console.log(`Updated sale ${sale.invoiceNumber} with timestamps`)
        } else {
          skippedCount++
        }
      }
      
      console.log('')
      console.log('=== Migration Results ===')
      console.log(`Total sales: ${allSales.length}`)
      console.log(`Updated: ${updatedCount}`)
      console.log(`Skipped (already have timestamps): ${skippedCount}`)
      console.log('')
      console.log('✅ Sales timestamp migration completed successfully!')
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }
  
  /**
   * Analyze sales records to see which ones need timestamp migration
   */
  static async analyzeSalesTimestamps(): Promise<{
    totalSales: number
    withTimestamps: number
    withoutTimestamps: number
    sampleRecords: Array<{
      invoiceNumber: string
      date: string
      time: string
      hasCreatedAt: boolean
      hasUpdatedAt: boolean
    }>
  }> {
    console.log('=== Analyzing Sales Timestamps ===')
    
    try {
      const allSales = await SalesService.getAllSales()
      const totalSales = allSales.length
      
      let withTimestamps = 0
      let withoutTimestamps = 0
      const sampleRecords: Array<{
        invoiceNumber: string
        date: string
        time: string
        hasCreatedAt: boolean
        hasUpdatedAt: boolean
      }> = []
      
      for (const sale of allSales) {
        const hasCreatedAt = !!sale.createdAt
        const hasUpdatedAt = !!sale.updatedAt
        
        if (hasCreatedAt && hasUpdatedAt) {
          withTimestamps++
        } else {
          withoutTimestamps++
        }
        
        // Collect sample records
        if (sampleRecords.length < 10) {
          sampleRecords.push({
            invoiceNumber: sale.invoiceNumber,
            date: sale.date,
            time: sale.time,
            hasCreatedAt,
            hasUpdatedAt
          })
        }
      }
      
      const analysis = {
        totalSales,
        withTimestamps,
        withoutTimestamps,
        sampleRecords
      }
      
      console.log('Analysis Results:')
      console.log(`- Total sales: ${totalSales}`)
      console.log(`- With timestamps: ${withTimestamps}`)
      console.log(`- Without timestamps: ${withoutTimestamps}`)
      console.log('')
      console.log('Sample Records:')
      sampleRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.invoiceNumber} (${record.date} ${record.time})`)
        console.log(`     createdAt: ${record.hasCreatedAt ? '✅' : '❌'}, updatedAt: ${record.hasUpdatedAt ? '✅' : '❌'}`)
      })
      
      return analysis
      
    } catch (error) {
      console.error('Error analyzing sales timestamps:', error)
      throw error
    }
  }
}

// Export for use in other files
export default SalesTimestampMigration

// Usage:
// For analysis: SalesTimestampMigration.analyzeSalesTimestamps()
// For migration: SalesTimestampMigration.migrateSalesTimestamps()
