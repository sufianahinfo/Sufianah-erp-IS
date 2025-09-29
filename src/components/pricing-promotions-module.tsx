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
  Percent,
  Star,
  Gift,
  TrendingUp,
  Users,
  Calendar,
  DollarSign
} from "lucide-react"
import { PricingPromotionsService } from "@/lib/pricing-promotions-service"
import { ProductService, CustomerService, type Product, type Customer } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import type { PriceList, PriceListItem, DiscountTier, LoyaltyProgram, PromotionalCampaign } from "@/types/custom"

export function PricingPromotionsModule() {
  const [activeTab, setActiveTab] = useState("price-lists")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Data states
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([])
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([])
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([])
  const [promotionalCampaigns, setPromotionalCampaigns] = useState<PromotionalCampaign[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  // Dialog states
  const [priceListDialogOpen, setPriceListDialogOpen] = useState(false)
  const [discountTierDialogOpen, setDiscountTierDialogOpen] = useState(false)
  const [loyaltyProgramDialogOpen, setLoyaltyProgramDialogOpen] = useState(false)
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [priceListItemDialogOpen, setPriceListItemDialogOpen] = useState(false)

  // Form states
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null)
  const [editingDiscountTier, setEditingDiscountTier] = useState<DiscountTier | null>(null)
  const [editingLoyaltyProgram, setEditingLoyaltyProgram] = useState<LoyaltyProgram | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<PromotionalCampaign | null>(null)
  const [selectedPriceList, setSelectedPriceList] = useState<string>("")

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        priceListsData,
        discountTiersData,
        loyaltyProgramsData,
        campaignsData,
        productsData,
        customersData
      ] = await Promise.all([
        PricingPromotionsService.getAllPriceLists(),
        PricingPromotionsService.getAllDiscountTiers(),
        PricingPromotionsService.getAllLoyaltyPrograms(),
        PricingPromotionsService.getAllPromotionalCampaigns(),
        ProductService.getAllProducts(),
        CustomerService.getAllCustomers()
      ])
      
      setPriceLists(priceListsData)
      setDiscountTiers(discountTiersData)
      setLoyaltyPrograms(loyaltyProgramsData)
      setPromotionalCampaigns(campaignsData)
      setProducts(productsData)
      setCustomers(customersData)
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadPriceListItems = async (priceListId: string) => {
    try {
      const items = await PricingPromotionsService.getPriceListItems(priceListId)
      setPriceListItems(items)
    } catch (error) {
      toast({ title: "Error", description: "Failed to load price list items", variant: "destructive" })
    }
  }

  const handleCreatePriceList = async (priceListData: Omit<PriceList, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await PricingPromotionsService.createPriceList(priceListData)
      await loadData()
      setPriceListDialogOpen(false)
      toast({ title: "Success", description: "Price list created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create price list", variant: "destructive" })
    }
  }

  const handleCreateDiscountTier = async (tierData: Omit<DiscountTier, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await PricingPromotionsService.createDiscountTier(tierData)
      await loadData()
      setDiscountTierDialogOpen(false)
      toast({ title: "Success", description: "Discount tier created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create discount tier", variant: "destructive" })
    }
  }

  const handleCreateLoyaltyProgram = async (programData: Omit<LoyaltyProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await PricingPromotionsService.createLoyaltyProgram(programData)
      await loadData()
      setLoyaltyProgramDialogOpen(false)
      toast({ title: "Success", description: "Loyalty program created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create loyalty program", variant: "destructive" })
    }
  }

  const handleCreateCampaign = async (campaignData: Omit<PromotionalCampaign, 'id' | 'createdAt' | 'updatedAt' | 'currentUsage'>) => {
    try {
      await PricingPromotionsService.createPromotionalCampaign(campaignData)
      await loadData()
      setCampaignDialogOpen(false)
      toast({ title: "Success", description: "Promotional campaign created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" })
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const filteredPriceLists = priceLists.filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDiscountTiers = discountTiers.filter(tier =>
    tier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tier.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCampaigns = promotionalCampaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.type.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-2xl font-bold text-foreground">Pricing & Promotions</h2>
          <p className="text-muted-foreground">Manage price lists, discounts, loyalty programs, and campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPriceListDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Price List
          </Button>
          <Button onClick={() => setDiscountTierDialogOpen(true)} variant="outline">
            <Percent className="h-4 w-4 mr-2" />
            New Discount
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pricing and promotions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="price-lists">Price Lists</TabsTrigger>
          <TabsTrigger value="discount-tiers">Discount Tiers</TabsTrigger>
          <TabsTrigger value="loyalty-programs">Loyalty Programs</TabsTrigger>
          <TabsTrigger value="campaigns">Promotional Campaigns</TabsTrigger>
        </TabsList>

        {/* Price Lists Tab */}
        <TabsContent value="price-lists">
          <Card>
            <CardHeader>
              <CardTitle>Price Lists</CardTitle>
              <CardDescription>Manage customer and product-specific pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Valid From</TableHead>
                      <TableHead>Valid To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPriceLists.map((list) => (
                      <TableRow key={list.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {list.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{list.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(list.validFrom).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {list.validTo ? new Date(list.validTo).toLocaleDateString() : 'No expiry'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(list.isActive)}>
                            {list.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingPriceList(list)
                              setPriceListDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedPriceList(list.id)
                              loadPriceListItems(list.id)
                              setPriceListItemDialogOpen(true)
                            }}>
                              <Plus className="h-4 w-4" />
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

        {/* Discount Tiers Tab */}
        <TabsContent value="discount-tiers">
          <Card>
            <CardHeader>
              <CardTitle>Discount Tiers</CardTitle>
              <CardDescription>Set up automatic discounts based on purchase amount or quantity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Min Purchase</TableHead>
                      <TableHead>Valid Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDiscountTiers.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            {tier.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tier.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {tier.type === 'percentage' ? `${tier.value}%` : `$${tier.value}`}
                        </TableCell>
                        <TableCell>
                          {tier.minPurchaseAmount ? `$${tier.minPurchaseAmount}` : 'No minimum'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(tier.validFrom).toLocaleDateString()}</div>
                            {tier.validTo && (
                              <div className="text-muted-foreground">
                                to {new Date(tier.validTo).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(tier.isActive)}>
                            {tier.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingDiscountTier(tier)
                              setDiscountTierDialogOpen(true)
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

        {/* Loyalty Programs Tab */}
        <TabsContent value="loyalty-programs">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Programs</CardTitle>
              <CardDescription>Manage customer loyalty programs and reward tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Points per $</TableHead>
                      <TableHead>Redemption Rate</TableHead>
                      <TableHead>Tiers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loyaltyPrograms.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            {program.name}
                          </div>
                        </TableCell>
                        <TableCell>{program.pointsPerDollar}</TableCell>
                        <TableCell>{program.redemptionRate} pts = $1</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{program.tiers.length} tiers</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(program.isActive)}>
                            {program.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingLoyaltyProgram(program)
                              setLoyaltyProgramDialogOpen(true)
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

        {/* Promotional Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Promotional Campaigns</CardTitle>
              <CardDescription>Create and manage promotional campaigns and special offers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Valid Period</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            {campaign.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {campaign.discountType === 'percentage' 
                            ? `${campaign.discountValue}%` 
                            : campaign.discountType === 'fixed'
                            ? `$${campaign.discountValue}`
                            : 'Free Item'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(campaign.validFrom).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              to {new Date(campaign.validTo).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {campaign.currentUsage}
                            {campaign.usageLimit && ` / ${campaign.usageLimit}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(campaign.isActive)}>
                            {campaign.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingCampaign(campaign)
                              setCampaignDialogOpen(true)
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
      </Tabs>

      {/* Price List Dialog */}
      <Dialog open={priceListDialogOpen} onOpenChange={setPriceListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPriceList ? 'Edit Price List' : 'Create New Price List'}
            </DialogTitle>
            <DialogDescription>
              {editingPriceList ? 'Update price list information' : 'Create a new price list for specific customers or products'}
            </DialogDescription>
          </DialogHeader>
          <PriceListForm
            priceList={editingPriceList}
            onSave={handleCreatePriceList}
            onClose={() => {
              setPriceListDialogOpen(false)
              setEditingPriceList(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Discount Tier Dialog */}
      <Dialog open={discountTierDialogOpen} onOpenChange={setDiscountTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDiscountTier ? 'Edit Discount Tier' : 'Create New Discount Tier'}
            </DialogTitle>
            <DialogDescription>
              {editingDiscountTier ? 'Update discount tier' : 'Set up automatic discounts based on purchase criteria'}
            </DialogDescription>
          </DialogHeader>
          <DiscountTierForm
            tier={editingDiscountTier}
            onSave={handleCreateDiscountTier}
            onClose={() => {
              setDiscountTierDialogOpen(false)
              setEditingDiscountTier(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Loyalty Program Dialog */}
      <Dialog open={loyaltyProgramDialogOpen} onOpenChange={setLoyaltyProgramDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLoyaltyProgram ? 'Edit Loyalty Program' : 'Create New Loyalty Program'}
            </DialogTitle>
            <DialogDescription>
              {editingLoyaltyProgram ? 'Update loyalty program' : 'Create a customer loyalty program with reward tiers'}
            </DialogDescription>
          </DialogHeader>
          <LoyaltyProgramForm
            program={editingLoyaltyProgram}
            onSave={handleCreateLoyaltyProgram}
            onClose={() => {
              setLoyaltyProgramDialogOpen(false)
              setEditingLoyaltyProgram(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign ? 'Update promotional campaign' : 'Create a promotional campaign with special offers'}
            </DialogDescription>
          </DialogHeader>
          <CampaignForm
            campaign={editingCampaign}
            onSave={handleCreateCampaign}
            onClose={() => {
              setCampaignDialogOpen(false)
              setEditingCampaign(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Price List Form Component
function PriceListForm({ 
  priceList, 
  onSave, 
  onClose 
}: { 
  priceList: PriceList | null
  onSave: (data: Omit<PriceList, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: priceList?.name || '',
    description: priceList?.description || '',
    type: priceList?.type || 'product' as const,
    isActive: priceList?.isActive ?? true,
    validFrom: priceList?.validFrom || new Date().toISOString().split('T')[0],
    validTo: priceList?.validTo || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Price List Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">Valid From</Label>
          <Input
            id="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="validTo">Valid To (Optional)</Label>
          <Input
            id="validTo"
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {priceList ? 'Update Price List' : 'Create Price List'}
        </Button>
      </div>
    </form>
  )
}

// Discount Tier Form Component
function DiscountTierForm({ 
  tier, 
  onSave, 
  onClose 
}: { 
  tier: DiscountTier | null
  onSave: (data: Omit<DiscountTier, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    description: tier?.description || '',
    type: tier?.type || 'percentage' as const,
    value: tier?.value || 0,
    minPurchaseAmount: tier?.minPurchaseAmount || 0,
    maxDiscountAmount: tier?.maxDiscountAmount || 0,
    isActive: tier?.isActive ?? true,
    validFrom: tier?.validFrom || new Date().toISOString().split('T')[0],
    validTo: tier?.validTo || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Tier Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Discount Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
              <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="value">Discount Value</Label>
          <Input
            id="value"
            type="number"
            min="0"
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="minPurchaseAmount">Minimum Purchase Amount</Label>
          <Input
            id="minPurchaseAmount"
            type="number"
            min="0"
            step="0.01"
            value={formData.minPurchaseAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, minPurchaseAmount: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxDiscountAmount">Maximum Discount Amount</Label>
          <Input
            id="maxDiscountAmount"
            type="number"
            min="0"
            step="0.01"
            value={formData.maxDiscountAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, maxDiscountAmount: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="validFrom">Valid From</Label>
          <Input
            id="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {tier ? 'Update Tier' : 'Create Tier'}
        </Button>
      </div>
    </form>
  )
}

// Loyalty Program Form Component
function LoyaltyProgramForm({ 
  program, 
  onSave, 
  onClose 
}: { 
  program: LoyaltyProgram | null
  onSave: (data: Omit<LoyaltyProgram, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: program?.name || '',
    description: program?.description || '',
    pointsPerDollar: program?.pointsPerDollar || 1,
    pointsPerPurchase: program?.pointsPerPurchase || 10,
    redemptionRate: program?.redemptionRate || 100,
    isActive: program?.isActive ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      tiers: program?.tiers || [
        {
          name: 'Bronze',
          minPoints: 0,
          multiplier: 1,
          benefits: ['Basic benefits']
        }
      ]
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Program Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="pointsPerDollar">Points per Dollar</Label>
          <Input
            id="pointsPerDollar"
            type="number"
            min="0"
            step="0.1"
            value={formData.pointsPerDollar}
            onChange={(e) => setFormData(prev => ({ ...prev, pointsPerDollar: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="pointsPerPurchase">Points per Purchase</Label>
          <Input
            id="pointsPerPurchase"
            type="number"
            min="0"
            value={formData.pointsPerPurchase}
            onChange={(e) => setFormData(prev => ({ ...prev, pointsPerPurchase: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="redemptionRate">Redemption Rate (points per $1)</Label>
          <Input
            id="redemptionRate"
            type="number"
            min="1"
            value={formData.redemptionRate}
            onChange={(e) => setFormData(prev => ({ ...prev, redemptionRate: parseInt(e.target.value) || 100 }))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {program ? 'Update Program' : 'Create Program'}
        </Button>
      </div>
    </form>
  )
}

// Campaign Form Component
function CampaignForm({ 
  campaign, 
  onSave, 
  onClose 
}: { 
  campaign: PromotionalCampaign | null
  onSave: (data: Omit<PromotionalCampaign, 'id' | 'createdAt' | 'updatedAt' | 'currentUsage'>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    type: campaign?.type || 'discount' as const,
    discountType: campaign?.discountType || 'percentage' as const,
    discountValue: campaign?.discountValue || 0,
    minPurchaseAmount: campaign?.minPurchaseAmount || 0,
    maxDiscountAmount: campaign?.maxDiscountAmount || 0,
    isActive: campaign?.isActive ?? true,
    validFrom: campaign?.validFrom || new Date().toISOString().split('T')[0],
    validTo: campaign?.validTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: campaign?.usageLimit || 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Campaign Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discount">Discount</SelectItem>
              <SelectItem value="bogo">Buy One Get One</SelectItem>
              <SelectItem value="free_shipping">Free Shipping</SelectItem>
              <SelectItem value="gift_with_purchase">Gift with Purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discountType">Discount Type</Label>
          <Select value={formData.discountType} onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
              <SelectItem value="free_item">Free Item</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discountValue">Discount Value</Label>
          <Input
            id="discountValue"
            type="number"
            min="0"
            step="0.01"
            value={formData.discountValue}
            onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minPurchaseAmount">Minimum Purchase Amount</Label>
          <Input
            id="minPurchaseAmount"
            type="number"
            min="0"
            step="0.01"
            value={formData.minPurchaseAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, minPurchaseAmount: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="maxDiscountAmount">Maximum Discount Amount</Label>
          <Input
            id="maxDiscountAmount"
            type="number"
            min="0"
            step="0.01"
            value={formData.maxDiscountAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, maxDiscountAmount: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="validFrom">Valid From</Label>
          <Input
            id="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="validTo">Valid To</Label>
          <Input
            id="validTo"
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="usageLimit">Usage Limit (0 = unlimited)</Label>
          <Input
            id="usageLimit"
            type="number"
            min="0"
            value={formData.usageLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  )
}
