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
  Printer, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Download, 
  Play,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { LabelPrintingService } from "@/lib/label-printing-service"
import { ProductService, type Product } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import type { LabelTemplate, LabelPrintJob, PrinterConfig } from "@/types/custom"

export function LabelPrintingModule() {
  const [activeTab, setActiveTab] = useState("templates")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Data states
  const [templates, setTemplates] = useState<LabelTemplate[]>([])
  const [printJobs, setPrintJobs] = useState<LabelPrintJob[]>([])
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  // Form states
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [printQuantity, setPrintQuantity] = useState(1)
  const [selectedPrinter, setSelectedPrinter] = useState<string>("")

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [templatesData, printJobsData, printersData, productsData] = await Promise.all([
        LabelPrintingService.getAllTemplates(),
        LabelPrintingService.getAllPrintJobs(),
        LabelPrintingService.getAllPrinters(),
        ProductService.getAllProducts()
      ])
      
      setTemplates(templatesData)
      setPrintJobs(printJobsData)
      setPrinters(printersData)
      setProducts(productsData)
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (templateData: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await LabelPrintingService.createTemplate(templateData)
      await loadData()
      setTemplateDialogOpen(false)
      toast({ title: "Success", description: "Template created successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" })
    }
  }

  const handlePrintLabel = async () => {
    if (!selectedTemplate || !selectedProduct) return

    try {
      const jobId = await LabelPrintingService.printLabel(
        selectedTemplate.id,
        selectedProduct.id,
        printQuantity
      )
      
      toast({ title: "Print Job Started", description: `Job ID: ${jobId}` })
      setPrintDialogOpen(false)
      await loadData()
    } catch (error) {
      toast({ title: "Error", description: "Failed to start print job", variant: "destructive" })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'printing':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'printing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPrintJobs = printJobs.filter(job =>
    job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-2xl font-bold text-foreground">Label & Sticker Printing</h2>
          <p className="text-muted-foreground">Manage label templates, printers, and print jobs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTemplateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
          <Button onClick={() => setPrinterDialogOpen(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Printers
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates, jobs, or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="print-jobs">Print Jobs</TabsTrigger>
          <TabsTrigger value="print-labels">Print Labels</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Label Templates</CardTitle>
              <CardDescription>Manage your label templates and layouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Printer Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {template.size.width}mm × {template.size.height}mm
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{template.printerSettings.printerType}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(template.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
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

        {/* Print Jobs Tab */}
        <TabsContent value="print-jobs">
          <Card>
            <CardHeader>
              <CardTitle>Print Jobs</CardTitle>
              <CardDescription>Monitor your print job status and history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrintJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">{job.id.slice(0, 8)}...</TableCell>
                        <TableCell>{templates.find(t => t.id === job.templateId)?.name || 'Unknown'}</TableCell>
                        <TableCell>{products.find(p => p.id === job.productId)?.name || 'Unknown'}</TableCell>
                        <TableCell>{job.quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(job.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Print Labels Tab */}
        <TabsContent value="print-labels">
          <Card>
            <CardHeader>
              <CardTitle>Print Labels</CardTitle>
              <CardDescription>Select template and product to print labels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-select">Select Template</Label>
                    <Select onValueChange={(value) => {
                      const template = templates.find(t => t.id === value)
                      setSelectedTemplate(template || null)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} ({template.size.width}mm × {template.size.height}mm)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="product-select">Select Product</Label>
                    <Select onValueChange={(value) => {
                      const product = products.find(p => p.id === value)
                      setSelectedProduct(product || null)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={printQuantity}
                      onChange={(e) => setPrintQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <Button 
                    onClick={() => setPrintDialogOpen(true)}
                    disabled={!selectedTemplate || !selectedProduct}
                    className="w-full"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Labels
                  </Button>
                </div>

                <div className="space-y-4">
                  {selectedTemplate && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Template Preview</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {selectedTemplate.name}</p>
                        <p><strong>Type:</strong> {selectedTemplate.type}</p>
                        <p><strong>Size:</strong> {selectedTemplate.size.width}mm × {selectedTemplate.size.height}mm</p>
                        <p><strong>Printer:</strong> {selectedTemplate.printerSettings.printerType}</p>
                      </div>
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Product Details</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {selectedProduct.name}</p>
                        <p><strong>Code:</strong> {selectedProduct.code}</p>
                        <p><strong>Price:</strong> ${selectedProduct.currentPrice}</p>
                        <p><strong>Stock:</strong> {selectedProduct.stock}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Confirmation Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Print Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to print {printQuantity} label(s) for {selectedProduct?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrintLabel}>
              <Play className="h-4 w-4 mr-2" />
              Print Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
