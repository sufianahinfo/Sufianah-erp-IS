// Quick script to reset users to default credentials
import { AuthService } from '../lib/auth-service'

async function resetUsers() {
  console.log('🔄 Resetting users to default credentials...')
  
  try {
    await AuthService.resetToDefaultUsers()
    console.log('✅ Users reset successfully!')
    console.log('📧 Admin: admin@sufianah.com / Admin1@control')
    console.log('📧 Cashier: cashier@sufianah.com / cashier123@@')
  } catch (error) {
    console.error('❌ Error resetting users:', error)
  }
}

// Run the reset
resetUsers()
