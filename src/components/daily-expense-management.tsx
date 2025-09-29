"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, DollarSign, Coffee, Utensils, Wrench, FileText, Trash2, Edit, Calendar, User } from "lucide-react"
import { DailyExpenseService, EmployeeService, type DailyExpense, type Employee } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

import { AddExpenseDialog } from "./modules/daily-expense-management/add-expense-dialog"
import { EditExpenseDialog } from "./modules/daily-expense-management/edit-expense-dialog"

const EXPENSE_TYPE_OPTIONS = [
  { value: "food", label: "Food", icon: Utensils },
  { value: "beverages", label: "Beverages", icon: Coffee },
  { value: "utilities", label: "Utilities", icon: FileText },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "other", label: "Other", icon: DollarSign },
]

export function DailyExpenseManagement() {
  const [expenses, setExpenses] = useState<DailyExpense[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<DailyExpense | null>(null)
  const { toast } = useToast()

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    amount: "",
    expenseType: "",
    customerRelated: false,
    customerName: "",
    customerPhone: "",
    staffMember: "",
    paymentMethod: "",
    receiptNumber: "",
    notes: "",
    status: "pending",
  })

  // Load expenses and employees from Firebase
  useEffect(() => {
    const unsubscribe = DailyExpenseService.subscribeToDailyExpenses((expensesData) => {
      setExpenses(expensesData)
      setLoading(false)
    })

    EmployeeService.getAllEmployees().then(setEmployees)

    return unsubscribe
  }, [])

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.customerName && expense.customerName.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleAddExpense = async () => {
    try {
      const expense: Omit<DailyExpense, "id"> = {
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        expenseType: newExpense.expenseType as "food" | "beverages" | "utilities" | "maintenance" | "other",
        customerRelated: newExpense.customerRelated,
        customerName: newExpense.customerRelated ? newExpense.customerName : undefined,
        customerPhone: newExpense.customerRelated ? newExpense.customerPhone : undefined,
        staffMember: newExpense.staffMember,
        paymentMethod: newExpense.paymentMethod as "cash" | "card" | "mobile",
        receiptNumber: newExpense.receiptNumber || undefined,
        notes: newExpense.notes,
        status: newExpense.status as "pending" | "approved" | "rejected",
        createdAt: new Date().toISOString(),
      }

      await DailyExpenseService.createDailyExpense(expense)

      setNewExpense({
        date: new Date().toISOString().split("T")[0],
        category: "",
        description: "",
        amount: "",
        expenseType: "",
        customerRelated: false,
        customerName: "",
        customerPhone: "",
        staffMember: "",
        paymentMethod: "",
        receiptNumber: "",
        notes: "",
        status: "pending",
      })
      setIsAddDialogOpen(false)

      toast({
        title: "Expense Added",
        description: "Daily expense has been successfully recorded",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = async () => {
    if (!editExpense) return

    try {
      await DailyExpenseService.updateDailyExpense(editExpense.id, {
        date: editExpense.date,
        category: editExpense.category,
        description: editExpense.description,
        amount: editExpense.amount,
        expenseType: editExpense.expenseType,
        customerRelated: editExpense.customerRelated,
        customerName: editExpense.customerRelated ? editExpense.customerName : undefined,
        customerPhone: editExpense.customerRelated ? editExpense.customerPhone : undefined,
        staffMember: editExpense.staffMember,
        paymentMethod: editExpense.paymentMethod,
        receiptNumber: editExpense.receiptNumber,
        notes: editExpense.notes,
        status: editExpense.status,
        updatedAt: new Date().toISOString(),
      })

      setIsEditDialogOpen(false)
      setEditExpense(null)
      toast({
        title: "Expense Updated",
        description: "Expense details updated successfully.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update expense.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await DailyExpenseService.deleteDailyExpense(id)
      toast({
        title: "Expense Deleted",
        description: "Expense has been successfully deleted",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (expense: DailyExpense) => {
    setEditExpense(expense)
    setIsEditDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "pending":
        return "secondary"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getExpenseTypeIcon = (type: string) => {
    const option = EXPENSE_TYPE_OPTIONS.find(opt => opt.value === type)
    return option ? option.icon : DollarSign
  }

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const customerRelatedExpenses = expenses.filter(expense => expense.customerRelated)
  const totalCustomerExpenses = customerRelatedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const pendingExpenses = expenses.filter(expense => expense.status === "pending")
  const totalPendingAmount = pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Group expenses by type
  const expensesByType = expenses.reduce((acc, expense) => {
    if (!acc[expense.expenseType]) {
      acc[expense.expenseType] = 0
    }
    acc[expense.expenseType] += expense.amount
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Daily Expense Management</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Rs{totalCustomerExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Customer-related costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Rs{totalPendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">Expense entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by description, category, or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          <TabsTrigger value="customer">Customer Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                All Expenses
              </CardTitle>
              <CardDescription>Complete list of daily expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => {
                      const ExpenseTypeIcon = getExpenseTypeIcon(expense.expenseType)
                      return (
                        <TableRow key={expense.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(expense.date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ExpenseTypeIcon className="h-4 w-4" />
                              <span className="capitalize">{expense.expenseType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-muted-foreground">{expense.category}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">Rs{expense.amount.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            {expense.customerRelated ? (
                              <div>
                                <p className="font-medium">{expense.customerName}</p>
                                <p className="text-sm text-muted-foreground">{expense.customerPhone}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {expense.staffMember}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(expense.status) as "destructive" | "default" | "secondary" | "outline"}>
                              {expense.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(expense)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteExpense(expense.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer-Related Expenses
              </CardTitle>
              <CardDescription>Expenses specifically for customer service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Staff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerRelatedExpenses.map((expense) => {
                      const ExpenseTypeIcon = getExpenseTypeIcon(expense.expenseType)
                      return (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{expense.customerName}</p>
                              <p className="text-sm text-muted-foreground">{expense.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="font-semibold">Rs{expense.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ExpenseTypeIcon className="h-4 w-4" />
                              <span className="capitalize">{expense.expenseType}</span>
                            </div>
                          </TableCell>
                          <TableCell>{expense.staffMember}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(expensesByType).map(([type, amount]) => {
                    const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : "0"
                    const ExpenseTypeIcon = getExpenseTypeIcon(type)
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ExpenseTypeIcon className="h-4 w-4" />
                          <span className="capitalize">{type}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">Rs{amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{percentage}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">Rs{expense.amount.toLocaleString()}</div>
                        <Badge variant={getStatusColor(expense.status) as "destructive" | "default" | "secondary" | "outline"} className="text-xs">
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        newExpense={newExpense}
        setNewExpense={setNewExpense}
        employees={employees}
        onSubmit={handleAddExpense}
      />

      {/* Edit Expense Dialog */}
      {editExpense && (
        <EditExpenseDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          editExpense={editExpense}
          setEditExpense={setEditExpense}
          employees={employees}
          onSubmit={handleEditExpense}
        />
      )}
    </div>
  )
}