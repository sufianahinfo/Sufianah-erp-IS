"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Minus, Trash2, ShoppingCart, Eye, Package, Building2, Phone, DollarSign, FileText, Gift } from "lucide-react"
import { ProductService, SupplierService, PurchaseService, type Product, type Supplier, type Purchase } from "@/lib/firebase-services"
import { SupplierInvoiceCounterService } from "@/lib/supplier-invoice-counter-service"
import { useToast } from "@/hooks/use-toast"
import html2canvas from 'html2canvas'
import { SupplierInvoiceModal, generateSupplierInvoiceHTML } from "./modules/purchasing/supplier-invoice-modal"

// Defining the types for purchase cart items
interface PurchaseCartItem {
  id: string
  name: string
  code: string
  quantity: number
  unitPrice: number
  subtotal: number
  fabricType?: string
  size?: string
  individualPrices: number[] // Array of individual prices for each unit
  totalAmount: number // Total amount paid for this product
  tradeDiscountFreeItems?: number // Free items for trade discount
}

interface PurchasingModuleProps {
  defaultTab?: "purchase" | "history"
}

function PurchasingModule({ defaultTab = "purchase" }: PurchasingModuleProps = {}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<PurchaseCartItem[]>([])
  const [supplierId, setSupplierId] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [supplierContact, setSupplierContact] = useState("")
  const [supplierAddress, setSupplierAddress] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
  const { toast } = useToast()

  // Purchase history state
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false)
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState("")
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState("all")
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingItem, setPricingItem] = useState<PurchaseCartItem | null>(null)

  // Cart-level discount
  const [cartDiscount, setCartDiscount] = useState<number>(0)
  const [cartDiscountPercentage, setCartDiscountPercentage] = useState<number>(0)

  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [lastPurchaseData, setLastPurchaseData] = useState<{
    invoiceNumber: string;
    date: string;
    time: string;
    supplierName: string;
    supplierContact: string;
    supplierAddress: string;
    staffName: string;
    items: Array<{
      name: string;
      code: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      fabricType?: string;
      size?: string;
    }>;
    subtotal: number;
    totalDiscount: number;
    total: number;
  } | null>(null)

  // Purchase details modal state
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

  // Load products and suppliers from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, suppliersData] = await Promise.all([
          ProductService.getAllProducts(),
          SupplierService.getAllSuppliers(),
        ])
        setProducts(productsData)
        setSuppliers(suppliersData)
        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Load purchase history
  useEffect(() => {
    const loadPurchaseHistory = async () => {
      setPurchaseHistoryLoading(true)
      try {
        const purchasesData = await PurchaseService.getAllPurchases()
        setPurchases(purchasesData)
      } catch (error) {
        console.error("Error loading purchase history:", error)
        toast({
          title: "Error",
          description: "Failed to load purchase history.",
          variant: "destructive",
        })
      } finally {
        setPurchaseHistoryLoading(false)
      }
    }

    loadPurchaseHistory()
  }, [toast])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id)
    
    let updatedCart: PurchaseCartItem[]
    
    if (existingItem) {
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              subtotal: (item.quantity + 1) * item.unitPrice,
              individualPrices: [...item.individualPrices, product.purchaseCost],
              totalAmount: item.totalAmount + product.purchaseCost
            }
          : item,
      )
    } else {
      updatedCart = [
        ...cart,
        {
          id: product.id,
          name: product.name,
          code: product.code,
          quantity: 1,
          unitPrice: product.purchaseCost, // Use purchase cost as unit price
          subtotal: product.purchaseCost,
          fabricType: product.fabricType,
          size: product.size,
          individualPrices: [product.purchaseCost],
          totalAmount: product.purchaseCost,
        },
      ]
    }
    
    setCart(updatedCart)
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
      const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
      setCartDiscount(newDiscount)
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }

    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
        : item,
    )
    
    setCart(updatedCart)
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
      const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
      setCartDiscount(newDiscount)
    }
  }

  const handleQuantityInput = (id: string, value: string) => {
    // If empty string, set quantity to 0 but don't remove from cart
    if (value === "") {
      const updatedCart = cart.map((item) =>
        item.id === id
          ? { ...item, quantity: 0, subtotal: 0 }
          : item,
      )
      setCart(updatedCart)
      return
    }

    const newQuantity = parseFloat(value)
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      // Set to 0 instead of removing from cart
      const updatedCart = cart.map((item) =>
        item.id === id
          ? { ...item, quantity: 0, subtotal: 0 }
          : item,
      )
      setCart(updatedCart)
      return
    }

    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
        : item,
    )
    
    setCart(updatedCart)
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
      const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
      setCartDiscount(newDiscount)
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
    // Recalculate discount when cart changes
    const newCart = cart.filter((item) => item.id !== id)
    if (newCart.length === 0) {
      setCartDiscount(0)
      setCartDiscountPercentage(0)
    } else if (cartDiscountPercentage > 0) {
      // Recalculate discount based on new subtotal
      const newSubtotal = newCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
      const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
      setCartDiscount(newDiscount)
    }
  }

  // Add trade discount to cart item
  const addTradeDiscountUnit = (productId: string) => {
    const existingItem = cart.find(item => item.id === productId)
    if (!existingItem) {
      return
    }

    const updatedCart = cart.map(item => 
      item.id === productId 
        ? { 
            ...item, 
            tradeDiscountFreeItems: (item.tradeDiscountFreeItems || 0) + 1 
          }
        : item
    )
    
    setCart(updatedCart)
    toast({ 
      title: "Trade Discount Added", 
      description: `1 free unit added for ${existingItem.name}` 
    })
  }

  // Remove trade discount from cart item
  const removeTradeDiscountUnit = (productId: string) => {
    const existingItem = cart.find(item => item.id === productId)
    if (!existingItem || !existingItem.tradeDiscountFreeItems || existingItem.tradeDiscountFreeItems <= 0) {
      return
    }

    const updatedCart = cart.map(item => 
      item.id === productId 
        ? { 
            ...item, 
            tradeDiscountFreeItems: Math.max(0, (item.tradeDiscountFreeItems || 0) - 1) 
          }
        : item
    )
    
    setCart(updatedCart)
    toast({ 
      title: "Trade Discount Removed", 
      description: `1 free unit removed from ${existingItem.name}` 
    })
  }

  // Functions for individual pricing
  const openPricingModal = (item: PurchaseCartItem) => {
    setPricingItem(item)
    setShowPricingModal(true)
  }

  const updateIndividualPrices = (itemId: string, individualPrices: number[]) => {
    const totalAmount = parseFloat(individualPrices.reduce((sum, price) => sum + price, 0).toFixed(2))
    const averagePrice = parseFloat((totalAmount / individualPrices.length).toFixed(2))
    
    setCart(cart.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            individualPrices, 
            totalAmount,
            unitPrice: averagePrice,
            subtotal: parseFloat((averagePrice * item.quantity).toFixed(2))
          }
        : item
    ))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.totalAmount, 0)
  const totalDiscount = cartDiscount
  const total = Math.max(0, subtotal - totalDiscount)

  // Function to update discount by amount
  const updateDiscountByAmount = (amount: number) => {
    setCartDiscount(amount)
    if (subtotal > 0) {
      const percentage = Math.round((amount / subtotal) * 100)
      setCartDiscountPercentage(percentage)
    } else {
      setCartDiscountPercentage(0)
    }
  }

  // Function to update discount by percentage
  const updateDiscountByPercentage = (percentage: number) => {
    setCartDiscountPercentage(percentage)
    const amount = Math.round((percentage / 100) * subtotal)
    setCartDiscount(amount)
  }

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier) {
      setSupplierId(supplier.id)
      setSupplierName(supplier.name)
      setSupplierContact(supplier.contact)
      setSupplierAddress(supplier.address)
    }
  }

  const handleCompletePurchase = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before completing purchase",
        variant: "destructive",
      })
      return
    }

    if (!supplierId) {
      toast({
        title: "Missing Information",
        description: "Please select a supplier",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPurchase(true)

    try {
      // Generate sequential invoice number
      const invoiceNumber = await SupplierInvoiceCounterService.getNextSupplierInvoiceNumber()

      // Distribute cart-level discount proportionally to items for record-keeping
      const distributedDiscounts: { [id: string]: number } = {}
      const runningDiscount = totalDiscount
      if (cart.length > 0 && totalDiscount > 0 && subtotal > 0) {
        // Proportional distribution
        let sumDistributed = 0
        cart.forEach((item, idx) => {
          if (idx === cart.length - 1) {
            // Last item gets the remainder
            distributedDiscounts[item.id] = runningDiscount - sumDistributed
          } else {
            const itemShare = Math.round((item.unitPrice * item.quantity / subtotal) * totalDiscount)
            distributedDiscounts[item.id] = itemShare
            sumDistributed += itemShare
          }
        })
      } else {
        cart.forEach(item => { distributedDiscounts[item.id] = 0 })
      }

      const purchaseItems = cart.map((item) => ({
        productId: item.id,
        name: item.name,
        code: item.code,
        quantity: item.quantity,
        unitPrice: item.unitPrice - (distributedDiscounts[item.id] ?? 0) / (item.quantity || 1),
        subtotal: item.subtotal - (distributedDiscounts[item.id] ?? 0),
        fabricType: item.fabricType,
        size: item.size,
        individualPrices: item.individualPrices,
        totalAmount: item.totalAmount,
      }))

      const purchaseData: Omit<Purchase, "id"> = {
        invoiceNumber: invoiceNumber,
        supplierId: supplierId,
        supplierName: supplierName,
        supplierContact: supplierContact,
        supplierAddress: supplierAddress,
        items: purchaseItems,
        subtotal: subtotal,
        discount: totalDiscount,
        totalAmount: total,
        createdAt: new Date().toISOString(),
        createdBy: "System", // TODO: Get from auth context
      }

      await PurchaseService.createPurchase(purchaseData)

      // Update product stock (increment stock) with individual pricing and trade discount
      for (const item of cart) {
        const product = products.find((p) => p.id === item.id)
        if (product) {
          // Calculate average purchase price from individual prices
          const averagePurchasePrice = parseFloat((item.individualPrices.reduce((sum, price) => sum + price, 0) / item.quantity).toFixed(2))
          
          // Total quantity includes both paid and free items
          const totalQuantity = item.quantity + (item.tradeDiscountFreeItems || 0)
          
          // Update product with new stock and average purchase price
          await ProductService.updateProduct(item.id, {
            stock: product.stock + totalQuantity,
            purchaseCost: averagePurchasePrice, // Update purchase cost with actual paid price
            updatedAt: new Date().toISOString()
          })

          // Create stock movement record for paid items
          await ProductService.addStockMovement({
            itemId: item.id,
            itemName: item.name,
            type: "in",
            quantity: item.quantity,
            reason: `Purchase from Supplier - Avg Price: Rs${averagePurchasePrice.toFixed(2)}`,
            staff: "System", // TODO: Get from auth context
            date: new Date().toISOString(),
            reference: invoiceNumber,
          })

          // Create stock movement record for trade discount items
          if (item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0) {
            await ProductService.addStockMovement({
              itemId: item.id,
              itemName: item.name,
              type: "in",
              quantity: item.tradeDiscountFreeItems,
              reason: `Trade Discount - Free Items from Supplier`,
              staff: "System", // TODO: Get from auth context
              date: new Date().toISOString(),
              reference: invoiceNumber,
            })
          }
        }
      }

      // Update local products state to reflect new stock levels
      setProducts(products.map(product => {
        const cartItem = cart.find(item => item.id === product.id)
        if (cartItem) {
          const totalQuantity = cartItem.quantity + (cartItem.tradeDiscountFreeItems || 0)
          return { ...product, stock: product.stock + totalQuantity }
        }
        return product
      }))

      // Save last purchase data for invoice
      setLastPurchaseData({
        invoiceNumber: invoiceNumber,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString(),
        supplierName: supplierName,
        supplierContact: supplierContact,
        supplierAddress: supplierAddress,
        staffName: "System", // TODO: Get from auth context
        items: cart.map(item => ({
          name: item.name,
          code: item.code,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          fabricType: item.fabricType || 'N/A',
          size: item.size || 'N/A',
          tradeDiscountFreeItems: item.tradeDiscountFreeItems || 0,
        })),
        subtotal: subtotal,
        totalDiscount: totalDiscount,
        total: total,
      })

      // Show invoice modal
      setShowInvoiceModal(true)

      toast({
        title: "Purchase Completed",
        description: `Purchase completed successfully! Total: Rs${total.toLocaleString()}`,
      })

      // Reset form
      setCart([])
      setSupplierId("")
      setSupplierName("")
      setSupplierContact("")
      setSupplierAddress("")
      setCartDiscount(0)
      setCartDiscountPercentage(0)

      // Reload purchase history
      const purchasesData = await PurchaseService.getAllPurchases()
      setPurchases(purchasesData)
      
    } catch (error) {
      console.error("Error completing purchase:", error)
      toast({
        title: "Error",
        description: "Failed to complete purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPurchase(false)
    }
  }

  // Filter purchases for history tab
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch = purchase.invoiceNumber.toLowerCase().includes(purchaseSearchTerm.toLowerCase()) ||
                         purchase.supplierName.toLowerCase().includes(purchaseSearchTerm.toLowerCase())
    const matchesSupplier = selectedSupplierFilter === "all" || purchase.supplierId === selectedSupplierFilter
    return matchesSearch && matchesSupplier
  })

  // Function to view purchase details
  const viewPurchaseDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowPurchaseDetails(true)
  }

  // Print invoice handler
  const handlePrint = async () => {
    if (!lastPurchaseData) return

    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const invoiceHtml = generateSupplierInvoiceHTML(lastPurchaseData)
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        // Check if content exceeds one page and adjust accordingly
        const bodyHeight = printWindow.document.body.scrollHeight
        const viewportHeight = printWindow.innerHeight
        const isOverflowing = bodyHeight > viewportHeight * 0.9 // 90% of viewport height
        
        if (isOverflowing) {
          // Add CSS to make content fit on one page
          const style = printWindow.document.createElement('style')
          style.textContent = `
            @media print {
              body { 
                transform: scale(0.85);
                transform-origin: top left;
                width: 117.6%; /* Compensate for scale */
              }
              .header { margin-bottom: 20px !important; }
              .company-name { font-size: 24px !important; }
              .company-details { font-size: 13px !important; }
              .invoice-details { font-size: 13px !important; }
              .invoice-details p { font-size: 13px !important; }
              table { font-size: 10px !important; margin: 15px 0 !important; }
              th, td { padding: 6px 4px !important; font-size: 10px !important; }
              tbody td { font-size: 11px !important; }
              .totals td { font-size: 14px !important; }
              .totals .total-row { font-size: 16px !important; }
              .thank-you { margin-top: 12px !important; padding: 6px !important; }
              .thank-you h3 { font-size: 16px !important; }
              .thank-you p { font-size: 10px !important; }
            }
          `
          printWindow.document.head.appendChild(style)
        }
        
        printWindow.focus()
        printWindow.print()
      }, 1000)
    }
  }

  // WhatsApp invoice handler
  const handleWhatsAppInvoice = async () => {
    if (!lastPurchaseData) return

    try {
      const invoiceHTML = generateSupplierInvoiceHTML(lastPurchaseData)

      const captureWindow = window.open('', '_blank', 'width=800,height=600')
      if (!captureWindow) {
        toast({
          title: "Error",
          description: "Unable to open capture window. Please check your popup blocker settings.",
          variant: "destructive",
        })
        return
      }

      captureWindow.document.write(invoiceHTML)
      captureWindow.document.close()

      captureWindow.onload = () => {
        setTimeout(async () => {
          try {
            // Ensure footer is visible by scrolling to bottom first
            captureWindow.scrollTo(0, captureWindow.document.body.scrollHeight)
            
            // Wait a moment for scroll to complete
            await new Promise(resolve => setTimeout(resolve, 200))
            
            // Capture the invoice as an image with full height to include footer
            const canvas = await html2canvas(captureWindow.document.body, {
              useCORS: true,
              allowTaint: true,
              background: '#ffffff',
              width: 800,
              height: captureWindow.document.body.scrollHeight // Use full height to include footer
            })
            
            // Convert to blob for sharing
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob!)
              }, 'image/png', 0.9)
            })

            // Prepare WhatsApp URL with image
            const phone = lastPurchaseData.supplierContact.replace(/^0/, '+92')
            const message = `Hi ${lastPurchaseData.supplierName}! Your purchase invoice #${lastPurchaseData.invoiceNumber} is ready. Please check the attached image.`
            
            // Debug logging
            console.log('Supplier contact:', lastPurchaseData.supplierContact)
            console.log('Normalized phone:', phone)
            console.log('WhatsApp URL will be:', `https://wa.me/${phone}?text=${encodeURIComponent(message)}`)
            
            // Try Web Share API first (mobile browsers)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'purchase_invoice.png', { type: 'image/png' })] })) {
              try {
                await navigator.share({
                  title: `Purchase Invoice #${lastPurchaseData.invoiceNumber}`,
                  text: message,
                  files: [new File([blob], 'purchase_invoice.png', { type: 'image/png' })]
                })
                
                toast({
                  title: "Invoice Shared!",
                  description: "Purchase invoice image shared successfully via WhatsApp.",
                })
                
                captureWindow.close()
                return
              } catch {
                console.log('Web Share API failed, falling back to WhatsApp web')
              }
            }

            // Fallback: Open WhatsApp Web with image
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
            
            // Create a temporary link to download the image
            const imageUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = imageUrl
            link.download = `Purchase_Invoice_${lastPurchaseData.invoiceNumber}_${lastPurchaseData.supplierName.replace(/\s+/g, '_')}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // Clean up the image URL
            URL.revokeObjectURL(imageUrl)
            
            // Open WhatsApp after a short delay to ensure download starts
            setTimeout(() => {
              window.open(whatsappUrl, '_blank')
            }, 500)
            
            toast({
              title: "Invoice Captured & WhatsApp Opened",
              description: "Purchase invoice image downloaded! Attach it to WhatsApp and send.",
            })
            
            captureWindow.close()
            
          } catch (error) {
            console.error('Error capturing invoice:', error)
            toast({
              title: "Error",
              description: "Failed to capture invoice. Please try again.",
              variant: "destructive",
            })
            captureWindow.close()
          }
        }, 2000) // Increased timeout to ensure footer renders properly
      }
    } catch (error) {
      console.error('Error generating WhatsApp invoice:', error)
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-background rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-black">★</span>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Loading Purchasing Module</h2>
              <p className="text-muted-foreground">Please wait while we prepare your purchasing system...</p>
            </div>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {defaultTab === "purchase" ? "New Purchase" : "Purchase History"}
        </h2>
      </div>

      {defaultTab === "purchase" ? (
          <div className="grid gap-6 lg:grid-cols-6 bg-background min-h-screen p-6 pb-12">
            {/* Product Search & Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-gray-200 dark:border-gray-700 shadow-lg card-hover bg-white dark:bg-gray-900">
                <CardHeader className="pb-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-gray-100">
                    <Search className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    Product Search
                  </CardTitle>
                  <CardDescription className="text-sm text-teal-700 dark:text-teal-300">Search by name or code</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>

                    <div className="grid gap-2 max-h-80 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg transition-all duration-300 hover:shadow-lg bg-card hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">Code: {product.code}</p>
                            <p className="text-xs text-muted-foreground">Size: {product.size}</p>
                            <p className="text-xs text-muted-foreground">
                              Current Stock: {product.stock} carton(s)
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-bold text-sm text-foreground">Rs{product.purchaseCost}</p>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 w-7 p-0 border-border hover:bg-white hover:text-black transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cartItem = cart.find(item => item.id === product.id);
                                  if (cartItem) {
                                    updateQuantity(product.id, cartItem.quantity - 1);
                                  }
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm w-6 text-center font-medium bg-muted px-1 rounded">
                                {cart.find(item => item.id === product.id)?.quantity || 0}
                              </span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 w-7 p-0 border-orange-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:border-orange-600 dark:hover:bg-orange-600 transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-fit border-gray-200 dark:border-gray-700 shadow-lg card-hover bg-white dark:bg-gray-900">
                <CardHeader className="pb-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-base text-gray-900 dark:text-gray-100">Supplier Selection</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">Select supplier for this purchase</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={supplierId} onValueChange={handleSupplierSelect}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {supplierId && (
                    <div className="space-y-2 text-sm">
                      <p><strong>Contact:</strong> {supplierContact}</p>
                      <p><strong>Address:</strong> {supplierAddress}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Purchase Cart & Checkout */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-lg font-semibold">Purchase Cart</span>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {cart.length} item{cart.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">Cart is empty</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">Add products to get started</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {cart.map((item, index) => {
                          const uniqueKey = `${item.id}-${index}`
                          
                          return (
                            <div key={uniqueKey} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
                                    <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800">
                                      {item.code}
                                    </Badge>
                                    {item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        <Gift className="h-3 w-3 mr-1" />
                                        {item.tradeDiscountFreeItems} Free
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Size: {item.size}</span>
                                    <span>Unit Price: Rs{item.unitPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => removeFromCart(item.id)} 
                                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="h-8 w-8 p-0 border-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:border-gray-600 dark:hover:bg-orange-600 transition-all duration-200"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.quantity || ""}
                                        placeholder="0"
                                        onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                                        onFocus={(e) => {
                                          if (e.target.value === "0") {
                                            e.target.value = ""
                                          }
                                        }}
                                        onBlur={(e) => {
                                          if (e.target.value === "") {
                                            e.target.value = "0"
                                          }
                                        }}
                                        className="h-8 w-20 text-center text-sm border-gray-300 focus:border-orange-500 dark:border-gray-600 dark:focus:border-orange-400"
                                      />
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="h-8 w-8 p-0 border-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:border-gray-600 dark:hover:bg-orange-600 transition-all duration-200"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addTradeDiscountUnit(item.id)}
                                      className="h-8 text-xs border-green-300 hover:bg-green-500 hover:text-white hover:border-green-500 dark:border-green-600 dark:hover:bg-green-600"
                                    >
                                      <Gift className="h-3 w-3 mr-1" />
                                      Add Free
                                    </Button>
                                    {item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => removeTradeDiscountUnit(item.id)}
                                          className="h-8 w-8 p-0 border-green-300 hover:bg-green-500 hover:text-white hover:border-green-500 dark:border-green-600 dark:hover:bg-green-600"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400 px-1">
                                          {item.tradeDiscountFreeItems}
                                        </span>
                                      </>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openPricingModal(item)}
                                      className="h-8 text-xs border-orange-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:border-orange-600 dark:hover:bg-orange-600"
                                    >
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Set Prices
                                    </Button>
                                  </div>

                                  {/* Free Products Manual Entry */}
                                  <div className="mt-2 space-y-1">
                                    <Label className="text-xs text-muted-foreground">Free Products (Manual Entry)</Label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.tradeDiscountFreeItems || ""}
                                        placeholder="0"
                                        onChange={(e) => {
                                          const freeQuantity = parseFloat(e.target.value) || 0
                                          const updatedCart = cart.map(cartItem => 
                                            cartItem.id === item.id 
                                              ? { ...cartItem, tradeDiscountFreeItems: freeQuantity }
                                              : cartItem
                                          )
                                          setCart(updatedCart)
                                        }}
                                        onFocus={(e) => {
                                          if (e.target.value === "0") {
                                            e.target.value = ""
                                          }
                                        }}
                                        onBlur={(e) => {
                                          if (e.target.value === "") {
                                            e.target.value = "0"
                                          }
                                        }}
                                        className="h-8 w-24 text-center text-sm border-gray-300 focus:border-green-500 dark:border-gray-600 dark:focus:border-green-400"
                                      />
                                      <span className="text-xs text-muted-foreground">free</span>
                                    </div>
                                  </div>

                                <div className="text-right">
                                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Rs{item.subtotal.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.quantity} × Rs{item.unitPrice.toFixed(2)}
                                    {item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 && (
                                      <span className="text-green-600 dark:text-green-400 ml-2">
                                        + {item.tradeDiscountFreeItems} free
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                                
                              {/* Total Price Input */}
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Total Price for All Units (Rs)</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.totalAmount || ""}
                                    onChange={(e) => {
                                      const totalPrice = parseFloat(e.target.value) || 0
                                      const unitPrice = parseFloat((totalPrice / item.quantity).toFixed(2))
                                      const individualPrices = Array(item.quantity).fill(unitPrice)
                                      
                                      setCart(cart.map(cartItem => 
                                        cartItem.id === item.id 
                                          ? { 
                                              ...cartItem, 
                                              totalAmount: totalPrice,
                                              unitPrice: unitPrice,
                                              subtotal: totalPrice,
                                              individualPrices: individualPrices
                                            }
                                          : cartItem
                                      ))
                                    }}
                                    onFocus={(e) => {
                                      if (e.target.value === "0") {
                                        e.target.value = ""
                                      }
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === "") {
                                        e.target.value = "0"
                                      }
                                    }}
                                    className="h-8 text-xs"
                                    placeholder="Enter total price"
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => openPricingModal(item)}
                                    className="text-xs px-2 h-7 border-purple-300 hover:bg-purple-500 hover:text-white hover:border-purple-500 dark:border-purple-600 dark:hover:bg-purple-600"
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Set Prices
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Price per unit: Rs{(item.totalAmount / item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Separator />

            {/* Cart-level discount inputs */}
            <Card className="border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label className="text-xs">Cart Discount:</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={0}
                          max={subtotal}
                          placeholder="Amount"
                          value={cartDiscount || ""}
                          onChange={(e) => {
                            let val = Number(e.target.value.replace(/^0+/, ''))
                            if (isNaN(val) || val < 0) val = 0
                            if (val > subtotal) val = subtotal
                            updateDiscountByAmount(val)
                          }}
                          className="h-8 text-xs"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="%"
                          value={cartDiscountPercentage || ""}
                          onChange={(e) => {
                            let val = Number(e.target.value.replace(/^0+/, ''))
                            if (isNaN(val) || val < 0) val = 0
                            if (val > 100) val = 100
                            updateDiscountByPercentage(val)
                          }}
                          className="h-8 text-xs"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Amount (Rs)</span>
                      <span>Percentage (%)</span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-background p-4 rounded-lg border border-border shadow-lg">
                    <div className="flex justify-between text-foreground">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-semibold">Rs{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span className="font-medium">Total Discount:</span>
                      <span className="font-semibold">-Rs{totalDiscount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-border pt-2 text-foreground">
                      <span>TOTAL:</span>
                      <span>Rs{total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complete Purchase Button */}
              <Card className="border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <Button
                    onClick={handleCompletePurchase}
                    disabled={cart.length === 0 || !supplierId || isProcessingPurchase}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:disabled:bg-gray-600 dark:disabled:hover:bg-gray-600 dark:disabled:text-gray-400"
                  >
                    {isProcessingPurchase ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Complete Purchase'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
      ) : (
        <>
          {/* Search and Filter Controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by invoice number or supplier..."
                    value={purchaseSearchTerm}
                    onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Select value={selectedSupplierFilter} onValueChange={setSelectedSupplierFilter}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Filter by supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Purchase Records
              </CardTitle>
              <CardDescription>Complete purchase history with supplier and payment details</CardDescription>
            </CardHeader>
            <CardContent>
              {purchaseHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading purchase history...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.length === 0 ? (
                        <TableRow key="no-purchases">
                          <TableCell colSpan={7} className="text-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">No purchases found</p>
                            <p className="text-sm text-muted-foreground">Start by making your first purchase</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPurchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{purchase.invoiceNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(purchase.createdAt).toLocaleDateString()} • {new Date(purchase.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{purchase.supplierName}</p>
                                <p className="text-sm text-muted-foreground">{purchase.supplierContact}</p>
                                {purchase.supplierAddress && (
                                  <p className="text-xs text-muted-foreground">{purchase.supplierAddress}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{purchase.items?.length ?? 0} items</p>
                                <p className="text-xs text-muted-foreground">
                                  {Array.isArray(purchase.items)
                                    ? purchase.items.reduce((sum, item) => sum + (typeof item.quantity === "number" ? item.quantity : 0), 0)
                                    : 0} units
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">Rs{purchase.totalAmount.toLocaleString()}</p>
                                {purchase.discount > 0 && (
                                  <p className="text-xs text-red-600">-Rs{purchase.discount.toLocaleString()} discount</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline">
                                  Cash
                                </Badge>
                                <p className="text-xs text-muted-foreground">Paid</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{new Date(purchase.createdAt).toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground">{new Date(purchase.createdAt).toLocaleTimeString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewPurchaseDetails(purchase)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

  {/* Supplier Invoice Modal */}
  <SupplierInvoiceModal 
    isOpen={showInvoiceModal}
    onClose={() => setShowInvoiceModal(false)}
    onPrint={handlePrint}
    onWhatsApp={handleWhatsAppInvoice}
    invoiceData={lastPurchaseData}
  />

  {/* Purchase Details Modal */}
  <Dialog open={showPurchaseDetails} onOpenChange={setShowPurchaseDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase Details
            </DialogTitle>
            <DialogDescription>
              Detailed view of purchase items and information
            </DialogDescription>
          </DialogHeader>
          
          {selectedPurchase && (
            <div className="space-y-6">
              {/* Purchase Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPurchase.invoiceNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedPurchase.createdAt).toLocaleDateString()} at {new Date(selectedPurchase.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">Rs{selectedPurchase.totalAmount.toLocaleString()}</p>
                  {selectedPurchase.discount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Discount: Rs{selectedPurchase.discount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Supplier Information */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Supplier Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{selectedPurchase.supplierName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedPurchase.supplierContact}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{selectedPurchase.supplierAddress}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Items */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Purchase Items ({selectedPurchase.items.length})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPurchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.fabricType && (
                                <p className="text-xs text-muted-foreground">Type: {item.fabricType}</p>
                              )}
                              {item.size && (
                                <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.code}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">Rs{item.subtotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Purchase Summary */}
              <div className="space-y-2">
                <h4 className="font-semibold">Purchase Summary</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs{selectedPurchase.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedPurchase.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>-Rs{selectedPurchase.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>Rs{selectedPurchase.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Individual Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Set Prices
            </DialogTitle>
            <DialogDescription>
              {pricingItem && `Set pricing for ${pricingItem.name} (${pricingItem.quantity} units)`}
            </DialogDescription>
          </DialogHeader>
          {pricingItem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Product: {pricingItem.name}</p>
                <p className="text-sm text-muted-foreground">Code: {pricingItem.code}</p>
                <p className="text-sm text-muted-foreground">Quantity: {pricingItem.quantity} units</p>
              </div>
              
              {/* Total Price Input Option */}
              <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-sm">Quick Total Price Entry</h4>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Total Price for All Units:</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingItem.totalAmount || ""}
                    onChange={(e) => {
                      const totalPrice = parseFloat(e.target.value) || 0
                      const unitPrice = parseFloat((totalPrice / pricingItem.quantity).toFixed(2))
                      const individualPrices = Array(pricingItem.quantity).fill(unitPrice)
                      setPricingItem({ 
                        ...pricingItem, 
                        totalAmount: totalPrice,
                        individualPrices: individualPrices
                      })
                    }}
                    onFocus={(e) => {
                      if (e.target.value === "0") {
                        e.target.value = ""
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.value = "0"
                      }
                    }}
                    className="flex-1"
                    placeholder="Enter total price"
                  />
                  <span className="text-sm text-muted-foreground">Rs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will set the same price for all units: Rs{((pricingItem.totalAmount) / pricingItem.quantity).toFixed(2)} per unit
                </p>
              </div>

              {/* Price Per Product Input Option */}
              <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-sm">Price Per Product</h4>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Price per Product:</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingItem.totalAmount ? (pricingItem.totalAmount / pricingItem.quantity) : ""}
                    onChange={(e) => {
                      const pricePerProduct = parseFloat(e.target.value) || 0
                      const totalPrice = parseFloat((pricePerProduct * pricingItem.quantity).toFixed(2))
                      const individualPrices = Array(pricingItem.quantity).fill(pricePerProduct)
                      setPricingItem({ 
                        ...pricingItem, 
                        totalAmount: totalPrice,
                        individualPrices: individualPrices
                      })
                    }}
                    onFocus={(e) => {
                      if (e.target.value === "0") {
                        e.target.value = ""
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.value = "0"
                      }
                    }}
                    className="flex-1"
                    placeholder="Enter price per product"
                  />
                  <span className="text-sm text-muted-foreground">Rs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total for {pricingItem.quantity} products: Rs{((pricingItem.totalAmount / pricingItem.quantity) * pricingItem.quantity).toFixed(2)}
                </p>
              </div>


              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span className="font-medium">
                    Rs{pricingItem.individualPrices.reduce((sum, price) => sum + price, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average Price per Unit:</span>
                  <span className="font-medium">
                    Rs{((pricingItem.individualPrices.reduce((sum, price) => sum + price, 0)) / pricingItem.quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPricingModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Validate that all prices are entered
                    const hasEmptyPrices = pricingItem.individualPrices.some(price => price <= 0)
                    if (hasEmptyPrices) {
                      toast({
                        title: "Validation Error",
                        description: "Please enter valid prices for all units",
                        variant: "destructive",
                      })
                      return
                    }
                    
                    updateIndividualPrices(pricingItem.id, pricingItem.individualPrices)
                    setShowPricingModal(false)
                    toast({
                      title: "Success",
                      description: "Individual prices updated successfully",
                    })
                  }}
                >
                  Update Prices
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Footer - Only show on purchase tab when cart has items */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">Rs{subtotal.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Discount:</span>
                  <span className="ml-2 font-semibold text-red-600 dark:text-red-400">-Rs{totalDiscount.toFixed(2)}</span>
                </div>
                <div className="text-lg">
                  <span className="text-gray-600 dark:text-gray-400">TOTAL:</span>
                  <span className="ml-2 font-bold text-gray-900 dark:text-gray-100">Rs{total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handleCompletePurchase}
                disabled={cart.length === 0 || !supplierId || isProcessingPurchase}
                className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:disabled:bg-gray-600 dark:disabled:hover:bg-gray-600 dark:disabled:text-gray-400 px-8 py-2"
              >
                {isProcessingPurchase ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Complete Purchase"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { PurchasingModule }
