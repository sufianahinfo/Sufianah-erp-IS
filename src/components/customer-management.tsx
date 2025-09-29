"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Eye, User, UserCheck, TrendingUp, Clock} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CustomerService, type Customer } from "@/lib/firebase-services"
import { SalesService, type SaleRecord } from "@/lib/firebase-services"

import { CustomerViewDialog } from "@/components/modules/customer-management/customer-view-dialog"
import { CustomerEditDialog } from "@/components/modules/customer-management/customer-edit-dialog"
import { CustomerDeleteDialog } from "@/components/modules/customer-management/customer-delete-dialog"

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [avgCustomerValue, setAvgCustomerValue] = useState(0);
  const [customerRevenueMap, setCustomerRevenueMap] = useState<Record<string, number>>({});
  const [, setCustomerTransactionMap] = useState<Record<string, number>>({});
  const { toast } = useToast()

  const loadCustomersData = useCallback(async () => {
    try {
      setLoading(true)
      const sales = await CustomerService.getAllCustomers()
      setCustomers(sales)
    } catch (error) {
      console.error("Error loading customers data:", error)
      toast({
        title: "Error",
        description: "Failed to load customers data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCustomersData()
    return () => {}
  }, [loadCustomersData])

  useEffect(() => {
    if (selectedCustomer) {
      const fetchRecentSales = async () => {
        try {
          const sales = await SalesService.getAllSales()
          const filteredSales = sales.filter(sale => sale.customerPhone === selectedCustomer.phone)
          const sortedSales = filteredSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          const recentSales = sortedSales.slice(0, 5)
          setRecentSales(recentSales);
        } catch (error) {
          console.error("Error fetching recent sales:", error);
          toast({
            title: "Error",
            description: "Failed to load recent sales. Please try again.",
            variant: "destructive",
          });
        }
      };
      fetchRecentSales();
    }
  }, [selectedCustomer, toast]);

  useEffect(() => {
    async function fetchSalesAnalytics() {
      try {
        const sales = await SalesService.getAllSales();
        setTotalTransactions(sales.length);
        const revenue = sales.reduce((sum, sale) => sum + (typeof sale.total === 'number' ? sale.total : 0), 0);
        setTotalRevenue(revenue);
        const revenueMap: Record<string, number> = {};
        const transactionMap: Record<string, number> = {};
        sales.forEach(sale => {
          const key = sale.customerPhone || sale.customerName;
          if (!revenueMap[key]) revenueMap[key] = 0;
          if (!transactionMap[key]) transactionMap[key] = 0;
          revenueMap[key] += typeof sale.total === 'number' ? sale.total : 0;
          transactionMap[key] += 1;
        });
        setCustomerRevenueMap(revenueMap);
        setCustomerTransactionMap(transactionMap);
        setAvgCustomerValue(sales.length > 0 ? Math.round(revenue / sales.length) : 0);
      } catch (error) {
        console.error("Error fetching sales analytics:", error);
        setTotalRevenue(0);
        setTotalTransactions(0);
        setAvgCustomerValue(0);
        setCustomerRevenueMap({});
        setCustomerTransactionMap({});
      }
    }
    fetchSalesAnalytics();
  }, []);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsViewDialogOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditDialogOpen(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      if (customer.id) {
        await CustomerService.updateCustomer(customer.id, customer)
        toast({
          title: "Customer Updated",
          description: `Customer "${customer.name}" updated.`,
        })
      } else {
        await CustomerService.createCustomer({
          ...customer,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        toast({
          title: "Customer Added",
          description: `Customer "${customer.name}" added.`,
        })
      }
      setIsEditDialogOpen(false)
      loadCustomersData()
    } catch (error) {
      console.error("Error saving customer:", error)
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return
    try {
      await CustomerService.deleteCustomer(selectedCustomer.id)
      toast({
        title: "Customer Deleted",
        description: `Customer "${selectedCustomer.name}" deleted.`,
      })
      setIsDeleteDialogOpen(false)
      loadCustomersData()
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getCustomerTypeColor = (customerType: string) => {
    switch (customerType) {
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

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase()
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower)
    )
  })

  const sortedCustomers = filteredCustomers.sort((a, b) => a.name.localeCompare(b.name))
  const totalCustomers = customers.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading customer data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
        <Button onClick={() => {
          setSelectedCustomer({
            id: "",
            name: "",
            email: "",
            phone: "",
            address: "",
            customerType: "regular",
            totalPurchases: 0,
            totalSpent: 0,
            creditLimit: 0,
            currentCredit: 0,
            notes: "",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          setIsEditDialogOpen(true)
        }}>
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Customer Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{avgCustomerValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All sales combined</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-customers">All Customers</TabsTrigger>
          <TabsTrigger value="top-customers">Top Customers</TabsTrigger>
          <TabsTrigger value="recent-customers">Recent Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="all-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Customers
              </CardTitle>
              <CardDescription>Search by customer name, phone, email, or address</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by name, phone, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer List
              </CardTitle>
              <CardDescription>Complete customer database with purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <Badge variant={getCustomerTypeColor(customer.customerType || "regular") as "destructive" | "default" | "secondary" | "outline" | undefined} className="text-xs">
                              {customer.customerType || "Regular"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{customer.phone}</p>
                          {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCustomerTypeColor(customer.customerType || "regular") as "destructive" | "default" | "secondary" | "outline" | undefined}>
                            {customer.customerType || "Regular"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCustomer(customer)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditCustomer(customer)}
                              title="Edit Customer"
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteCustomer(customer)}
                              title="Delete Customer"
                            >
                              <UserCheck className="h-4 w-4 text-red-500" />
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

        <TabsContent value="top-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Customers by Revenue
              </CardTitle>
              <CardDescription>Your highest-value customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.slice(0, 10).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{customer.name}</p>
                          <Badge variant={getCustomerTypeColor(customer.customerType || "regular") as "destructive" | "default" | "secondary" | "outline" | undefined}>
                            {customer.customerType || "Regular"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.email && <span>{customer.email} • </span>}
                          {customer.address && <span>{customer.address}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">Rs{(customerRevenueMap[customer.phone] || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Last purchase: {customer.updatedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Customers
              </CardTitle>
              <CardDescription>Customers who made purchases recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers
                  .sort((a, b) => new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime())
                  .slice(0, 10)
                  .map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{customer.name}</p>
                          <Badge variant={getCustomerTypeColor(customer.customerType || "regular") as "destructive" | "default" | "secondary" | "outline" | undefined}>
                            {customer.customerType || "Regular"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.email && <span>{customer.email} • </span>}
                          {customer.address && <span>{customer.address}</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{customer.updatedAt}</p>
                        <p className="text-sm text-muted-foreground">Last updated</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        customer={selectedCustomer}
        recentSales={recentSales}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        getCustomerTypeColor={getCustomerTypeColor}
      />

      <CustomerEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        customer={selectedCustomer}
        onCustomerChange={setSelectedCustomer}
        onSave={handleSaveCustomer}
        isNew={!selectedCustomer?.id}
      />

      <CustomerDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        customer={selectedCustomer}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}