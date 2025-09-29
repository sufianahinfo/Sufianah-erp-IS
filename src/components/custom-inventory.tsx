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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit, Trash2, Package, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CustomProductService, ProductCategoryService, SupplierService, type CustomProduct, type ProductCategory, type Supplier } from "@/lib/firebase-services"

export function CustomInventory() {
  const [products, setProducts] = useState<CustomProduct[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CustomProduct | null>(null)
  const [selectedCategoryEdit, setSelectedCategoryEdit] = useState<ProductCategory | null>(null)
  const { toast } = useToast()

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: "",
    code: "",
    category: "",
    subcategory: "",
    description: "",
    fabricType: "",
    size: "",
    color: "",
    brand: "",
    purchaseCost: 0,
    minSalePrice: 0,
    maxSalePrice: 0,
    currentPrice: 0,
    stock: 0,
    minStock: 0,
    maxStock: 0,
    supplier: "",
    batchInfo: "",
    status: "active" as const,
    images: [] as string[],
    tags: [] as string[],
    createdBy: "admin"
  })

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parentId: "",
    isActive: true
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [productsData, categoriesData, suppliersData] = await Promise.all([
        CustomProductService.getAllProducts(),
        ProductCategoryService.getAllCategories(),
        SupplierService.getAllSuppliers()
      ])
      
      setProducts(productsData)
      setCategories(categoriesData)
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

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.code || !newProduct.category) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      const productData = {
        ...newProduct,
        createdDate: new Date().toISOString()
      }

      await CustomProductService.addProduct(productData)
      toast({
        title: "Success",
        description: "Product added successfully.",
      })
      setIsAddProductOpen(false)
      setNewProduct({
        name: "",
        code: "",
        category: "",
        subcategory: "",
        description: "",
        fabricType: "",
        size: "",
        color: "",
        brand: "",
        purchaseCost: 0,
        minSalePrice: 0,
        maxSalePrice: 0,
        currentPrice: 0,
        stock: 0,
        minStock: 0,
        maxStock: 0,
        supplier: "",
        batchInfo: "",
        status: "active",
        images: [],
        tags: [],
        createdBy: "admin"
      })
      loadData()
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name) {
        toast({
          title: "Error",
          description: "Please enter category name.",
          variant: "destructive",
        })
        return
      }

      await ProductCategoryService.addCategory(newCategory)
      toast({
        title: "Success",
        description: "Category added successfully.",
      })
      setIsAddCategoryOpen(false)
      setNewCategory({
        name: "",
        description: "",
        parentId: "",
        isActive: true
      })
      loadData()
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = async () => {
    if (!selectedProduct) return

    try {
      await CustomProductService.updateProduct(selectedProduct.id, selectedProduct)
      toast({
        title: "Success",
        description: "Product updated successfully.",
      })
      setIsEditProductOpen(false)
      setSelectedProduct(null)
      loadData()
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = async () => {
    if (!selectedCategoryEdit) return

    try {
      await ProductCategoryService.updateCategory(selectedCategoryEdit.id, selectedCategoryEdit)
      toast({
        title: "Success",
        description: "Category updated successfully.",
      })
      setIsEditCategoryOpen(false)
      setSelectedCategoryEdit(null)
      loadData()
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await CustomProductService.deleteProduct(productId)
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      })
      loadData()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await ProductCategoryService.deleteCategory(categoryId)
      toast({
        title: "Success",
        description: "Category deleted successfully.",
      })
      loadData()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      inactive: { variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
      discontinued: { variant: "destructive" as const, color: "bg-red-100 text-red-800" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    
    return (
      <Badge variant="outline" className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getStockStatus = (product: CustomProduct) => {
    if (product.stock <= product.minStock) {
      return { status: "low", color: "text-red-600", icon: AlertCircle }
    } else if (product.stock >= product.maxStock) {
      return { status: "high", color: "text-yellow-600", icon: AlertCircle }
    } else {
      return { status: "normal", color: "text-green-600", icon: Package }
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || product.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalProducts = products.length
  const activeProducts = products.filter(p => p.status === 'active').length
  const lowStockProducts = products.filter(p => p.stock <= p.minStock).length
  const totalValue = products.reduce((sum, product) => sum + (product.stock * product.purchaseCost), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading custom inventory data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Custom Inventory</h2>
          <p className="text-muted-foreground">
            Manage your custom products and categories
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your custom inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label htmlFor="code">Product Code *</Label>
                  <Input
                    id="code"
                    value={newProduct.code}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter product code"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={newProduct.subcategory}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, subcategory: e.target.value }))}
                    placeholder="Enter subcategory"
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Enter brand"
                  />
                </div>
                <div>
                  <Label htmlFor="fabricType">Fabric Type</Label>
                  <Input
                    id="fabricType"
                    value={newProduct.fabricType}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, fabricType: e.target.value }))}
                    placeholder="Enter fabric type"
                  />
                </div>
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={newProduct.size}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, size: e.target.value }))}
                    placeholder="Enter size"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={newProduct.color}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="Enter color"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter product description"
                  />
                </div>
                <div>
                  <Label htmlFor="purchaseCost">Purchase Cost</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    value={newProduct.purchaseCost}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, purchaseCost: Number(e.target.value) }))}
                    placeholder="Enter purchase cost"
                  />
                </div>
                <div>
                  <Label htmlFor="currentPrice">Current Price</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    value={newProduct.currentPrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, currentPrice: Number(e.target.value) }))}
                    placeholder="Enter current price"
                  />
                </div>
                <div>
                  <Label htmlFor="minSalePrice">Min Sale Price</Label>
                  <Input
                    id="minSalePrice"
                    type="number"
                    value={newProduct.minSalePrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, minSalePrice: Number(e.target.value) }))}
                    placeholder="Enter min sale price"
                  />
                </div>
                <div>
                  <Label htmlFor="maxSalePrice">Max Sale Price</Label>
                  <Input
                    id="maxSalePrice"
                    type="number"
                    value={newProduct.maxSalePrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, maxSalePrice: Number(e.target.value) }))}
                    placeholder="Enter max sale price"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    placeholder="Enter stock quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                    placeholder="Enter min stock"
                  />
                </div>
                <div>
                  <Label htmlFor="maxStock">Max Stock</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={newProduct.maxStock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, maxStock: Number(e.target.value) }))}
                    placeholder="Enter max stock"
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select onValueChange={(value) => setNewProduct(prev => ({ ...prev, supplier: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="batchInfo">Batch Info</Label>
                  <Input
                    id="batchInfo"
                    value={newProduct.batchInfo}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, batchInfo: e.target.value }))}
                    placeholder="Enter batch info"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value) => setNewProduct(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddProduct} className="w-full mt-4">
                Add Product
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Add a new product category
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryDescription">Description</Label>
                  <Textarea
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter category description"
                  />
                </div>
                <div>
                  <Label htmlFor="parentCategory">Parent Category</Label>
                  <Select onValueChange={(value) => setNewCategory(prev => ({ ...prev, parentId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddCategory} className="w-full mt-4">
                Add Category
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Products need restocking
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Inventory value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Product categories
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="discontinued">Discontinued</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Products</CardTitle>
              <CardDescription>
                Manage your custom product inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    const StockIcon = stockStatus.icon
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.brand && (
                              <div className="text-sm text-muted-foreground">{product.brand}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.code}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={stockStatus.color}>{product.stock}</span>
                            <StockIcon className={`h-4 w-4 ${stockStatus.color}`} />
                          </div>
                        </TableCell>
                        <TableCell>${product.currentPrice}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product)
                                setIsEditProductOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No products found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>
                Manage product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{category.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCategoryEdit(category)
                              setIsEditCategoryOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No categories found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="editName">Product Name</Label>
                <Input
                  id="editName"
                  value={selectedProduct.name}
                  onChange={(e) => setSelectedProduct((prev: CustomProduct | null) => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editCode">Product Code</Label>
                <Input
                  id="editCode"
                  value={selectedProduct.code}
                  onChange={(e) => setSelectedProduct((prev: CustomProduct | null) => prev ? { ...prev, code: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editCategory">Category</Label>
                <Select 
                  value={selectedProduct.category} 
                  onValueChange={(value) => setSelectedProduct((prev: CustomProduct | null) => prev ? { ...prev, category: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editStock">Stock Quantity</Label>
                <Input
                  id="editStock"
                  type="number"
                  value={selectedProduct.stock}
                  onChange={(e) => setSelectedProduct((prev: CustomProduct | null) => prev ? { ...prev, stock: Number(e.target.value) } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editPrice">Current Price</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={selectedProduct.currentPrice}
                  onChange={(e) => setSelectedProduct((prev: CustomProduct | null) => prev ? { ...prev, currentPrice: Number(e.target.value) } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select 
                  value={selectedProduct.status} 
                  onValueChange={(value) => setSelectedProduct((prev: CustomProduct | null) => prev ? { ...prev, status: value as any } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Button onClick={handleEditProduct} className="w-full mt-4">
            Update Product
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>
          {selectedCategoryEdit && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCategoryName">Category Name</Label>
                <Input
                  id="editCategoryName"
                  value={selectedCategoryEdit.name}
                  onChange={(e) => setSelectedCategoryEdit((prev: ProductCategory | null) => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editCategoryDescription">Description</Label>
                <Textarea
                  id="editCategoryDescription"
                  value={selectedCategoryEdit.description || ""}
                  onChange={(e) => setSelectedCategoryEdit((prev: ProductCategory | null) => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editCategoryActive"
                  checked={selectedCategoryEdit.isActive}
                  onChange={(e) => setSelectedCategoryEdit((prev: ProductCategory | null) => prev ? { ...prev, isActive: e.target.checked } : null)}
                />
                <Label htmlFor="editCategoryActive">Active</Label>
              </div>
            </div>
          )}
          <Button onClick={handleEditCategory} className="w-full mt-4">
            Update Category
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
