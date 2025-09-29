"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Utensils, Coffee, FileText, Wrench, DollarSign } from "lucide-react"
import { type Employee, type DailyExpense } from "@/lib/firebase-services"

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

interface EditExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editExpense: DailyExpense | null
  setEditExpense: (expense: DailyExpense | null) => void
  employees: Employee[]
  onSubmit: () => void
}

export function EditExpenseDialog({
  open,
  onOpenChange,
  editExpense,
  setEditExpense,
  employees,
  onSubmit
}: EditExpenseDialogProps) {
  if (!editExpense) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>Update expense details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editExpense.date}
                onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-amount">Amount (Rs)</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editExpense.amount}
                onChange={(e) => setEditExpense({ ...editExpense, amount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-expenseType">Expense Type</Label>
              <Select
                value={editExpense.expenseType}
                onValueChange={(value) => setEditExpense({ ...editExpense, expenseType: value as "food" | "beverages" | "utilities" | "maintenance" | "other" })}
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
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={editExpense.category}
                onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={editExpense.description}
              onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-staffMember">Staff Member</Label>
              <Select
                value={editExpense.staffMember}
                onValueChange={(value) => setEditExpense({ ...editExpense, staffMember: value })}
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
              <Label htmlFor="edit-paymentMethod">Payment Method</Label>
              <Select
                value={editExpense.paymentMethod}
                onValueChange={(value) => setEditExpense({ ...editExpense, paymentMethod: value as "cash" | "card" | "mobile" })}
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
              id="edit-customerRelated"
              checked={editExpense.customerRelated}
              onChange={(e) => setEditExpense({ ...editExpense, customerRelated: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="edit-customerRelated">Customer Related Expense</Label>
          </div>

          {editExpense.customerRelated && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-customerName">Customer Name</Label>
                <Input
                  id="edit-customerName"
                  value={editExpense.customerName || ""}
                  onChange={(e) => setEditExpense({ ...editExpense, customerName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-customerPhone">Customer Phone</Label>
                <Input
                  id="edit-customerPhone"
                  value={editExpense.customerPhone || ""}
                  onChange={(e) => setEditExpense({ ...editExpense, customerPhone: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-receiptNumber">Receipt Number</Label>
              <Input
                id="edit-receiptNumber"
                value={editExpense.receiptNumber || ""}
                onChange={(e) => setEditExpense({ ...editExpense, receiptNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editExpense.status}
                onValueChange={(value) => setEditExpense({ ...editExpense, status: value as "pending" | "approved" | "rejected" })}
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
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={editExpense.notes}
              onChange={(e) => setEditExpense({ ...editExpense, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}