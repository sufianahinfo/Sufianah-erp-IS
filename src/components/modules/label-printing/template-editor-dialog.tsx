"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { LabelTemplate } from "@/types/custom"

interface TemplateEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (template: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  template?: LabelTemplate | null
}

export function TemplateEditorDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  template 
}: TemplateEditorDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'product',
    size: {
      width: template?.size.width || 25,
      height: template?.size.height || 15
    },
    layout: {
      showProductName: template?.layout.showProductName ?? true,
      showPrice: template?.layout.showPrice ?? true,
      showBarcode: template?.layout.showBarcode ?? false,
      showQRCode: template?.layout.showQRCode ?? false,
      showArabicName: template?.layout.showArabicName ?? false,
      showUrduName: template?.layout.showUrduName ?? false,
      fontSize: template?.layout.fontSize || 12,
      fontFamily: template?.layout.fontFamily || 'Arial',
      textAlign: template?.layout.textAlign || 'center',
      margin: {
        top: template?.layout.margin.top || 2,
        right: template?.layout.margin.right || 2,
        bottom: template?.layout.margin.bottom || 2,
        left: template?.layout.margin.left || 2
      }
    },
    printerSettings: {
      printerType: template?.printerSettings.printerType || 'zebra',
      dpi: template?.printerSettings.dpi || 203,
      printSpeed: template?.printerSettings.printSpeed || 4,
      darkness: template?.printerSettings.darkness || 8
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Template name is required", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await onSave(formData)
      onOpenChange(false)
      toast({ title: "Success", description: "Template saved successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current: any = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          <DialogDescription>
            Configure your label template settings and layout
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="printer">Printer</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Enter template name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Template Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => updateFormData('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product Label</SelectItem>
                      <SelectItem value="price">Price Label</SelectItem>
                      <SelectItem value="barcode">Barcode Label</SelectItem>
                      <SelectItem value="custom">Custom Label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    min="10"
                    max="200"
                    value={formData.size.width}
                    onChange={(e) => updateFormData('size.width', parseInt(e.target.value) || 25)}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (mm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="10"
                    max="200"
                    value={formData.size.height}
                    onChange={(e) => updateFormData('size.height', parseInt(e.target.value) || 15)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Options</CardTitle>
                  <CardDescription>Choose what information to display on the label</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showProductName"
                        checked={formData.layout.showProductName}
                        onCheckedChange={(checked: boolean) => updateFormData('layout.showProductName', checked)}
                      />
                      <Label htmlFor="showProductName">Product Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showPrice"
                        checked={formData.layout.showPrice}
                        onCheckedChange={(checked: boolean) => updateFormData('layout.showPrice', checked)}
                      />
                      <Label htmlFor="showPrice">Price</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showBarcode"
                        checked={formData.layout.showBarcode}
                        onCheckedChange={(checked: boolean) => updateFormData('layout.showBarcode', checked)}
                      />
                      <Label htmlFor="showBarcode">Barcode</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showQRCode"
                        checked={formData.layout.showQRCode}
                        onCheckedChange={(checked: boolean) => updateFormData('layout.showQRCode', checked)}
                      />
                      <Label htmlFor="showQRCode">QR Code</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showArabicName"
                        checked={formData.layout.showArabicName}
                        onCheckedChange={(checked: boolean) => updateFormData('layout.showArabicName', checked)}
                      />
                      <Label htmlFor="showArabicName">Arabic Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showUrduName"
                        checked={formData.layout.showUrduName}
                        onCheckedChange={(checked: boolean) => updateFormData('layout.showUrduName', checked)}
                      />
                      <Label htmlFor="showUrduName">Urdu Name</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>Configure text appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Input
                        id="fontSize"
                        type="number"
                        min="6"
                        max="24"
                        value={formData.layout.fontSize}
                        onChange={(e) => updateFormData('layout.fontSize', parseInt(e.target.value) || 12)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <Select
                        value={formData.layout.fontFamily}
                        onValueChange={(value) => updateFormData('layout.fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Noto Sans Arabic">Noto Sans Arabic</SelectItem>
                          <SelectItem value="Noto Sans Urdu">Noto Sans Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="textAlign">Text Alignment</Label>
                    <Select
                      value={formData.layout.textAlign}
                      onValueChange={(value) => updateFormData('layout.textAlign', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Margins</CardTitle>
                  <CardDescription>Set label margins in millimeters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="marginTop">Top</Label>
                      <Input
                        id="marginTop"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.layout.margin.top}
                        onChange={(e) => updateFormData('layout.margin.top', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginRight">Right</Label>
                      <Input
                        id="marginRight"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.layout.margin.right}
                        onChange={(e) => updateFormData('layout.margin.right', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginBottom">Bottom</Label>
                      <Input
                        id="marginBottom"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.layout.margin.bottom}
                        onChange={(e) => updateFormData('layout.margin.bottom', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginLeft">Left</Label>
                      <Input
                        id="marginLeft"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.layout.margin.left}
                        onChange={(e) => updateFormData('layout.margin.left', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Printer Settings Tab */}
            <TabsContent value="printer" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Printer Configuration</CardTitle>
                  <CardDescription>Configure printer-specific settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="printerType">Printer Type</Label>
                    <Select
                      value={formData.printerSettings.printerType}
                      onValueChange={(value) => updateFormData('printerSettings.printerType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zebra">Zebra</SelectItem>
                        <SelectItem value="brother">Brother</SelectItem>
                        <SelectItem value="dymo">DYMO</SelectItem>
                        <SelectItem value="generic">Generic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dpi">DPI</Label>
                      <Input
                        id="dpi"
                        type="number"
                        min="150"
                        max="600"
                        value={formData.printerSettings.dpi}
                        onChange={(e) => updateFormData('printerSettings.dpi', parseInt(e.target.value) || 203)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="printSpeed">Print Speed</Label>
                      <Input
                        id="printSpeed"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.printerSettings.printSpeed}
                        onChange={(e) => updateFormData('printerSettings.printSpeed', parseInt(e.target.value) || 4)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="darkness">Darkness</Label>
                      <Input
                        id="darkness"
                        type="number"
                        min="1"
                        max="15"
                        value={formData.printerSettings.darkness}
                        onChange={(e) => updateFormData('printerSettings.darkness', parseInt(e.target.value) || 8)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Label Preview</CardTitle>
                  <CardDescription>Preview how your label will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div 
                      className="border-2 border-dashed border-gray-300 bg-white p-4 text-center"
                      style={{
                        width: `${Math.max(formData.size.width * 2, 100)}px`,
                        height: `${Math.max(formData.size.height * 2, 60)}px`,
                        fontSize: `${formData.layout.fontSize}px`,
                        fontFamily: formData.layout.fontFamily,
                        textAlign: formData.layout.textAlign as any
                      }}
                    >
                      {formData.layout.showProductName && (
                        <div className="font-bold">Sample Product Name</div>
                      )}
                      {formData.layout.showPrice && (
                        <div className="text-lg">$19.99</div>
                      )}
                      {formData.layout.showBarcode && (
                        <div className="text-xs font-mono">*123456789*</div>
                      )}
                      {formData.layout.showQRCode && (
                        <div className="text-xs">[QR Code]</div>
                      )}
                      {formData.layout.showArabicName && (
                        <div className="text-sm">اسم المنتج</div>
                      )}
                      {formData.layout.showUrduName && (
                        <div className="text-sm">پروڈکٹ کا نام</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
