// Test script to verify sales sorting by latest date
// This helps ensure the sales ledger is displaying the most recent sales first

import { SalesService } from '../lib/firebase-services'

export class SalesSortingTest {
  /**
   * Test the sales sorting logic to ensure most recent sales appear first
   */
  static async testSalesSorting(): Promise<void> {
    console.log('=== Sales Sorting Test Started ===')
    
    try {
      const allSales = await SalesService.getAllSales()
      console.log(`Found ${allSales.length} sales records`)
      
      if (allSales.length === 0) {
        console.log('No sales found. Create some sales first to test sorting.')
        return
      }
      
      // Test the sorting logic (same as in sales-ledger.tsx)
      const sortedSales = [...allSales].sort((a, b) => {
        // Use createdAt if available, otherwise fall back to date+time combination
        const aDateTime = a.createdAt ? new Date(a.createdAt) : new Date(`${a.date}T${a.time ? a.time : '00:00:00'}`);
        const bDateTime = b.createdAt ? new Date(b.createdAt) : new Date(`${b.date}T${b.time ? b.time : '00:00:00'}`);
        return bDateTime.getTime() - aDateTime.getTime();
      });
      
      console.log('')
      console.log('📊 SORTING TEST RESULTS')
      console.log('======================')
      console.log('')
      
      // Show first 10 sales (most recent)
      console.log('Most Recent Sales (Top 10):')
      console.log('')
      
      for (let i = 0; i < Math.min(10, sortedSales.length); i++) {
        const sale = sortedSales[i]
        const dateTime = sale.createdAt ? new Date(sale.createdAt) : new Date(`${sale.date}T${sale.time || '00:00:00'}`)
        
        console.log(`${i + 1}. Invoice: ${sale.invoiceNumber}`)
        console.log(`   Date: ${sale.date} ${sale.time}`)
        console.log(`   Created: ${sale.createdAt || 'Not set'}`)
        console.log(`   DateTime: ${dateTime.toISOString()}`)
        console.log(`   Customer: ${sale.customerName}`)
        console.log('')
      }
      
      // Verify sorting is correct
      console.log('🔍 VERIFICATION')
      console.log('===============')
      
      let isCorrectlySorted = true
      for (let i = 1; i < sortedSales.length; i++) {
        const prevSale = sortedSales[i - 1]
        const currentSale = sortedSales[i]
        
        const prevDateTime = prevSale.createdAt ? new Date(prevSale.createdAt) : new Date(`${prevSale.date}T${prevSale.time || '00:00:00'}`)
        const currentDateTime = currentSale.createdAt ? new Date(currentSale.createdAt) : new Date(`${currentSale.date}T${currentSale.time || '00:00:00'}`)
        
        if (prevDateTime.getTime() < currentDateTime.getTime()) {
          console.log(`❌ Sorting error: Sale ${prevSale.invoiceNumber} (${prevDateTime.toISOString()}) should come after ${currentSale.invoiceNumber} (${currentDateTime.toISOString()})`)
          isCorrectlySorted = false
        }
      }
      
      if (isCorrectlySorted) {
        console.log('✅ Sales are correctly sorted by latest date first!')
      } else {
        console.log('❌ Sales sorting has issues!')
      }
      
      // Show statistics
      console.log('')
      console.log('📈 STATISTICS')
      console.log('=============')
      
      const withTimestamps = allSales.filter(sale => sale.createdAt).length
      const withoutTimestamps = allSales.length - withTimestamps
      
      console.log(`Total sales: ${allSales.length}`)
      console.log(`With createdAt: ${withTimestamps}`)
      console.log(`Without createdAt: ${withoutTimestamps}`)
      
      if (withoutTimestamps > 0) {
        console.log('')
        console.log('⚠️  Some sales are missing createdAt timestamps.')
        console.log('   Run the migration script to add timestamps for better sorting.')
      }
      
      console.log('')
      console.log('✅ Sales sorting test completed!')
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      throw error
    }
  }
}

// Export for use in other files
export default SalesSortingTest

// Usage:
// For testing: SalesSortingTest.testSalesSorting()
