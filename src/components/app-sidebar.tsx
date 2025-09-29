"use client"

import { BarChart3, ShoppingCart, Package, Users, CreditCard, FileText, Trash2, TrendingDown, Warehouse, User, Receipt, ShoppingBag, Building2, FileSpreadsheet, Shield, Printer, Percent, DollarSign } from "lucide-react"

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,  }
 from "@/components/ui/sidebar"

import Image from "next/image"
import { useAuth, type UserRole } from "@/contexts/auth-context"

// Menu item interface
interface MenuItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  id: string
  allowedRoles: UserRole[]
}

// Organized menu items by logical groups with role permissions
const salesAndPurchasingItems: MenuItem[] = [
  {
    title: "POS System",
    icon: ShoppingCart,
    id: "pos",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Purchasing",
    icon: ShoppingBag,
    id: "purchasing",
    allowedRoles: ["admin"],
  },
  {
    title: "Sales Ledger",
    icon: FileText,
    id: "sales-ledger",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Purchasing Ledger",
    icon: FileSpreadsheet,
    id: "purchasing-ledger",
    allowedRoles: ["admin"],
  },
  {
    title: "Customer Management",
    icon: User,
    id: "customer-management",
    allowedRoles: ["admin"],
  },
  {
    title: "Supplier Management",
    icon: Building2,
    id: "supplier-management",
    allowedRoles: ["admin"],
  },
]

const inventoryItems: MenuItem[] = [
  {
    title: "Products & Pricing",
    icon: Package,
    id: "products",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Inventory Management",
    icon: Warehouse,
    id: "inventory",
    allowedRoles: ["admin"],
  },
  {
    title: "Advanced Inventory",
    icon: Package,
    id: "advanced-inventory",
    allowedRoles: ["admin"],
  },
  {
    title: "Label & Sticker Printing",
    icon: Printer,
    id: "label-printing",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Bargaining Tracker",
    icon: TrendingDown,
    id: "bargaining",
    allowedRoles: ["admin"],
  },
  {
    title: "Credit Node (Returns)",
    icon: Trash2,
    id: "disposal",
    allowedRoles: ["admin"],
  },
]

const financialItems: MenuItem[] = [
  {
    title: "Credit & Debit Ledger",
    icon: CreditCard,
    id: "credit-debit",
    allowedRoles: ["admin"],
  },
  {
    title: "Daily Expenses",
    icon: Receipt,
    id: "daily-expenses",
    allowedRoles: ["admin"],
  },
  {
    title: "Pricing & Promotions",
    icon: Percent,
    id: "pricing-promotions",
    allowedRoles: ["admin"],
  },
]

const managementItems: MenuItem[] = [
  {
    title: "Employee Management",
    icon: Users,
    id: "employees",
    allowedRoles: ["admin"],
  },
  {
    title: "Employee Ledger",
    icon: DollarSign,
    id: "employee-ledger",
    allowedRoles: ["admin"],
  },
  {
    title: "Supplier Ledger",
    icon: FileSpreadsheet,
    id: "supplier-ledger",
    allowedRoles: ["admin"],
  },
  {
    title: "Custom Inventory",
    icon: Package,
    id: "custom-inventory",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Branch Management",
    icon: Building2,
    id: "branch-management",
    allowedRoles: ["admin"],
  },
  {
    title: "Role Management",
    icon: Shield,
    id: "role-management",
    allowedRoles: ["admin"],
  },
]

const analyticsItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: BarChart3,
    id: "dashboard",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Reports & Analytics",
    icon: BarChart3,
    id: "reports",
    allowedRoles: ["admin"],
  },
]

// Helper function to filter menu items based on user role
const filterMenuItemsByRole = (items: MenuItem[], userRole: UserRole): MenuItem[] => {
  return items.filter(item => item.allowedRoles.includes(userRole))
}

interface AppSidebarProps {
  activeModule: string
  setActiveModule: (module: string) => void
}

export function AppSidebar({ activeModule, setActiveModule }: AppSidebarProps) {
  const { user } = useAuth()
  
  // Filter menu items based on user role
  const filteredAnalyticsItems = filterMenuItemsByRole(analyticsItems, user?.role || 'admin')
  const filteredSalesAndPurchasingItems = filterMenuItemsByRole(salesAndPurchasingItems, user?.role || 'admin')
  const filteredInventoryItems = filterMenuItemsByRole(inventoryItems, user?.role || 'admin')
  const filteredFinancialItems = filterMenuItemsByRole(financialItems, user?.role || 'admin')
  const filteredManagementItems = filterMenuItemsByRole(managementItems, user?.role || 'admin')

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl">
            <Image 
              src="/sufianah-logo.svg" 
              alt="Sufianah Islamic Store Logo" 
              width={100} height={100}
              className="h-12 w-12 object-contain mix-blend-multiply dark:mix-blend-screen dark:invert"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">Sufianah Islamic Store</span>
            <span className="text-xs text-muted-foreground">ERP-POS System</span>
            {user && (
              <span className="text-xs text-blue-600 font-medium">
                {user.role === 'admin' ? 'Administrator' : 'Cashier'}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pb-16">
        {/* Analytics */}
        {filteredAnalyticsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAnalyticsItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sales & Purchasing */}
        {filteredSalesAndPurchasingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Sales & Purchasing</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSalesAndPurchasingItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Inventory */}
        {filteredInventoryItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Inventory</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredInventoryItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Financial */}
        {filteredFinancialItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Financial</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredFinancialItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Management */}
        {filteredManagementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredManagementItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}