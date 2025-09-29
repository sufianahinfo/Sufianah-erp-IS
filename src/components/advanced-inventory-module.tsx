"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Warehouse,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Settings,
  TrendingUp,
  Calendar
} from "lucide-react"
import { AdvancedInventoryService } from "@/lib/advanced-inventory-service"
import { ProductService, type Product } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import type { Batch, WarehouseLocation, ProductAssembly, ReorderRule, InventoryTransfer } from "@/types/custom"

export function AdvancedInventoryModule() {
  const [activeTab, setActiveTab] = useState("batches")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Data states
  const [batches, setBatches] = useState<Batch[]>([])
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>([])
  const [productAssemblies, setProductAssemblies] = useState<ProductAssembly[]>([])
  const [reorderRules, setReorderRules] = useState<ReorderRule[]>([])
  const [inventoryTransfers, setInventoryTransfers] = useState<InventoryTransfer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [expiringBatches, setExpiringBatches] = useState<Batch[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<{ productId: string; currentStock: number; reorderPoint: number }[]>([])

  // Dialog states
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [assemblyDialogOpen, setAssemblyDialogOpen] = useState(false)
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  // Form states
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [editingLocation, setEditingLocation] = useState<WarehouseLocation | null>(null)
  const [editingAssembly, setEditingAssembly] = useState<ProductAssembly | null>(null)
  const [editingReorderRule, setEditingReorderRule] = useState<ReorderRule | null>(null)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        batchesData,
        locationsData,
        rulesData,
        transfersData,
        productsData,
        expiringData,
        lowStockData
      ] = await Promise.all([
        AdvancedInventoryService.getAllBatches(),
        AdvancedInventoryService.getAllWarehouseLocations(),
        AdvancedInventoryService.getAllReorderRules(),
        AdvancedInventoryService.getAllInventoryTransfers(),
        ProductService.getAllProducts(),
        AdvancedInventoryService.checkExpiringBatches(30),
        AdvancedInventoryService.checkLowStockProducts()
      ])
      
      setBatches(batchesData)
      setWarehouseLocations(locationsData)
      setReorderRules(rulesData)
      setInventoryTransfers(transfersData)
      setProducts(productsData)
      setExpiringBatches(expiringData)
      setLowStockProducts(lowStockData)
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatch = async (batchData: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await AdvancedInventoryService.createBatch(batchData)
      await loadData()
      setBatchDialogOpen(false)
      toast({ title: "Success", description: "Batch created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create batch", variant: "destructive" })
    }
  }

  const handleCreateLocation = async (locationData: Omit<WarehouseLocation, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await AdvancedInventoryService.createWarehouseLocation(locationData)
      await loadData()
      setLocationDialogOpen(false)
      toast({ title: "Success", description: "Warehouse location created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create location", variant: "destructive" })
    }
  }

  const handleCreateReorderRule = async (ruleData: Omit<ReorderRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await AdvancedInventoryService.createReorderRule(ruleData)
      await loadData()
      setReorderDialogOpen(false)
      toast({ title: "Success", description: "Reorder rule created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create reorder rule", variant: "destructive" })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in-transit':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'in-transit':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBatches = batches.filter(batch =>
    batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTransfers = inventoryTransfers.filter(transfer =>
    transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Advanced Inventory Management</h2>
          <p className="text-muted-foreground">Manage batches, locations, assemblies, and transfers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setBatchDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
          <Button onClick={() => setLocationDialogOpen(true)} variant="outline">
            <Warehouse className="h-4 w-4 mr-2" />
            New Location
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(expiringBatches.length > 0 || lowStockProducts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiringBatches.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Expiring Batches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-700">
                  {expiringBatches.length} batch(es) expiring within 30 days
                </p>
              </CardContent>
            </Card>
          )}
          {lowStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">
                  {lowStockProducts.length} product(s) below reorder point
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search batches, transfers, or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="locations">Warehouse Locations</TabsTrigger>
          <TabsTrigger value="assemblies">Product Assemblies</TabsTrigger>
          <TabsTrigger value="reorder-rules">Reorder Rules</TabsTrigger>
          <TabsTrigger value="transfers">Inventory Transfers</TabsTrigger>
        </TabsList>

        {/* Batches Tab */}
        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>Batch Management</CardTitle>
              <CardDescription>Track product batches, expiry dates, and lot numbers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                        <TableCell>{products.find(p => p.id === batch.productId)?.name || batch.productId}</TableCell>
                        <TableCell>{batch.quantity}</TableCell>
                        <TableCell>
                          {batch.expiryDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(batch.expiryDate).toLocaleDateString()}
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{batch.supplier || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(batch.status)}
                            <Badge className={getStatusColor(batch.status)}>
                              {batch.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingBatch(batch)
                              setBatchDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
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

        {/* Warehouse Locations Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Locations</CardTitle>
              <CardDescription>Manage warehouse locations and storage capacity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouseLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4" />
                            {location.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{location.code}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{location.address}</TableCell>
                        <TableCell>{location.capacity.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{location.currentStock.toLocaleString()}</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(location.currentStock / location.capacity) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {location.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingLocation(location)
                              setLocationDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
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

        {/* Product Assemblies Tab */}
        <TabsContent value="assemblies">
          <Card>
            <CardHeader>
              <CardTitle>Product Assemblies</CardTitle>
              <CardDescription>Define product components and assembly requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p>Product assemblies feature coming soon</p>
                <p className="text-sm">This will allow you to define how products are assembled from components</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reorder Rules Tab */}
        <TabsContent value="reorder-rules">
          <Card>
            <CardHeader>
              <CardTitle>Reorder Rules</CardTitle>
              <CardDescription>Set up automatic reorder points and quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Min Quantity</TableHead>
                      <TableHead>Max Quantity</TableHead>
                      <TableHead>Reorder Point</TableHead>
                      <TableHead>Reorder Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reorderRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          {products.find(p => p.id === rule.productId)?.name || rule.productId}
                        </TableCell>
                        <TableCell>{rule.minQuantity}</TableCell>
                        <TableCell>{rule.maxQuantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.reorderPoint}</Badge>
                        </TableCell>
                        <TableCell>{rule.reorderQuantity}</TableCell>
                        <TableCell>
                          <Badge className={rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingReorderRule(rule)
                              setReorderDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
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

        {/* Inventory Transfers Tab */}
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Transfers</CardTitle>
              <CardDescription>Track inventory movements between locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer ID</TableHead>
                      <TableHead>From Location</TableHead>
                      <TableHead>To Location</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.map((transfer) => {
                      const fromLocation = warehouseLocations.find(l => l.id === transfer.fromLocation)
                      const toLocation = warehouseLocations.find(l => l.id === transfer.toLocation)
                      
                      return (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-mono text-sm">{transfer.id.slice(0, 8)}...</TableCell>
                          <TableCell>{fromLocation?.name || 'Unknown'}</TableCell>
                          <TableCell>{toLocation?.name || 'Unknown'}</TableCell>
                          <TableCell>{products.find(p => p.id === transfer.productId)?.name || transfer.productId}</TableCell>
                          <TableCell>{transfer.quantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(transfer.status)}
                              <Badge className={getStatusColor(transfer.status)}>
                                {transfer.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(transfer.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {transfer.status === 'pending' && (
                                <Button size="sm" variant="outline">
                                  Approve
                                </Button>
                              )}
                              {transfer.status === 'in-transit' && (
                                <Button size="sm" variant="outline">
                                  Complete
                                </Button>
                              )}
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
      </Tabs>

      {/* Batch Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBatch ? 'Edit Batch' : 'Create New Batch'}
            </DialogTitle>
            <DialogDescription>
              {editingBatch ? 'Update batch information' : 'Add a new product batch'}
            </DialogDescription>
          </DialogHeader>
          <BatchForm
            batch={editingBatch}
            products={products}
            onSave={handleCreateBatch}
            onClose={() => {
              setBatchDialogOpen(false)
              setEditingBatch(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Create New Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Update warehouse location' : 'Add a new warehouse location'}
            </DialogDescription>
          </DialogHeader>
          <LocationForm
            location={editingLocation}
            onSave={handleCreateLocation}
            onClose={() => {
              setLocationDialogOpen(false)
              setEditingLocation(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reorder Rule Dialog */}
      <Dialog open={reorderDialogOpen} onOpenChange={setReorderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReorderRule ? 'Edit Reorder Rule' : 'Create New Reorder Rule'}
            </DialogTitle>
            <DialogDescription>
              {editingReorderRule ? 'Update reorder rule' : 'Set up automatic reorder rules'}
            </DialogDescription>
          </DialogHeader>
          <ReorderRuleForm
            rule={editingReorderRule}
            products={products}
            onSave={handleCreateReorderRule}
            onClose={() => {
              setReorderDialogOpen(false)
              setEditingReorderRule(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Batch Form Component
function BatchForm({ 
  batch, 
  products,
  onSave, 
  onClose 
}: { 
  batch: Batch | null
  products: Product[]
  onSave: (data: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    productId: batch?.productId || '',
    batchNumber: batch?.batchNumber || '',
    lotNumber: batch?.lotNumber || '',
    quantity: batch?.quantity || 0,
    expiryDate: batch?.expiryDate || '',
    manufacturingDate: batch?.manufacturingDate || '',
    supplier: batch?.supplier || '',
    cost: batch?.cost || 0,
    status: batch?.status || 'active' as const
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product">Product</Label>
          <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="batchNumber">Batch Number</Label>
          <Input
            id="batchNumber"
            value={formData.batchNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lotNumber">Lot Number (Optional)</Label>
          <Input
            id="lotNumber"
            value={formData.lotNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
          <Input
            id="manufacturingDate"
            type="date"
            value={formData.manufacturingDate}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturingDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="cost">Cost per Unit</Label>
          <Input
            id="cost"
            type="number"
            min="0"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {batch ? 'Update Batch' : 'Create Batch'}
        </Button>
      </div>
    </form>
  )
}

// Location Form Component
function LocationForm({ 
  location, 
  onSave, 
  onClose 
}: { 
  location: WarehouseLocation | null
  onSave: (data: Omit<WarehouseLocation, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    code: location?.code || '',
    address: location?.address || '',
    capacity: location?.capacity || 0,
    currentStock: location?.currentStock || 0,
    isActive: location?.isActive ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Location Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="code">Location Code</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="0"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="currentStock">Current Stock</Label>
          <Input
            id="currentStock"
            type="number"
            min="0"
            value={formData.currentStock}
            onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {location ? 'Update Location' : 'Create Location'}
        </Button>
      </div>
    </form>
  )
}

// Reorder Rule Form Component
function ReorderRuleForm({ 
  rule, 
  products,
  onSave, 
  onClose 
}: { 
  rule: ReorderRule | null
  products: Product[]
  onSave: (data: Omit<ReorderRule, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    productId: rule?.productId || '',
    minQuantity: rule?.minQuantity || 0,
    maxQuantity: rule?.maxQuantity || 0,
    reorderPoint: rule?.reorderPoint || 0,
    reorderQuantity: rule?.reorderQuantity || 0,
    supplierId: rule?.supplierId || '',
    isActive: rule?.isActive ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="product">Product</Label>
        <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} ({product.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minQuantity">Minimum Quantity</Label>
          <Input
            id="minQuantity"
            type="number"
            min="0"
            value={formData.minQuantity}
            onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxQuantity">Maximum Quantity</Label>
          <Input
            id="maxQuantity"
            type="number"
            min="0"
            value={formData.maxQuantity}
            onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reorderPoint">Reorder Point</Label>
          <Input
            id="reorderPoint"
            type="number"
            min="0"
            value={formData.reorderPoint}
            onChange={(e) => setFormData(prev => ({ ...prev, reorderPoint: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
          <Input
            id="reorderQuantity"
            type="number"
            min="0"
            value={formData.reorderQuantity}
            onChange={(e) => setFormData(prev => ({ ...prev, reorderQuantity: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  )
}
