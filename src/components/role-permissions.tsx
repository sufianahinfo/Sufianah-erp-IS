"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye, Edit, Trash, Plus } from "lucide-react"
import { type UserRole } from "@/contexts/auth-context"

interface Permission {
  module: string
  description: string
  admin: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
  cashier: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
}

const permissions: Permission[] = [
  {
    module: "Dashboard",
    description: "Business overview and analytics",
    admin: { view: true, create: false, edit: false, delete: false },
    cashier: { view: true, create: false, edit: false, delete: false }
  },
  {
    module: "POS System",
    description: "Point of sale operations",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: true, create: true, edit: true, delete: false }
  },
  {
    module: "Products & Pricing",
    description: "Product management and pricing",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: true, create: false, edit: false, delete: false }
  },
  {
    module: "Inventory Management",
    description: "Stock and inventory control",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: true, create: false, edit: false, delete: false }
  },
  {
    module: "Customer Management",
    description: "Customer database and relationships",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: true, create: true, edit: true, delete: false }
  },
  {
    module: "Sales Ledger",
    description: "Sales records and transactions",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: true, create: true, edit: true, delete: false }
  },
  {
    module: "Purchasing",
    description: "Purchase orders and supplier management",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: false, create: false, edit: false, delete: false }
  },
  {
    module: "Supplier Management",
    description: "Supplier database and relationships",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: false, create: false, edit: false, delete: false }
  },
  {
    module: "Employee Management",
    description: "Staff management and HR",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: false, create: false, edit: false, delete: false }
  },
  {
    module: "Financial Management",
    description: "Ledgers, expenses, and financial reports",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: true, create: false, edit: false, delete: false }
  },
  {
    module: "Reports & Analytics",
    description: "Business intelligence and reporting",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: true, create: false, edit: false, delete: false }
  },
  {
    module: "Role Management",
    description: "User roles and permissions",
    admin: { view: true, create: true, edit: true, delete: true },
    cashier: { view: false, create: false, edit: false, delete: false }
  }
]

interface RolePermissionsProps {
  selectedRole: UserRole
}

export function RolePermissions({ selectedRole }: RolePermissionsProps) {
  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    )
  }

  const getPermissionBadge = (permission: Permission, role: UserRole) => {
    const rolePermissions = permission[role]
    const hasAnyPermission = Object.values(rolePermissions).some(Boolean)
    
    if (!hasAnyPermission) {
      return <Badge variant="destructive">No Access</Badge>
    }
    
    const permissions = []
    if (rolePermissions.view) permissions.push("View")
    if (rolePermissions.create) permissions.push("Create")
    if (rolePermissions.edit) permissions.push("Edit")
    if (rolePermissions.delete) permissions.push("Delete")
    
    return <Badge variant="secondary">{permissions.join(", ")}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {selectedRole === "admin" ? "Administrator" : "Cashier"} Permissions
        </CardTitle>
        <CardDescription>
          Detailed breakdown of what {selectedRole === "admin" ? "administrators" : "cashiers"} can access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {permissions.map((permission, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{permission.module}</h4>
                  {getPermissionIcon(permission[selectedRole].view)}
                </div>
                <p className="text-sm text-gray-600">{permission.description}</p>
              </div>
              <div className="ml-4">
                {getPermissionBadge(permission, selectedRole)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Permission Legend:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>View - Can see and read data</span>
            </div>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Create - Can add new records</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span>Edit - Can modify existing data</span>
            </div>
            <div className="flex items-center gap-2">
              <Trash className="h-4 w-4" />
              <span>Delete - Can remove records</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
