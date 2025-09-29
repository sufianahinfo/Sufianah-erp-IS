"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SupplierLedgerService, SupplierService, type SupplierLedgerEntry, type Supplier } from "@/lib/firebase-services"

export function SupplierLedger() {
  const [ledgerEntries, setLedgerEntries] = useState<SupplierLedgerEntry[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [newEntry, setNewEntry] = useState({
    supplierId: "",
    supplierName: "",
    type: "purchase" as const,
    amount: 0,
    description: "",
    date: new Date().toISOString().split('T')[0],
    status: "pending" as const,
    reference: "",
    invoiceNumber: ""
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [ledgerData, suppliersData] = await Promise.all([
        SupplierLedgerService.getAllLedgerEntries(),
        SupplierService.getAllSuppliers()
      ])
      
      setLedgerEntries(ledgerData)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddEntry = async () => {
    try {
      if (!newEntry.supplierId || !newEntry.amount || !newEntry.description) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      await SupplierLedgerService.addLedgerEntry(newEntry)
      toast({
        title: "Success",
        description: "Ledger entry added successfully.",
      })
      setIsAddEntryOpen(false)
      setNewEntry({
        supplierId: "",
        supplierName: "",
        type: "purchase",
        amount: 0,
        description: "",
        date: new Date().toISOString().split('T')[0],
        status: "pending",
        reference: "",
        invoiceNumber: ""
      })
      loadData()
    } catch (error) {
      console.error("Error adding entry:", error)
      toast({
        title: "Error",
        description: "Failed to add ledger entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(sup => sup.id === supplierId)
    if (supplier) {
      setNewEntry(prev => ({ ...prev, supplierId, supplierName: supplier.name }))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock },
      approved: { variant: "default" as const, icon: CheckCircle },
      paid: { variant: "default" as const, icon: CheckCircle },
      cancelled: { variant: "destructive" as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      purchase: { variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      payment: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      return: { variant: "default" as const, color: "bg-red-100 text-red-800" },
      adjustment: { variant: "default" as const, color: "bg-yellow-100 text-yellow-800" },
      refund: { variant: "default" as const, color: "bg-purple-100 text-purple-800" }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.purchase
    
    return (
      <Badge variant="outline" className={config.color}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const filteredEntries = ledgerEntries.filter(entry => {
    const matchesSearch = entry.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = selectedSupplier === "all" || entry.supplierId === selectedSupplier
    const matchesType = selectedType === "all" || entry.type === selectedType
    return matchesSearch && matchesSupplier && matchesType
  })

  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const totalPurchases = filteredEntries.filter(entry => entry.type === 'purchase').reduce((sum, entry) => sum + entry.amount, 0)
  const totalPayments = filteredEntries.filter(entry => entry.type === 'payment').reduce((sum, entry) => sum + entry.amount, 0)
  const totalReturns = filteredEntries.filter(entry => entry.type === 'return').reduce((sum, entry) => sum + entry.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading supplier ledger data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Supplier Ledger</h2>
          <p className="text-muted-foreground">
            Manage supplier financial records and transactions
          </p>
        </div>
        <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Ledger Entry</DialogTitle>
              <DialogDescription>
                Add a new financial entry for a supplier
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select onValueChange={handleSupplierChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select onValueChange={(value) => setNewEntry(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={newEntry.reference}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Enter reference (optional)"
                />
              </div>
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={newEntry.invoiceNumber}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="Enter invoice number (optional)"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddEntry} className="w-full">
                Add Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredEntries.length} entries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Purchase transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Payment transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalReturns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Return transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="return">Return</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ledger Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Ledger Entries</CardTitle>
          <CardDescription>
            All financial transactions with suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.supplierName}</TableCell>
                  <TableCell>{getTypeBadge(entry.type)}</TableCell>
                  <TableCell>${entry.amount.toLocaleString()}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                  <TableCell>{entry.reference || "-"}</TableCell>
                  <TableCell>{entry.invoiceNumber || "-"}</TableCell>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No ledger entries found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
