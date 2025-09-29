"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, Package, Upload, History, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react"
import { ProductService, EmployeeService, type Product, type Employee } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import Papa from "papaparse"  

import { AddProductDialog } from "./modules/product-management/add-product-dialog"
import { EditProductDialog } from "./modules/product-management/edit-product-dialog"
import { PriceHistoryDialog } from "./modules/product-management/price-history-dialog"

interface NewProduct {
  name: string;
  code: string;
  fabricType: string;
  size: string;
  purchaseCost: number;
  minSalePrice: number;
  maxSalePrice: number;
  currentPrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  supplier: string;
  batchInfo: string;
}

// Removed unused type definitions

type CSVProductRow = {
  name: string;
  code: string;
  fabricType: string;
  size: string;
  purchaseCost: string;
  minSalePrice: string;
  maxSalePrice: string;
  currentPrice: string;
  stock: string;
  minStock: string;
  maxStock: string;
  supplier: string;
  batchInfo: string;
};


interface ProductPriceHistoryEntry {
  date: string // ISO string
  purchaseCost: number
  minSalePrice: number
  maxSalePrice: number
  currentPrice: number
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const [newProduct, setNewProduct] = useState<Omit<NewProduct, keyof {
    purchaseCost: number;
    minSalePrice: number;
    maxSalePrice: number;
    currentPrice: number;
    stock: number;
    minStock: number;
    maxStock: number;
  }> & {
    purchaseCost: string;
    minSalePrice: string;
    maxSalePrice: string;
    currentPrice: string;
    stock: string;
    minStock: string;
    maxStock: string;
  }>({
    name: "",
    code: "",
    fabricType: "",
    size: "",
    purchaseCost: "",
    minSalePrice: "",
    maxSalePrice: "",
    currentPrice: "",
    stock: "",
    minStock: "",
    maxStock: "",
    supplier: "",
    batchInfo: "",
  })

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)
  const [priceHistory, setPriceHistory] = useState<ProductPriceHistoryEntry[]>([])

  // Stock management state
  const [restockDialogOpen, setRestockDialogOpen] = useState(false)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [restockAmount, setRestockAmount] = useState("")
  const [restockType, setRestockType] = useState<"in" | "out">("in")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false)

  // Load products from Firebase
  useEffect(() => {
    const unsubscribe = ProductService.subscribeToProducts((productsData) => {
      setProducts(productsData)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Load employees for stock management
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeesData = await EmployeeService.getAllEmployees()
        setEmployees(employeesData)
      } catch (error) {
        console.error("Error loading employees:", error)
      }
    }
    loadEmployees()
  }, [])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.fabricType && product.fabricType.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleAddProduct = async () => {
    try {
      const productToAdd: NewProduct = {
        name: newProduct.name,
        code: newProduct.code,
        fabricType: newProduct.fabricType,
        size: newProduct.size,
        purchaseCost: Number(newProduct.purchaseCost) || 0,
        minSalePrice: Number(newProduct.minSalePrice) || 0,
        maxSalePrice: Number(newProduct.maxSalePrice) || 0,
        currentPrice: Number(newProduct.currentPrice) || 0,
        stock: Number(newProduct.stock) || 0,
        minStock: Number(newProduct.minStock) || 0,
        maxStock: Number(newProduct.maxStock) || 0,
        supplier: newProduct.supplier,
        batchInfo: newProduct.batchInfo,
      }
      await ProductService.createProduct({
        ...productToAdd,
        status: "active",
        createdDate: new Date().toISOString().split("T")[0],
      })
      // After product is created, fetch its id and add price history
      // (Assume ProductService.createProduct returns the new product id)
      // If not, you may need to adjust this logic to fetch the product by code or name
      // For now, we will not add price history here, but on edit and on import

      setNewProduct({
        name: "",
        code: "",
        fabricType: "",
        size: "",
        purchaseCost: "",
        minSalePrice: "",
        maxSalePrice: "",
        currentPrice: "",
        stock: "",
        minStock: "",
        maxStock: "",
        supplier: "",
        batchInfo: "",
      })
      setIsAddDialogOpen(false)

      toast({
        title: "Product Added",
        description: "Product has been successfully added to inventory",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await ProductService.deleteProduct(id)
      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getMarginPercentage = (product: Product) => {
    return Math.round(((product.currentPrice - product.purchaseCost) / product.purchaseCost) * 100)
  }

  const getStockStatus = (stock: number) => {
    if (stock <= 5) return { status: "critical", color: "destructive" }
    if (stock <= 10) return { status: "low", color: "secondary" }
    return { status: "good", color: "default" }
  }

  // Import products from CSV
  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: { data: CSVProductRow[] }) => {
        try {
          const importedProducts = results.data.map((row: CSVProductRow) => ({
            name: row.name,
            code: row.code,
            fabricType: row.fabricType,
            size: row.size,
            purchaseCost: Number(row.purchaseCost),
            minSalePrice: Number(row.minSalePrice),
            maxSalePrice: Number(row.maxSalePrice),
            currentPrice: Number(row.currentPrice),
            stock: Number(row.stock),
            minStock: Number(row.minStock),
            maxStock: Number(row.maxStock),
            supplier: row.supplier,
            batchInfo: row.batchInfo,
            status: "active" as "active" | "inactive" | "discontinued",
            createdDate: new Date().toISOString().split("T")[0],
          }))
          for (const product of importedProducts) {
            // Create product
            const newProductId = await ProductService.createProduct(product)
            // Add initial price history
            if (newProductId) {
              await ProductService.addPriceHistory(newProductId, {
                date: new Date().toISOString(),
                purchaseCost: product.purchaseCost,
                minSalePrice: product.minSalePrice,
                maxSalePrice: product.maxSalePrice,
                currentPrice: product.currentPrice,
              })
            }
          }
          toast({
            title: "Import Successful",
            description: `${importedProducts.length} products imported successfully!`,
          })
        } catch {
          toast({
            title: "Import Failed",
            description: "There was an error importing products.",
            variant: "destructive",
          })
        }
      },
      error: () => {
        toast({
          title: "Import Failed",
          description: "Could not parse the file.",
          variant: "destructive",
        })
      },
    })
    // Reset file input
    e.target.value = ""
  }

  // Edit product handlers
  const openEditDialog = (product: Product) => {
    setEditProduct(product)
    setIsEditDialogOpen(true)
  }
  const handleEditProduct = async () => {
    if (!editProduct) return
    try {
      // Fetch the old product for price comparison
      const oldProduct = products.find((p) => p.id === editProduct.id)
      await ProductService.updateProduct(editProduct.id, editProduct)

      // If price fields changed, add a new price history entry
      if (
        oldProduct &&
        (
          oldProduct.purchaseCost !== editProduct.purchaseCost ||
          oldProduct.minSalePrice !== editProduct.minSalePrice ||
          oldProduct.maxSalePrice !== editProduct.maxSalePrice ||
          oldProduct.currentPrice !== editProduct.currentPrice
        )
      ) {
        await ProductService.addPriceHistory(editProduct.id, {
          date: new Date().toISOString(),
          purchaseCost: editProduct.purchaseCost,
          minSalePrice: editProduct.minSalePrice,
          maxSalePrice: editProduct.maxSalePrice,
          currentPrice: editProduct.currentPrice,
        })
      }

      setIsEditDialogOpen(false)
      setEditProduct(null)
      toast({
        title: "Product Updated",
        description: "Product details updated successfully.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update product.",
        variant: "destructive",
      })
    }
  }

  // History dialog handlers
  const openHistoryDialog = async (product: Product) => {
    setHistoryProduct(product)
    setIsHistoryDialogOpen(true)
    setPriceHistoryLoading(true)
    setPriceHistory([])
    try {
      if (ProductService.getProductPriceHistory) {
        const history = await ProductService.getProductPriceHistory(product.id)
        setPriceHistory(
          Array.isArray(history)
            ? history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            : []
        )
      }
    } catch (error) {
      console.error('Error loading price history:', error);
      setPriceHistory([]);
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  // Stock management handlers
  const openRestockDialog = (product: Product, type: "in" | "out") => {
    setRestockProduct(product)
    setRestockType(type)
    setRestockAmount("")
    setSelectedEmployeeId("")
    setRestockDialogOpen(true)
  }

  const handleRestock = async () => {
    if (!restockProduct) return;
    const amount = Number(restockAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const newStock = restockType === "in"
      ? restockProduct.stock + amount
      : Math.max(0, restockProduct.stock - amount);
    
    try {
      await ProductService.updateProduct(restockProduct.id, { 
        stock: newStock, 
        updatedAt: new Date().toISOString() 
      });
      
      // Find selected employee name
      const staffName = employees.find((e) => e.id === selectedEmployeeId)?.name || "Unknown";
      
      // Create stock movement record
      await ProductService.addStockMovement({
        itemId: restockProduct.id,
        itemName: restockProduct.name,
        type: restockType,
        quantity: amount,
        reason: restockType === "in" ? "Manual Stock In" : "Manual Stock Out",
        staff: staffName,
        date: new Date().toISOString(),
        reference: `MANUAL-${restockType.toUpperCase()}-${Date.now()}`,
      });
      
      toast({
        title: restockType === "in" ? "Stock Added" : "Stock Removed",
        description: `Product stock has been updated.`,
      });
      
      setRestockDialogOpen(false);
      setRestockProduct(null);
      setRestockAmount("");
      setSelectedEmployeeId("");
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Product & Price Management</h2>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
        
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, code, or fabric type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" asChild>
              <label className="flex items-center cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import Products
                <input type="file" accept=".csv" onChange={handleImportProducts} className="hidden" />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products Inventory
          </CardTitle>
          <CardDescription>Manage your product catalog with pricing and stock information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type/Size</TableHead>
                  <TableHead>Purchase Cost</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock)
                  const margin = getMarginPercentage(product)

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">Added: {product.createdDate}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{product.fabricType}</p>
                          <p className="text-muted-foreground">
                            {product.size}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>Rs{product.purchaseCost.toLocaleString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">Rs{product.currentPrice.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            Range: Rs{product.minSalePrice} - Rs{product.maxSalePrice}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {margin > 50 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                          )}
                          <span className={margin > 50 ? "text-green-600" : "text-orange-600"}>{margin}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.color as "destructive" | "default" | "secondary" | "outline" | null | undefined}>{product.stock} units</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{product.supplier}</p>
                          <p className="text-muted-foreground">{product.batchInfo}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openHistoryDialog(product)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openRestockDialog(product, "in")}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openRestockDialog(product, "out")}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(product.id)}>
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{products.filter((p) => p.stock <= 10).length}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {products.length > 0
                ? Math.round(products.reduce((sum, p) => sum + getMarginPercentage(p), 0) / products.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Profit margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs{products.reduce((sum, p) => sum + p.currentPrice * p.stock, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">At current prices</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Product Dialog */}
      <EditProductDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editProduct={editProduct}
        setEditProduct={setEditProduct}
        onEditProduct={handleEditProduct}
      />

      {/* Product History Dialog */}
      <PriceHistoryDialog
        isOpen={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        historyProduct={historyProduct}
        priceHistory={priceHistory}
        priceHistoryLoading={priceHistoryLoading}
      />

      {/* Add Product Dialog */}
      <AddProductDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        onAddProduct={handleAddProduct}
      />

      {/* Stock Management Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{restockType === "in" ? "Stock In" : "Stock Out"}</DialogTitle>
            <DialogDescription>Update product stock</DialogDescription>
          </DialogHeader>
          {restockProduct && (
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <Input value={restockProduct.name} disabled />
              </div>
              <div>
                <Label>Current Stock</Label>
                <Input value={restockProduct.stock} disabled />
              </div>
              <div>
                <Label>Amount</Label>
                <Input 
                  type="number" 
                  value={restockAmount} 
                  onChange={(e) => setRestockAmount(e.target.value)}
                  placeholder={`Enter amount to ${restockType === "in" ? "add" : "remove"}`}
                />
              </div>
              <div>
                <Label>Employee</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRestock} disabled={!selectedEmployeeId || !restockAmount}>
                  {restockType === "in" ? "Add Stock" : "Remove Stock"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
