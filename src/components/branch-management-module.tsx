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
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  ArrowRightLeft,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { BranchManagementService } from "@/lib/branch-management-service"
import { useToast } from "@/hooks/use-toast"
import type { Branch, BranchTransfer, BranchInventory } from "@/types/custom"

export function BranchManagementModule() {
  const [activeTab, setActiveTab] = useState("branches")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Data states
  const [branches, setBranches] = useState<Branch[]>([])
  const [transfers, setTransfers] = useState<BranchTransfer[]>([])
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([])

  // Dialog states
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)

  // Form states
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [transferForm, setTransferForm] = useState({
    fromBranchId: '',
    toBranchId: '',
    productId: '',
    quantity: 0,
    notes: ''
  })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [branchesData, transfersData] = await Promise.all([
        BranchManagementService.getAllBranches(),
        BranchManagementService.getAllTransfers()
      ])
      
      setBranches(branchesData)
      setTransfers(transfersData)
      
      if (branchesData.length > 0 && !selectedBranch) {
        setSelectedBranch(branchesData[0])
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadBranchInventory = async (branchId: string) => {
    try {
      const inventory = await BranchManagementService.getBranchInventory(branchId)
      setBranchInventory(inventory)
    } catch (error) {
      toast({ title: "Error", description: "Failed to load branch inventory", variant: "destructive" })
    }
  }

  const handleCreateBranch = async (branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await BranchManagementService.createBranch(branchData)
      await loadData()
      setBranchDialogOpen(false)
      toast({ title: "Success", description: "Branch created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create branch", variant: "destructive" })
    }
  }

  const handleCreateTransfer = async () => {
    if (!transferForm.fromBranchId || !transferForm.toBranchId || !transferForm.productId || transferForm.quantity <= 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    try {
      await BranchManagementService.createTransfer({
        fromBranchId: transferForm.fromBranchId,
        toBranchId: transferForm.toBranchId,
        productId: transferForm.productId,
        quantity: transferForm.quantity,
        status: 'pending',
        requestedBy: 'current-user', // In real app, get from auth context
        notes: transferForm.notes
      })
      
      await loadData()
      setTransferDialogOpen(false)
      setTransferForm({
        fromBranchId: '',
        toBranchId: '',
        productId: '',
        quantity: 0,
        notes: ''
      })
      toast({ title: "Success", description: "Transfer request created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create transfer", variant: "destructive" })
    }
  }

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await BranchManagementService.approveTransfer(transferId, 'current-user')
      await loadData()
      toast({ title: "Success", description: "Transfer approved" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve transfer", variant: "destructive" })
    }
  }

  const handleCompleteTransfer = async (transferId: string) => {
    try {
      const transfer = transfers.find(t => t.id === transferId)
      if (transfer) {
        await BranchManagementService.transferInventory(
          transfer.fromBranchId,
          transfer.toBranchId,
          transfer.productId,
          transfer.quantity
        )
        await BranchManagementService.completeTransfer(transferId)
        await loadData()
        toast({ title: "Success", description: "Transfer completed" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete transfer", variant: "destructive" })
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
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-transit':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTransfers = transfers.filter(transfer =>
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
          <h2 className="text-2xl font-bold text-foreground">Branch Management</h2>
          <p className="text-muted-foreground">Manage branches, transfers, and inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setBranchDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Branch
          </Button>
          <Button onClick={() => setTransferDialogOpen(true)} variant="outline">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search branches or transfers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Branches Tab */}
        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
              <CardDescription>Manage your store branches and locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBranches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {branch.name}
                            {branch.settings.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{branch.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {branch.address.city}, {branch.address.state}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {branch.contact.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {branch.contact.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={branch.settings.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {branch.settings.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingBranch(branch)
                              setBranchDialogOpen(true)
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

        {/* Transfers Tab */}
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Branch Transfers</CardTitle>
              <CardDescription>Manage inventory transfers between branches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer ID</TableHead>
                      <TableHead>From Branch</TableHead>
                      <TableHead>To Branch</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.map((transfer) => {
                      const fromBranch = branches.find(b => b.id === transfer.fromBranchId)
                      const toBranch = branches.find(b => b.id === transfer.toBranchId)
                      
                      return (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-mono text-sm">{transfer.id.slice(0, 8)}...</TableCell>
                          <TableCell>{fromBranch?.name || 'Unknown'}</TableCell>
                          <TableCell>{toBranch?.name || 'Unknown'}</TableCell>
                          <TableCell>{transfer.productId}</TableCell>
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
                                <Button size="sm" variant="outline" onClick={() => handleApproveTransfer(transfer.id)}>
                                  Approve
                                </Button>
                              )}
                              {transfer.status === 'in-transit' && (
                                <Button size="sm" variant="outline" onClick={() => handleCompleteTransfer(transfer.id)}>
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

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Branch Inventory</CardTitle>
              <CardDescription>View inventory levels by branch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="branch-select">Select Branch</Label>
                <Select onValueChange={(value) => {
                  const branch = branches.find(b => b.id === value)
                  setSelectedBranch(branch || null)
                  if (branch) {
                    loadBranchInventory(branch.id)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBranch && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product ID</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Reserved</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branchInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.productId}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.reservedQuantity}</TableCell>
                          <TableCell>
                            <Badge variant={item.availableQuantity > 0 ? 'default' : 'destructive'}>
                              {item.availableQuantity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(item.lastUpdated).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? 'Edit Branch' : 'Create New Branch'}
            </DialogTitle>
            <DialogDescription>
              {editingBranch ? 'Update branch information' : 'Add a new branch to your system'}
            </DialogDescription>
          </DialogHeader>
          <BranchForm
            branch={editingBranch}
            onSave={handleCreateBranch}
            onClose={() => {
              setBranchDialogOpen(false)
              setEditingBranch(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Transfer</DialogTitle>
            <DialogDescription>Transfer inventory between branches</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from-branch">From Branch</Label>
                <Select onValueChange={(value) => setTransferForm(prev => ({ ...prev, fromBranchId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="to-branch">To Branch</Label>
                <Select onValueChange={(value) => setTransferForm(prev => ({ ...prev, toBranchId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="product-id">Product ID</Label>
              <Input
                id="product-id"
                value={transferForm.productId}
                onChange={(e) => setTransferForm(prev => ({ ...prev, productId: e.target.value }))}
                placeholder="Enter product ID"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={transferForm.notes}
                onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this transfer"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTransfer}>
                Create Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Branch Form Component
function BranchForm({ 
  branch, 
  onSave, 
  onClose 
}: { 
  branch: Branch | null
  onSave: (data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    code: branch?.code || '',
    address: {
      street: branch?.address.street || '',
      city: branch?.address.city || '',
      state: branch?.address.state || '',
      country: branch?.address.country || '',
      postalCode: branch?.address.postalCode || ''
    },
    contact: {
      phone: branch?.contact.phone || '',
      email: branch?.contact.email || '',
      manager: branch?.contact.manager || ''
    },
    settings: {
      currency: branch?.settings.currency || 'USD',
      timezone: branch?.settings.timezone || 'America/New_York',
      isActive: branch?.settings.isActive ?? true,
      isDefault: branch?.settings.isDefault ?? false
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Branch Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="code">Branch Code</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Street"
            value={formData.address.street}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, street: e.target.value }
            }))}
          />
          <Input
            placeholder="City"
            value={formData.address.city}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, city: e.target.value }
            }))}
          />
          <Input
            placeholder="State"
            value={formData.address.state}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, state: e.target.value }
            }))}
          />
          <Input
            placeholder="Postal Code"
            value={formData.address.postalCode}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, postalCode: e.target.value }
            }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Contact Information</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Phone"
            value={formData.contact.phone}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              contact: { ...prev.contact, phone: e.target.value }
            }))}
          />
          <Input
            placeholder="Email"
            type="email"
            value={formData.contact.email}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              contact: { ...prev.contact, email: e.target.value }
            }))}
          />
          <Input
            placeholder="Manager Name"
            value={formData.contact.manager}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              contact: { ...prev.contact, manager: e.target.value }
            }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {branch ? 'Update Branch' : 'Create Branch'}
        </Button>
      </div>
    </form>
  )
}
