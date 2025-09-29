"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Utensils, Coffee, FileText, Wrench, DollarSign } from "lucide-react"
import { type Employee } from "@/lib/firebase-services"

const EXPENSE_TYPE_OPTIONS = [
  { value: "food", label: "Food", icon: Utensils },
  { value: "beverages", label: "Beverages", icon: Coffee },
  { value: "utilities", label: "Utilities", icon: FileText },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "other", label: "Other", icon: DollarSign },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile", label: "Mobile Payment" },
]

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

interface Expense{
    date: string
    category: string
    description: string
    amount: string
    expenseType: string
    customerRelated: boolean
    customerName: string
    customerPhone: string
    staffMember: string
    paymentMethod: string
    receiptNumber: string
    notes: string
    status: string
}

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newExpense: Expense
  setNewExpense: (expense: Expense) => void
  employees: Employee[]
  onSubmit: () => void
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  newExpense,
  setNewExpense,
  employees,
  onSubmit
}: AddExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Daily Expense</DialogTitle>
          <DialogDescription>Record daily expenses including customer-related costs</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount (Rs)</Label>
              <Input
                id="amount"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expenseType">Expense Type</Label>
              <Select
                value={newExpense.expenseType}
                onValueChange={(value) => setNewExpense({ ...newExpense, expenseType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                placeholder="e.g., Customer Refreshments"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="e.g., Coffee and snacks for VIP customers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staffMember">Staff Member</Label>
              <Select
                value={newExpense.staffMember}
                onValueChange={(value) => setNewExpense({ ...newExpense, staffMember: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.name}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={newExpense.paymentMethod}
                onValueChange={(value) => setNewExpense({ ...newExpense, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              type="checkbox"
              id="customerRelated"
              checked={newExpense.customerRelated}
              onChange={(e) => setNewExpense({ ...newExpense, customerRelated: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="customerRelated">Customer Related Expense</Label>
          </div>

          {newExpense.customerRelated && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={newExpense.customerName}
                  onChange={(e) => setNewExpense({ ...newExpense, customerName: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={newExpense.customerPhone}
                  onChange={(e) => setNewExpense({ ...newExpense, customerPhone: e.target.value })}
                  placeholder="Customer phone"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input
                id="receiptNumber"
                value={newExpense.receiptNumber}
                onChange={(e) => setNewExpense({ ...newExpense, receiptNumber: e.target.value })}
                placeholder="Optional receipt number"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={newExpense.status}
                onValueChange={(value) => setNewExpense({ ...newExpense, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newExpense.notes}
              onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
              placeholder="Additional notes about the expense"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Add Expense</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}