"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Search, Phone, MessageSquare, Eye, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PurchaseService, SupplierService, type Purchase, type Supplier } from "@/lib/firebase-services"

export function PurchasingLedger() {
  const [purchaseRecords, setPurchaseRecords] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PURCHASES_PER_PAGE = 10;

  // useCallback to avoid warning about loadPurchaseData in useEffect deps
  const loadPurchaseData = useCallback(async () => {
    try {
      setLoading(true)
      const [purchases, suppliersData] = await Promise.all([
        PurchaseService.getAllPurchases(),
        SupplierService.getAllSuppliers()
      ])
      setPurchaseRecords(purchases)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error("Error loading purchase data:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadPurchaseData()
  }, [loadPurchaseData])

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, supplierFilter, purchaseRecords]);


  const handleCallSupplier = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_blank')
      toast({
        title: "Calling Supplier",
        description: `Initiating call to ${phone}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No phone number available",
        variant: "destructive",
      })
    }
  }

  const handleMessageSupplier = (phone: string, supplierName: string) => {
    if (phone) {
      const message = `Hello ${supplierName}, we would like to discuss our recent purchase order.`
      const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      toast({
        title: "Messaging Supplier",
        description: `Opening WhatsApp chat with ${supplierName}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No phone number available",
        variant: "destructive",
      })
    }
  }

  const handleViewPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowViewModal(true)
  }

  const handleDeletePurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowDeleteModal(true)
  }

  const confirmDeletePurchase = async () => {
    if (!selectedPurchase) return

    try {
      await PurchaseService.deletePurchase(selectedPurchase.id)
      setPurchaseRecords(purchaseRecords.filter(record => record.id !== selectedPurchase.id))
      setShowDeleteModal(false)
      setSelectedPurchase(null)
      toast({
        title: "Success",
        description: "Purchase record deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast({
        title: "Error",
        description: "Failed to delete purchase record. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter and sort purchases
  const filteredPurchases = purchaseRecords.filter((record) => {
    const matchesSearch = record.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.supplierContact.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = supplierFilter === "all" || record.supplierId === supplierFilter
    return matchesSearch && matchesSupplier
  })

  // Sort by date (newest first)
  const sortedFilteredPurchases = [...filteredPurchases].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Pagination
  const totalPages = Math.ceil(sortedFilteredPurchases.length / PURCHASES_PER_PAGE);
  const paginatedPurchases = sortedFilteredPurchases.slice((currentPage - 1) * PURCHASES_PER_PAGE, currentPage * PURCHASES_PER_PAGE);

  const filteredRecords = paginatedPurchases;

  const totalPurchases = purchaseRecords.reduce((sum, record) => sum + record.totalAmount, 0)
  const totalDiscount = purchaseRecords.reduce((sum, record) => sum + record.discount, 0)
  const totalSuppliers = suppliers.length
  const totalItems = purchaseRecords.reduce((sum, record) => sum + record.items.length, 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading purchase data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Purchasing Ledger</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{purchaseRecords.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rs{totalDiscount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalPurchases > 0 ? ((totalDiscount / (totalPurchases + totalDiscount)) * 100).toFixed(1) : 0}% of gross purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Items purchased</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-purchases">All Purchases</TabsTrigger>
          <TabsTrigger value="recent-purchases">Recent Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="all-purchases" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by invoice, supplier name, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
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
              </div>
            </CardContent>
          </Card>

          {/* Purchases Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Purchase Records
              </CardTitle>
              <CardDescription>Complete purchase history with supplier and payment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.createdAt).toLocaleDateString()} • {new Date(record.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.supplierName}</p>
                            <p className="text-sm text-muted-foreground">{record.supplierContact}</p>
                            {record.supplierAddress && (
                              <p className="text-xs text-muted-foreground">{record.supplierAddress}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{record.items?.length ?? 0} items</p>
                            <p className="text-xs text-muted-foreground">
                              {Array.isArray(record.items)
                                ? record.items.reduce((sum, item) => sum + (typeof item.quantity === "number" ? item.quantity : 0), 0)
                                : 0} units
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Rs{record.totalAmount.toLocaleString()}</p>
                            {record.discount > 0 && (
                              <p className="text-xs text-green-600">-Rs{record.discount.toLocaleString()} discount</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="default">
                              Cash
                            </Badge>
                            <p className="text-xs text-muted-foreground">Paid</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{new Date(record.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPurchase(record)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCallSupplier(record.supplierContact)}
                              title="Call Supplier"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMessageSupplier(record.supplierContact, record.supplierName)}
                              title="Message Supplier"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePurchase(record)}
                              title="Delete Purchase"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * PURCHASES_PER_PAGE) + 1} to {Math.min(currentPage * PURCHASES_PER_PAGE, sortedFilteredPurchases.length)} of {sortedFilteredPurchases.length} purchases
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-purchases" className="space-y-4">
          {/* Recent Purchases - Last 7 days */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Purchases (Last 7 Days)
              </CardTitle>
              <CardDescription>Purchases made in the last week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseRecords
                      .filter(record => {
                        const recordDate = new Date(record.createdAt)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return recordDate >= weekAgo
                      })
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 10)
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.invoiceNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(record.createdAt).toLocaleDateString()} • {new Date(record.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.supplierName}</p>
                              <p className="text-sm text-muted-foreground">{record.supplierContact}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{record.items?.length ?? 0} items</p>
                              <p className="text-xs text-muted-foreground">
                                {Array.isArray(record.items)
                                  ? record.items.reduce((sum, item) => sum + (typeof item.quantity === "number" ? item.quantity : 0), 0)
                                  : 0} units
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">Rs{record.totalAmount.toLocaleString()}</p>
                              {record.discount > 0 && (
                                <p className="text-xs text-green-600">-Rs{record.discount.toLocaleString()} discount</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{new Date(record.createdAt).toLocaleDateString()}</p>
                              <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewPurchase(record)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCallSupplier(record.supplierContact)}
                                title="Call Supplier"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePurchase(record)}
                                title="Delete Purchase"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Purchase Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Details
            </DialogTitle>
            <DialogDescription>
              Detailed view of purchase items and information
            </DialogDescription>
          </DialogHeader>
          
          {selectedPurchase && (
            <div className="space-y-6">
              {/* Purchase Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPurchase.invoiceNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedPurchase.createdAt).toLocaleDateString()} at {new Date(selectedPurchase.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">Rs{selectedPurchase.totalAmount.toLocaleString()}</p>
                  {selectedPurchase.discount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Discount: Rs{selectedPurchase.discount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Supplier Information */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Supplier Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{selectedPurchase.supplierName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedPurchase.supplierContact}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{selectedPurchase.supplierAddress}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Items */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Purchase Items ({selectedPurchase.items.length})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPurchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.fabricType && (
                                <p className="text-xs text-muted-foreground">Type: {item.fabricType}</p>
                              )}
                              {item.size && (
                                <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.code}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">Rs{item.subtotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Purchase Summary */}
              <div className="space-y-2">
                <h4 className="font-semibold">Purchase Summary</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs{selectedPurchase.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedPurchase.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>-Rs{selectedPurchase.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>Rs{selectedPurchase.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Purchase Record
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Invoice: {selectedPurchase.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">Supplier: {selectedPurchase.supplierName}</p>
                <p className="text-sm text-muted-foreground">Amount: Rs{selectedPurchase.totalAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Date: {new Date(selectedPurchase.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeletePurchase}
                >
                  Delete Purchase
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
