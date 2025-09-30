"use client"

import { useState, useEffect } from "react"
import { Dashboard } from "@/components/dashboard"
import { POSModule } from "@/components/pos-module"
import { ProductManagement } from "@/components/product-management"
import { InventoryManagement } from "@/components/inventory-management"
import { CreditDebitLedger } from "@/components/credit-debit-ledger"
import { BargainingTracker } from "@/components/bargaining-tracker"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { EmployeeManagement } from "@/components/employee-management"
import { ReportsModule } from "@/components/reports-module"
import { DisposalModule } from "@/components/disposal-module"
import { SalesLedger } from "@/components/sales-ledger"
import { CustomerManagement } from "@/components/customer-management"
import { DailyExpenseManagement } from "@/components/daily-expense-management"
import { PurchasingModule } from "@/components/purchasing-module"
import { PurchasingLedger } from "@/components/purchasing-ledger"
import { SupplierManagement } from "@/components/supplier-management"
import { RoleManagement } from "@/components/role-management"
import { LabelPrintingModule } from "@/components/label-printing-module"
import { BranchManagementModule } from "@/components/branch-management-module"
import { AdvancedInventoryModule } from "@/components/advanced-inventory-module"
import { PricingPromotionsModule } from "@/components/pricing-promotions-module"
import { EmployeeLedger } from "@/components/employee-ledger"
import { SupplierLedger } from "@/components/supplier-ledger"
import { CustomInventory } from "@/components/custom-inventory"
import { Button } from "@/components/ui/button"
// COMMENTED OUT FOR DEVELOPMENT - BYPASSING AUTHENTICATION
// import { ProtectedRoute } from "@/components/auth/protected-route"
import { RoleProtectedRoute } from "@/components/auth/role-protected-route"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangePasswordModal } from "@/components/profile/change-password-modal"
import { DevNotice } from "@/components/dev-notice"
import { RoleSwitcher } from "@/components/role-switcher"
import { RolePermissions } from "@/components/role-permissions"
import Image from "next/image"

export default function ERPSystem() {
  const [activeModule, setActiveModule] = useState("pos")
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showRoleTesting, setShowRoleTesting] = useState(false)
  const { user, logout } = useAuth()

  // Restore active module from localStorage on page load (synchronous for speed)
  useEffect(() => {
    try {
      const savedModule = localStorage.getItem('activeModule')
      if (savedModule) {
        setActiveModule(savedModule)
      }
    } catch (e) {
      console.warn("Failed to restore active module", e)
    } finally {
      setIsInitialized(true)
    }
  }, []) // Empty dependency array - only run once on mount

  // Save active module to localStorage when it changes (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('activeModule', activeModule)
    }
  }, [activeModule, isInitialized])


  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <Dashboard />
            {showRoleTesting && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RoleSwitcher />
                <RolePermissions selectedRole={user?.role || "admin"} />
              </div>
            )}
          </div>
        )
      case "pos":
        return <POSModule />
      case "purchasing":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <PurchasingModule defaultTab="purchase" />
          </RoleProtectedRoute>
        )
      case "supplier-management":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <SupplierManagement />
          </RoleProtectedRoute>
        )
      case "purchasing-ledger":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <PurchasingLedger />
          </RoleProtectedRoute>
        )
      case "products":
        return (
          <RoleProtectedRoute allowedRoles={["admin", "cashier"]}>
            <ProductManagement />
          </RoleProtectedRoute>
        )
      case "inventory":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <InventoryManagement />
          </RoleProtectedRoute>
        )
      case "advanced-inventory":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <AdvancedInventoryModule />
          </RoleProtectedRoute>
        )
      case "label-printing":
        return (
          <RoleProtectedRoute allowedRoles={["admin", "cashier"]}>
            <LabelPrintingModule />
          </RoleProtectedRoute>
        )
      case "bargaining":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <BargainingTracker />
          </RoleProtectedRoute>
        )
      case "credit-debit":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <CreditDebitLedger />
          </RoleProtectedRoute>
        )
      case "employees":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <EmployeeManagement />
          </RoleProtectedRoute>
        )
      case "branch-management":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <BranchManagementModule />
          </RoleProtectedRoute>
        )
      case "role-management":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <RoleManagement />
          </RoleProtectedRoute>
        )
      case "reports":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <ReportsModule />
          </RoleProtectedRoute>
        )
      case "customer-management":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <CustomerManagement />
          </RoleProtectedRoute>
        )
      case "daily-expenses":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <DailyExpenseManagement />
          </RoleProtectedRoute>
        )
      case "pricing-promotions":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <PricingPromotionsModule />
          </RoleProtectedRoute>
        )
      case "disposal":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <DisposalModule />
          </RoleProtectedRoute>
        )
      case "sales-ledger":
        return <SalesLedger />
      case "employee-ledger":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <EmployeeLedger />
          </RoleProtectedRoute>
        )
      case "supplier-ledger":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <SupplierLedger />
          </RoleProtectedRoute>
        )
      case "custom-inventory":
        return (
          <RoleProtectedRoute allowedRoles={["admin", "cashier"]}>
            <CustomInventory />
          </RoleProtectedRoute>
        )
      default:
        return <Dashboard />
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    // COMMENTED OUT FOR DEVELOPMENT - BYPASSING AUTHENTICATION
    <SidebarProvider>
      <AppSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="flex-1 overflow-hidden">
        <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex items-center">
            <SidebarTrigger />
            <Image src="/sufianah-logo.svg" alt="Sufianah Islamic Store Logo" className="h-12 w-auto ml-4" width={100} height={100} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoleTesting(!showRoleTesting)}
              className="text-xs"
            >
              {showRoleTesting ? "Hide" : "Show"} Role Testing
            </Button>
            {/* DEVELOPMENT MODE - SIMPLIFIED USER UI */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Development Mode</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                    <User className="h-4 w-4" />
                    {user?.displayName || "Admin User"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.displayName || "Admin User"}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Administrator (Development)
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Change Password (Disabled)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out (Disabled)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 lg:p-6 pb-8">
          <DevNotice />
          {renderModule()}
        </div>
      </main>
      
      <ChangePasswordModal 
        open={showChangePasswordModal} 
        onOpenChange={setShowChangePasswordModal} 
      />
    </SidebarProvider>
  )

  /* COMMENTED OUT ORIGINAL AUTHENTICATION WRAPPER
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
        <main className="flex-1 overflow-hidden">
          <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
            <div className="flex items-center">
              <SidebarTrigger />
              <Image src="/logo.png" alt="Sufianah Islamic Store Logo" className="h-12 w-auto ml-4" width={100} height={100} />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                      <User className="h-4 w-4" />
                      {user.displayName || user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.displayName || user.email}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {user.role === 'admin' ? 'Administrator' : 'Cashier'}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                      <User className="mr-2 h-4 w-4" />
                      Change Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 lg:p-6 pb-8">{renderModule()}</div>
        </main>
        
        <ChangePasswordModal 
          open={showChangePasswordModal} 
          onOpenChange={setShowChangePasswordModal} 
        />
      </SidebarProvider>
    </ProtectedRoute>
  )
  */
}