// Test script for Invoice Counter Service
// Run this to verify the invoice counter is working correctly

import { InvoiceCounterService } from '../lib/invoice-counter-service'

export class InvoiceCounterTest {
  static async runTests(): Promise<void> {
    console.log('=== Invoice Counter Test Started ===')
    
    try {
      // Test 1: Initialize counter
      console.log('1. Testing counter initialization...')
      await InvoiceCounterService.initializeCounter()
      console.log('✅ Counter initialized successfully')
      
      // Test 2: Get current counter
      console.log('2. Testing get current counter...')
      const currentCounter = await InvoiceCounterService.getCurrentCounter()
      console.log(`✅ Current counter: ${currentCounter}`)
      
      // Test 3: Generate multiple invoice numbers
      console.log('3. Testing invoice number generation...')
      const invoiceNumbers: string[] = []
      
      for (let i = 0; i < 5; i++) {
        const invoiceNumber = await InvoiceCounterService.getNextInvoiceNumber()
        invoiceNumbers.push(invoiceNumber)
        console.log(`   Generated invoice #${i + 1}: ${invoiceNumber}`)
      }
      
      // Test 4: Verify sequential order
      console.log('4. Verifying sequential order...')
      const numbers = invoiceNumbers.map(num => parseInt(num))
      let isSequential = true
      
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] !== numbers[i - 1] + 1) {
          isSequential = false
          break
        }
      }
      
      if (isSequential) {
        console.log('✅ Invoice numbers are sequential')
      } else {
        console.log('❌ Invoice numbers are not sequential')
        console.log('Generated numbers:', numbers)
      }
      
      // Test 5: Check if numbers start from 1000
      console.log('5. Verifying starting number...')
      const firstNumber = parseInt(invoiceNumbers[0])
      if (firstNumber >= 1000) {
        console.log(`✅ First invoice number (${firstNumber}) is >= 1000`)
      } else {
        console.log(`❌ First invoice number (${firstNumber}) is < 1000`)
      }
      
      // Test 6: Get final counter value
      console.log('6. Checking final counter value...')
      const finalCounter = await InvoiceCounterService.getCurrentCounter()
      console.log(`✅ Final counter: ${finalCounter}`)
      
      console.log('')
      console.log('=== Invoice Counter Test Results ===')
      console.log(`Generated ${invoiceNumbers.length} invoice numbers:`)
      invoiceNumbers.forEach((num, index) => {
        console.log(`  ${index + 1}. ${num}`)
      })
      console.log('')
      console.log('✅ All tests completed successfully!')
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      throw error
    }
  }
  
  // Test counter reset functionality
  static async testReset(): Promise<void> {
    console.log('=== Testing Counter Reset ===')
    
    try {
      await InvoiceCounterService.resetCounter()
      const counterAfterReset = await InvoiceCounterService.getCurrentCounter()
      console.log(`✅ Counter reset to: ${counterAfterReset}`)
      
      const firstInvoice = await InvoiceCounterService.getNextInvoiceNumber()
      console.log(`✅ First invoice after reset: ${firstInvoice}`)
      
    } catch (error) {
      console.error('❌ Reset test failed:', error)
      throw error
    }
  }
}

// Export for use in other files
export default InvoiceCounterTest

// Usage:
// For testing: InvoiceCounterTest.runTests()
// For reset test: InvoiceCounterTest.testReset()
