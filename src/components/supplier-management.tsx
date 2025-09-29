"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Search, Building2, Phone, MapPin, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { SupplierService, type Supplier } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [balanceAdjustmentSupplier, setBalanceAdjustmentSupplier] = useState<Supplier | null>(null)
  const { toast } = useToast()

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    address: "",
    balance: 0,
  })

  const [balanceAdjustment, setBalanceAdjustment] = useState({
    amount: 0,
    type: "add" as "add" | "subtract",
    reason: "",
  })

  // Load suppliers from Firebase
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const suppliersData = await SupplierService.getAllSuppliers()
        setSuppliers(suppliersData)
        setLoading(false)
      } catch (error) {
        console.error("Error loading suppliers:", error)
        toast({
          title: "Error",
          description: "Failed to load suppliers. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadSuppliers()
  }, [toast])

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter supplier name",
        variant: "destructive",
      })
      return
    }

    try {
      await SupplierService.createSupplier({
        ...newSupplier,
        createdAt: new Date().toISOString(),
      })
      
      setNewSupplier({ name: "", contact: "", address: "", balance: 0 })
      setIsAddDialogOpen(false)
      
      // Reload suppliers
      const suppliersData = await SupplierService.getAllSuppliers()
      setSuppliers(suppliersData)

      toast({
        title: "Supplier Added",
        description: "Supplier has been successfully added",
      })
    } catch (error) {
      console.error("Error adding supplier:", error)
      toast({
        title: "Error",
        description: "Failed to add supplier. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditSupplier = async () => {
    if (!editingSupplier) return

    try {
      await SupplierService.updateSupplier(editingSupplier.id, {
        ...editingSupplier,
        updatedAt: new Date().toISOString(),
      })
      
      setEditingSupplier(null)
      setIsEditDialogOpen(false)
      
      // Reload suppliers
      const suppliersData = await SupplierService.getAllSuppliers()
      setSuppliers(suppliersData)

      toast({
        title: "Supplier Updated",
        description: "Supplier has been successfully updated",
      })
    } catch (error) {
      console.error("Error updating supplier:", error)
      toast({
        title: "Error",
        description: "Failed to update supplier. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return

    try {
      await SupplierService.deleteSupplier(id)
      
      // Reload suppliers
      const suppliersData = await SupplierService.getAllSuppliers()
      setSuppliers(suppliersData)

      toast({
        title: "Supplier Deleted",
        description: "Supplier has been successfully deleted",
      })
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toast({
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsEditDialogOpen(true)
  }

  const openBalanceDialog = (supplier: Supplier) => {
    setBalanceAdjustmentSupplier(supplier)
    setBalanceAdjustment({ amount: 0, type: "add", reason: "" })
    setIsBalanceDialogOpen(true)
  }

  const handleBalanceAdjustment = async () => {
    if (!balanceAdjustmentSupplier || !balanceAdjustment.amount || !balanceAdjustment.reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields for balance adjustment",
        variant: "destructive",
      })
      return
    }

    try {
      const adjustmentAmount = balanceAdjustment.type === "add" 
        ? balanceAdjustment.amount 
        : -balanceAdjustment.amount
      
      const newBalance = balanceAdjustmentSupplier.balance + adjustmentAmount

      await SupplierService.updateSupplier(balanceAdjustmentSupplier.id, {
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      })
      
      setBalanceAdjustmentSupplier(null)
      setIsBalanceDialogOpen(false)
      setBalanceAdjustment({ amount: 0, type: "add", reason: "" })
      
      // Reload suppliers
      const suppliersData = await SupplierService.getAllSuppliers()
      setSuppliers(suppliersData)

      toast({
        title: "Balance Updated",
        description: `Balance ${balanceAdjustment.type === "add" ? "increased" : "decreased"} by Rs${balanceAdjustment.amount.toLocaleString()}`,
      })
    } catch (error) {
      console.error("Error adjusting balance:", error)
      toast({
        title: "Error",
        description: "Failed to adjust balance. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Supplier Management</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name, contact, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Suppliers
          </CardTitle>
          <CardDescription>Manage your supplier information and contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Added: {new Date(supplier.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.contact}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{supplier.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={supplier.balance > 0 ? "destructive" : supplier.balance < 0 ? "secondary" : "default"}>
                          {supplier.balance > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : supplier.balance < 0 ? (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          ) : null}
                          Rs{supplier.balance.toLocaleString()}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openBalanceDialog(supplier)}
                          className="h-6 w-6 p-0"
                        >
                          <DollarSign className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteSupplier(supplier.id)}>
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

      {/* Add Supplier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Enter supplier details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Supplier Name</Label>
              <Input
                id="name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                value={newSupplier.contact}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                placeholder="Enter contact number"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                placeholder="Enter supplier address"
              />
            </div>
            <div>
              <Label htmlFor="balance">Initial Balance</Label>
              <Input
                id="balance"
                type="number"
                value={newSupplier.balance}
                onChange={(e) => setNewSupplier({ ...newSupplier, balance: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSupplier}>Add Supplier</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update supplier details</DialogDescription>
          </DialogHeader>
          {editingSupplier && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Supplier Name</Label>
                <Input
                  id="edit-name"
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-contact">Contact</Label>
                <Input
                  id="edit-contact"
                  value={editingSupplier.contact}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, contact: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={editingSupplier.address}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-balance">Balance</Label>
                <Input
                  id="edit-balance"
                  type="number"
                  value={editingSupplier.balance}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, balance: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSupplier}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Balance Adjustment Dialog */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Adjust Balance
            </DialogTitle>
            <DialogDescription>
              {balanceAdjustmentSupplier && `Adjust balance for ${balanceAdjustmentSupplier.name}`}
            </DialogDescription>
          </DialogHeader>
          {balanceAdjustmentSupplier && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">Rs{balanceAdjustmentSupplier.balance.toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adjustment-type">Adjustment Type</Label>
                  <Select 
                    value={balanceAdjustment.type} 
                    onValueChange={(value: "add" | "subtract") => 
                      setBalanceAdjustment({ ...balanceAdjustment, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add to Balance</SelectItem>
                      <SelectItem value="subtract">Subtract from Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="adjustment-amount">Amount (Rs)</Label>
                  <Input
                    id="adjustment-amount"
                    type="number"
                    min="0"
                    value={balanceAdjustment.amount}
                    onChange={(e) => setBalanceAdjustment({ 
                      ...balanceAdjustment, 
                      amount: Number(e.target.value) 
                    })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="adjustment-reason">Reason</Label>
                <Textarea
                  id="adjustment-reason"
                  value={balanceAdjustment.reason}
                  onChange={(e) => setBalanceAdjustment({ 
                    ...balanceAdjustment, 
                    reason: e.target.value 
                  })}
                  placeholder="Enter reason for balance adjustment..."
                  rows={3}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">New Balance</p>
                <p className="text-xl font-bold">
                  Rs{(balanceAdjustmentSupplier.balance + 
                    (balanceAdjustment.type === "add" ? balanceAdjustment.amount : -balanceAdjustment.amount)
                  ).toLocaleString()}
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBalanceAdjustment}>
                  Update Balance
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
