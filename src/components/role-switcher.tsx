"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, type UserRole } from "@/contexts/auth-context"
import { User, Shield, CreditCard } from "lucide-react"

export function RoleSwitcher() {
  const { user, switchRole } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || "admin")

  // Only show role switcher for admins
  if (!user || user.role !== 'admin') {
    return null
  }

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole)
    switchRole(newRole)
    console.log(`Switched to ${newRole} role`)
  }

  const roleInfo = {
    admin: {
      name: "Administrator",
      icon: Shield,
      description: "Full access to all modules and settings",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    cashier: {
      name: "Cashier",
      icon: CreditCard,
      description: "Limited access to POS and basic operations",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    }
  }

  const currentRoleInfo = roleInfo[selectedRole]
  const IconComponent = currentRoleInfo.icon

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Role Switcher
        </CardTitle>
        <CardDescription>
          Switch between different user roles to test permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Current Role</label>
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="cashier">Cashier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={`p-4 rounded-lg border ${currentRoleInfo.bgColor} ${currentRoleInfo.borderColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className={`h-5 w-5 ${currentRoleInfo.color}`} />
            <span className={`font-medium ${currentRoleInfo.color}`}>
              {currentRoleInfo.name}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {currentRoleInfo.description}
          </p>
        </div>

        <div className="text-xs text-gray-500">
          <strong>Note:</strong> This is for development testing. In production, 
          user roles are managed by administrators.
        </div>
      </CardContent>
    </Card>
  )
}
