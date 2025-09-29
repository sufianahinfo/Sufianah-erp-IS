"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Eye, Phone, MessageSquare, Truck, CheckCircle, DollarSign, Trash2 } from "lucide-react"
import { ReportDialog } from "@/components/modules/sales-ledger/report-dialog"
import { DiscardSaleDialog } from "@/components/modules/sales-ledger/discard-sale-dialog"
import { SaleDetailsDialog } from "./modules/sales-ledger/sales-details-dialog"
import { useToast } from "@/hooks/use-toast"
import { SalesService, type SaleRecord } from "@/lib/firebase-services"

export function SalesLedger() {
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedRecord, setSelectedRecord] = useState<SaleRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const { toast } = useToast()

  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [saleToDiscard, setSaleToDiscard] = useState<SaleRecord | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const handleDiscardSale = (record: SaleRecord) => {
    setSaleToDiscard(record);
    setIsDiscardDialogOpen(true);
  }

  const confirmDiscardSale = async () => {
    if (!saleToDiscard) return;
  
    try {
      setIsDiscarding(true);
  
      // Call the discard sale service method
      await SalesService.discardSale(saleToDiscard.id);
  
      toast({
        title: "Sale Discarded",
        description: `Sale ${saleToDiscard.invoiceNumber} has been discarded and inventory has been restored.`,
      });
  
      setIsDiscardDialogOpen(false);
      setSaleToDiscard(null);
    } catch (error) {
      console.error("Error discarding sale:", error);
      toast({
        title: "Error",
        description: "Failed to discard sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDiscarding(false);
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const SALES_PER_PAGE = 10;

  // useCallback to avoid warning about loadSalesData in useEffect deps
  const loadSalesData = useCallback(async () => {
    try {
      setLoading(true)
      const sales = await SalesService.getAllSales()
      setSalesRecords(sales)
    } catch (error) {
      console.error("Error loading sales data:", error)
      toast({
        title: "Error",
        description: "Failed to load sales data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSalesData()

    // Set up real-time listener
    const unsubscribe = SalesService.subscribeToSales((sales: SaleRecord[]) => {
      setSalesRecords(sales)
      setLoading(false)
    })

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [loadSalesData])

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, salesRecords]);

  const updateDeliveryStatus = async (saleId: string, status: "pickup" | "delivered" | "pending" | "cancelled") => {
    try {
      await SalesService.updateSale(saleId, {
        deliveryStatus: status,
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: `Delivery status updated to ${status}`,
      })
    } catch (error) {
      console.error("Error updating delivery status:", error)
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      })
    }
  }

  const updatePaymentStatus = async (saleId: string, status: "paid" | "partial" | "pending") => {
    try {
      await SalesService.updateSale(saleId, {
        paymentStatus: status,
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: `Payment status updated to ${status}`,
      })
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (record: SaleRecord) => {
    setSelectedRecord(record)
    setIsViewDialogOpen(true)
  }

  const handleCallCustomer = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_blank')
      toast({
        title: "Calling Customer",
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

  const handleMessageCustomer = (phone: string, customerName: string) => {
    if (phone) {
      const message = `Hello ${customerName}, thank you for your purchase. We hope you're satisfied with your order!`
      const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      toast({
        title: "Messaging Customer",
        description: `Opening WhatsApp chat with ${customerName}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No phone number available",
        variant: "destructive",
      })
    }
  }

  const generateSalesReport = async () => {
    try {
      setIsGeneratingReport(true)

      // Filter sales by date range if both dates are set
      let filteredSales = salesRecords;
      if (reportStartDate && reportEndDate) {
        const start = new Date(reportStartDate);
        const end = new Date(reportEndDate);
        filteredSales = salesRecords.filter(record => {
          const saleDate = new Date(record.date);
          return saleDate >= start && saleDate <= end;
        });
      }

      // Create CSV content
      const csvHeaders = [
        "Invoice Number",
        "Date",
        "Customer Name",
        "Customer Phone",
        "Customer Address",
        "Customer Type",
        "Items Count",
        "Subtotal",
        "Discount",
        "Total",
        "Payment Method",
        "Payment Status",
        "Delivery Status",
        "Staff Member",
        "Notes"
      ]

      const csvRows = filteredSales.map(record => [
        record.invoiceNumber,
        record.date,
        record.customerName,
        record.customerPhone,
        record.customerAddress || '',
        record.customerType,
        record.items?.length || 0,
        record.subtotal,
        record.discount,
        record.total,
        record.paymentMethod,
        record.paymentStatus,
        record.deliveryStatus,
        record.staffMember,
        record.notes
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${reportStartDate || 'all'}-to-${reportEndDate || 'all'}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Report Generated",
        description: "Sales report has been downloaded successfully",
      })
      setIsReportDialogOpen(false);
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate sales report",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  
  const filteredSales = salesRecords.filter((record) => {
    const matchesSearch =
      record.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerPhone?.includes(searchTerm) ||
      record.customerAddress?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.deliveryStatus === statusFilter;
    const matchesPayment = paymentFilter === "all" || record.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });


  const sortedFilteredSales = [...filteredSales].sort((a, b) => {
    // Use createdAt if available, otherwise fall back to date+time combination
    const aDateTime = a.createdAt ? new Date(a.createdAt) : new Date(`${a.date}T${a.time ? a.time : '00:00:00'}`);
    const bDateTime = b.createdAt ? new Date(b.createdAt) : new Date(`${b.date}T${b.time ? b.time : '00:00:00'}`);
    return bDateTime.getTime() - aDateTime.getTime();
  });

  const totalPages = Math.ceil(sortedFilteredSales.length / SALES_PER_PAGE);
  const paginatedSales = sortedFilteredSales.slice((currentPage - 1) * SALES_PER_PAGE, currentPage * SALES_PER_PAGE);

  // 4. Use paginatedSales for rendering
  const filteredRecords = paginatedSales;

  const totalSales = salesRecords.reduce((sum, record) => sum + (typeof record.total === "number" ? record.total : 0), 0)
  const totalDiscount = salesRecords.reduce((sum, record) => sum + (typeof record.discount === "number" ? record.discount : 0), 0)
  const pendingDeliveries = salesRecords.filter((record) => record.deliveryStatus === "pending").length
  const pendingPayments = salesRecords.filter((record) => record.paymentStatus === "pending").length

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case "vip":
        return "default"
      case "regular":
        return "secondary"
      case "walk-in":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "partial":
        return "secondary"
      case "pending":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default"
      case "pickup":
        return "secondary"
      case "pending":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading sales data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sales Ledger</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsReportDialogOpen(true)}
            disabled={isGeneratingReport}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGeneratingReport ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{salesRecords.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rs{totalDiscount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalSales > 0 ? ((totalDiscount / (totalSales + totalDiscount)) * 100).toFixed(1) : 0}% of gross sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingDeliveries}</div>
            <p className="text-xs text-muted-foreground">Orders awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Credit sales outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Sales Management</h3>
            <p className="text-sm text-muted-foreground">View and manage different types of sales records</p>
          </div>
        </div>
        
        <Tabs defaultValue="all-sales" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all-sales">📊 All Sales</TabsTrigger>
            <TabsTrigger value="pending-delivery">🚚 Pending Delivery</TabsTrigger>
            <TabsTrigger value="pending-payment">💳 Pending Payment</TabsTrigger>
          </TabsList>

        <TabsContent value="all-sales" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by invoice, customer name, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sales Records
              </CardTitle>
              <CardDescription>Complete transaction history with customer and delivery details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Staff</TableHead>
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
                              {record.date} • {record.time}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.customerName}</p>
                            <p className="text-sm text-muted-foreground">{record.customerPhone}</p>
                            {record.customerAddress && (
                              <p className="text-xs text-muted-foreground">{record.customerAddress}</p>
                            )}
                            <Badge variant={getCustomerTypeColor(record.customerType) as "destructive" | "default" | "secondary" | "outline" | undefined} className="text-xs">
                              {record.customerType}
                            </Badge>
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
                            <p className="font-medium">Rs{typeof record.total === "number" ? record.total.toLocaleString() : 0}</p>
                            {record.discount > 0 && (
                              <p className="text-xs text-red-600">-Rs{typeof record.discount === "number" ? record.discount.toLocaleString() : 0} discount</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={getPaymentStatusColor(record.paymentStatus) as "destructive" | "default" | "secondary" | "outline" | undefined}>
                              {record.paymentStatus}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{record.paymentMethod}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={getDeliveryStatusColor(record.deliveryStatus) as "destructive" | "default" | "secondary" | "outline" | undefined}>
                              {record.deliveryStatus}
                            </Badge>
                            {/* Delivery status is now only shown, not editable here */}
                            {record.deliveryAddress && (
                              <p className="text-xs text-muted-foreground">{record.deliveryAddress}</p>
                            )}
                            {record.deliveryDate && (
                              <p className="text-xs text-muted-foreground">{record.deliveryDate}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{record.staffMember}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(record)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCallCustomer(record.customerPhone)}
                              title="Call Customer"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMessageCustomer(record.customerPhone, record.customerName)}
                              title="Message Customer"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDiscardSale(record)}
                              title="Discard Sale"
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

        <TabsContent value="pending-delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Pending Deliveries
              </CardTitle>
              <CardDescription>Orders awaiting delivery or pickup</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesRecords
                  .filter((record) => record.deliveryStatus === "pending")
                  .sort((a, b) => {
                    // Use createdAt if available, otherwise fall back to date+time combination
                    const aDateTime = a.createdAt ? new Date(a.createdAt) : new Date(`${a.date}T${a.time ? a.time : '00:00:00'}`);
                    const bDateTime = b.createdAt ? new Date(b.createdAt) : new Date(`${b.date}T${b.time ? b.time : '00:00:00'}`);
                    return bDateTime.getTime() - aDateTime.getTime();
                  })
                  .map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{record.invoiceNumber}</p>
                          <Badge variant="outline">{record.customerType}</Badge>
                        </div>
                        <p className="text-sm">{record.customerName}</p>
                        <p className="text-sm text-muted-foreground">{record.deliveryAddress}</p>
                        <p className="text-xs text-muted-foreground">
                          Expected: {record.deliveryDate} • Rs{typeof record.total === "number" ? record.total.toLocaleString() : 0}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateDeliveryStatus(record.id, "delivered")}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Delivered
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateDeliveryStatus(record.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCallCustomer(record.customerPhone)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {salesRecords.filter((record) => record.deliveryStatus === "pending").length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">No pending deliveries</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pending Payments
              </CardTitle>
              <CardDescription>Credit sales awaiting payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesRecords
                  .filter((record) => record.paymentStatus === "pending")
                  .sort((a, b) => {
                    // Use createdAt if available, otherwise fall back to date+time combination
                    const aDateTime = a.createdAt ? new Date(a.createdAt) : new Date(`${a.date}T${a.time ? a.time : '00:00:00'}`);
                    const bDateTime = b.createdAt ? new Date(b.createdAt) : new Date(`${b.date}T${b.time ? b.time : '00:00:00'}`);
                    return bDateTime.getTime() - aDateTime.getTime();
                  })
                  .map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{record.invoiceNumber}</p>
                          <Badge variant="destructive">Credit Sale</Badge>
                        </div>
                        <p className="text-sm">{record.customerName}</p>
                        <p className="text-sm text-muted-foreground">{record.customerPhone}</p>
                        <p className="text-xs text-muted-foreground">
                          Sale Date: {record.date} • Amount: Rs{typeof record.total === "number" ? record.total.toLocaleString() : 0}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updatePaymentStatus(record.id, "paid")}>
                          <DollarSign className="h-4 w-4 mr-1" />
                          Record Payment
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMessageCustomer(record.customerPhone, record.customerName)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {salesRecords.filter((record) => record.paymentStatus === "pending").length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">No pending payments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
          Prev
        </Button>
        <span>{currentPage} / {totalPages || 1}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
          Next
        </Button>
      </div>

  {/* Sale Details Dialog */}
      <SaleDetailsDialog 
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        selectedRecord={selectedRecord}
        onCallCustomer={handleCallCustomer}
        onMessageCustomer={handleMessageCustomer}
        getCustomerTypeColor={getCustomerTypeColor}
        getPaymentStatusColor={getPaymentStatusColor}
        getDeliveryStatusColor={getDeliveryStatusColor}
      />

      {/* Date Range Report Dialog */}
      <ReportDialog 
        isOpen={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
        onGenerateReport={generateSalesReport}
        isGeneratingReport={isGeneratingReport}
      />

      {/* Discard Sale Confirmation Dialog */}
      <DiscardSaleDialog 
        isOpen={isDiscardDialogOpen}
        onOpenChange={setIsDiscardDialogOpen}
        saleToDiscard={saleToDiscard}
        onConfirmDiscard={confirmDiscardSale}
        isDiscarding={isDiscarding}
      />

    </div>
  )
}
