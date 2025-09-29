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
import { Search, Plus, Minus, Trash2, User, CreditCard, Smartphone, Banknote, ShoppingCart, AlertTriangle, Gift } from "lucide-react"
import { ProductService, SalesService, EmployeeService, BargainingService, type Product, type Employee, type SaleItem, type SaleRecord, CustomerService, type Customer } from "@/lib/firebase-services"
import { InvoiceCounterService } from "@/lib/invoice-counter-service"
import { useToast } from "@/hooks/use-toast"
import html2canvas from 'html2canvas'


import { PostSaleModal } from "./modules/pos/post-sale-modal"

// Defining the types for cart items
interface CartItem {
  id: string
  name: string
  code: string
  unitPrice: number
  quantity: number
  discount: number
  finalPrice: number
  availableStock: number
  tradeDiscountQuantity?: number
  tradeDiscountFreeItems?: number
  fabricType?: string
  size?: string
}

function POSModule() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [staffMember, setStaffMember] = useState("")
  const [manualStaffName, setManualStaffName] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const [isProcessingSale, setIsProcessingSale] = useState(false)
  const { toast } = useToast()
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  // Cart-level discount - amount and percentage
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartDiscountPercentage, setCartDiscountPercentage] = useState<number>(0);

  // New: Sale completed state for showing modal
  const [showPostSaleModal, setShowPostSaleModal] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);

  // Load products and employees from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, employeesData] = await Promise.all([
          ProductService.getAllProducts(),
          EmployeeService.getAllEmployees(),
        ])
        setProducts(productsData)
        setEmployees(employeesData)
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

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await CustomerService.getAllCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Error loading customers:", error)
      }
    };
    loadCustomers();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Add trade discount to existing cart item
  const addTradeDiscountUnit = (productId: string) => {
    const existingItem = cart.find(item => item.id === productId)
    if (!existingItem) {
      toast({
        title: "Error",
        description: "Please add the product to cart first before applying trade discount",
        variant: "destructive",
      })
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

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id)
    
    let updatedCart: CartItem[]
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity + 1 > product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} carton(s) available for ${product.name}`,
          variant: "destructive",
        })
        return
      }
      
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, finalPrice: (item.quantity + 1) * item.unitPrice }
          : item,
      )
    } else {
      // Check if product has stock
      if (product.stock <= 0) {
        toast({
          title: "Out of Stock",
          description: `${product.name} is out of stock`,
          variant: "destructive",
        })
        return
      }
      
      updatedCart = [
        ...cart,
        {
          id: product.id,
          name: product.name,
          code: product.code,
          unitPrice: product.currentPrice,
          quantity: 1,
          discount: 0, // No longer used, but kept for type compatibility
          finalPrice: product.currentPrice,
          availableStock: product.stock,
          fabricType: product.fabricType,
          size: product.size,
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

    const product = products.find((p) => p.id === id)
    if (!product) return

    // Check if new quantity exceeds available stock
    if (newQuantity > product.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} carton(s) available for ${product.name}`,
        variant: "destructive",
      })
      return
    }

    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: newQuantity, finalPrice: newQuantity * item.unitPrice }
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

  // Function to handle float quantity input
  const handleQuantityInput = (id: string, value: string) => {
    // If empty string, set quantity to 0 but don't remove from cart
    if (value === "") {
      const updatedCart = cart.map((item) =>
        item.id === id
          ? { ...item, quantity: 0, finalPrice: 0 }
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
          ? { ...item, quantity: 0, finalPrice: 0 }
          : item,
      )
      setCart(updatedCart)
      return
    }

    const product = products.find((p) => p.id === id)
    if (!product) return

    // Check if new quantity exceeds available stock
    if (newQuantity > product.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} carton(s) available for ${product.name}`,
        variant: "destructive",
      })
      return
    }

    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: newQuantity, finalPrice: newQuantity * item.unitPrice }
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

  // Remove per-item discount logic
  // const updateDiscount = (id: string, discount: number) => {
  //   setCart(
  //     cart.map((item) =>
  //       item.id === id ? { ...item, discount, finalPrice: item.quantity * (item.unitPrice - discount) } : item,
  //     ),
  //   )
  // }

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

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  // Cart-level discount - use amount-based discount as primary
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

  // Check if any cart item exceeds stock
  const hasStockIssues = cart.some((item) => {
    const product = products.find((p) => p.id === item.id)
    return product ? item.quantity > product.stock : false
  })

  // Save the last sale data for printing/whatsapp after sale
  const [lastSaleData, setLastSaleData] = useState<InvoiceData | null>(null);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      })
      return
    }

    if (!paymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please select payment method",
        variant: "destructive",
      })
      return
    }

    setIsProcessingSale(true)

    // Final stock validation before checkout
    const stockValidation = cart.map((item) => {
      const product = products.find((p) => p.id === item.id)
      return {
        item,
        product,
        hasStock: product ? item.quantity <= product.stock : false,
        availableStock: product?.stock || 0,
      }
    })

    const itemsWithoutStock = stockValidation.filter((validation) => !validation.hasStock)

    if (itemsWithoutStock.length > 0) {
      const errorMessage = itemsWithoutStock
        .map((validation) => `${validation.item.name}: Need ${validation.item.quantity} carton(s), Available ${validation.availableStock} carton(s)`)
        .join(", ")
      
      toast({
        title: "Insufficient Stock",
        description: `Cannot complete sale. ${errorMessage}`,
        variant: "destructive",
      })
      return
    }

    try {
      // Sync customer with customers collection
      if (customerName || customerPhone) {
        const allCustomers = await CustomerService.getAllCustomers();
        const existing = allCustomers.find(c =>
          (customerPhone && c.phone === customerPhone) ||
          (customerName && c.name.toLowerCase() === customerName.toLowerCase())
        );
        if (!existing) {
          await CustomerService.createCustomer({
            name: customerName || "Walk-in Customer",
            email: "",
            phone: customerPhone || "",
            address: customerAddress || "",
            customerType: "walk-in",
            totalPurchases: 0,
            totalSpent: 0,
            creditLimit: 0,
            currentCredit: 0,
            notes: "",
            status: "active"
          });
        } else {
          // Update if info changed
          if (existing.name !== customerName || existing.phone !== customerPhone || existing.address !== customerAddress) {
            await CustomerService.updateCustomer(existing.id, {
              name: customerName,
              phone: customerPhone,
              address: customerAddress,
            });
          }
        }
      }

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

      const saleItems: SaleItem[] = cart.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        quantity: item.quantity,
        originalPrice: item.unitPrice,
        finalPrice: item.unitPrice - (distributedDiscounts[item.id] ?? 0) / (item.quantity || 1),
        discount: distributedDiscounts[item.id] ?? 0,
      }))

      // --- FIX: Ensure deliveryAddress and deliveryDate are never undefined in saleData ---
      // If deliveryType is 'delivery', deliveryAddress must be a non-empty string (required).
      // If deliveryType is 'pickup', deliveryAddress and deliveryDate should be omitted from the object (not undefined).
      // If deliveryType is 'delivery' but deliveryAddress is empty, set to empty string (not undefined).

      let deliveryAddressValue: string | undefined = undefined
      let deliveryDateValue: string | undefined = undefined

      if (deliveryType === 'delivery') {
        deliveryAddressValue = deliveryAddress || ""
        deliveryDateValue = deliveryDate || ""
      }

      // Only include deliveryAddress and deliveryDate if deliveryType is 'delivery'
      const tradeDiscountItems = cart
        .filter(ci => ci.tradeDiscountFreeItems && ci.tradeDiscountFreeItems > 0)
        .map(ci => ({
          productId: ci.id,
          productName: ci.name,
          quantity: ci.tradeDiscountFreeItems || 0,
          price: 0,
        }))

      // Generate sequential invoice number
      const invoiceNumber = await InvoiceCounterService.getNextInvoiceNumber()

      const saleData: Omit<SaleRecord, "id"> = {
        invoiceNumber: invoiceNumber,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString(),
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "",
        customerAddress: customerAddress || "",
        customerType: (customerName ? "regular" : "walk-in") as "walk-in" | "regular" | "vip",
        items: saleItems,
        subtotal,
        discount: totalDiscount,
        tax: 0,
        total,
        paymentMethod: paymentMethod as "cash" | "card" | "mobile" | "credit",
        paymentStatus: (paymentMethod === "credit" ? "pending" : "paid") as "paid" | "partial" | "pending",
        deliveryStatus: deliveryType === 'delivery' ? 'pending' : 'pickup',
        deliveryType: deliveryType,
        staffMember: staffMember, // Use staffMember from dropdown
        notes: "",
        returnStatus: "none" as "none" | "partial" | "full",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (deliveryType === 'delivery') {
        saleData.deliveryAddress = deliveryAddressValue
        // Only include deliveryDate if it's a non-empty string
        if (deliveryDateValue && deliveryDateValue.trim() !== "") {
          saleData.deliveryDate = deliveryDateValue
        }
      }
      // --- END FIX ---

      // Attach trade discount items to sale
      if (tradeDiscountItems.length > 0) {
        (saleData as SaleRecord & { tradeDiscountItems: Array<{ productId: string; productName: string; quantity: number; price: number }> }).tradeDiscountItems = tradeDiscountItems
      }

      await SalesService.createSale(saleData)

      // Update product stock (including trade discount items)
      for (const item of cart) {
        const product = products.find((p) => p.id === item.id)
        if (product) {
          const totalQuantity = item.quantity + (item.tradeDiscountFreeItems || 0)
          await ProductService.updateProduct(item.id, {
            stock: product.stock - totalQuantity,
          })
        }
      }

      // Create bargain records for discounted items (if cart-level discount, only if >0)
      if (totalDiscount > 0) {
        for (const item of cart) {
          const itemDiscount = distributedDiscounts[item.id] ?? 0
          if (itemDiscount > 0) {
            await BargainingService.createBargainRecord({
              date: new Date().toISOString().split("T")[0],
              time: new Date().toLocaleTimeString(),
              productName: item.name,
              productCode: item.code,
              originalPrice: item.unitPrice,
              finalPrice: item.unitPrice - (itemDiscount / (item.quantity || 1)),
              discountAmount: itemDiscount,
              discountPercentage: item.unitPrice > 0 ? Math.round((itemDiscount / (item.unitPrice * item.quantity)) * 100) : 0,
              customerName: customerName || "Walk-in Customer",
              customerPhone: customerPhone || "",
              staffMember: staffMember, // Use staffMember from dropdown
              reason: "POS Sale Discount",
              invoiceNumber: saleData.invoiceNumber,
              category: products.find((p) => p.id === item.id)?.fabricType || "",
              profitMargin: item.unitPrice > 0 ? Math.round(((item.unitPrice - (itemDiscount / (item.quantity || 1)) - (products.find((p) => p.id === item.id)?.purchaseCost || 0)) / item.unitPrice) * 100) : 0,
              status: "approved",
            })
          }
        }
      }

      // Update local products state to reflect new stock levels
      setProducts(products.map(product => {
        const cartItem = cart.find(item => item.id === product.id)
        if (cartItem) {
          const totalQuantity = cartItem.quantity + (cartItem.tradeDiscountFreeItems || 0)
          return { ...product, stock: product.stock - totalQuantity }
        }
        return product
      }))

      // Update employee's monthly sales and performance score
      if (staffMember) {
        const selectedEmployee = employees.find((emp) => emp.id === staffMember);
        if (selectedEmployee) {
          const newMonthlySales = selectedEmployee.monthlySales + total;
          
          // Calculate new performance score based on sales performance
          // Performance score can be based on meeting targets, sales growth, etc.
          const targetAchievement = (newMonthlySales / selectedEmployee.monthlyTarget) * 100;
          const currentPerformance = selectedEmployee.performanceScore;
          
          // Update performance score: 70% weight to current performance, 30% to new achievement
          const newPerformanceScore = Math.min(100, Math.max(0, 
            (currentPerformance * 0.7) + (Math.min(targetAchievement, 100) * 0.3)
          ));
          
          await EmployeeService.updateEmployee(staffMember, {
            monthlySales: newMonthlySales,
            totalSales: selectedEmployee.totalSales + total,
            performanceScore: Math.round(newPerformanceScore),
          });
        }
      }

      toast({
        title: "Sale Completed",
        description: `Sale completed successfully! Total: Rs${total.toLocaleString()}`,
      })

      // Save last sale data for invoice/whatsapp
      setLastSaleData({
        invoiceNumber: saleData.invoiceNumber,
        date: saleData.date,
        time: saleData.time,
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        customerAddress: saleData.customerAddress,
        staffName: staffNameForInvoice, // Use staffNameForInvoice
        items: cart.map(item => ({
          name: item.name,
          code: item.code,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tradeDiscountFreeItems: item.tradeDiscountFreeItems || 0,
          fabricType: item.fabricType || 'N/A',
          size: item.size || 'N/A',
        })),
        subtotal,
        totalDiscount,
        total,
      });

      // Show modal for post-sale actions
      setShowPostSaleModal(true);

      // Reset form
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setCustomerAddress("")
      setPaymentMethod("")
      setDeliveryType('pickup');
      setDeliveryAddress('');
      setDeliveryDate('');
      setCartDiscount(0);
      setCartDiscountPercentage(0);
      
    } catch {
      toast({
        title: "Error",
        description: "Failed to complete sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingSale(false)
    }
  }

  // Print invoice handler
  interface InvoiceData {
    invoiceNumber: string;
    date: string;
    time: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    staffName: string;
    items: Array<{name: string, code: string, quantity: number, unitPrice: number, tradeDiscountFreeItems?: number, fabricType?: string, size?: string}>;
    subtotal: number;
    totalDiscount: number;
    total: number;
  }

  const handlePrint = async (saleDataOverride?: InvoiceData) => {
    // Use lastSaleData if provided, else use current cart
    const data = saleDataOverride || lastSaleData || {
      invoiceNumber: await InvoiceCounterService.getNextInvoiceNumber(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '-',
      customerAddress: customerAddress || '',
      staffName: staffNameForInvoice, // Use staffNameForInvoice
      items: cart.map(item => ({
        name: item.name,
        code: item.code,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tradeDiscountFreeItems: item.tradeDiscountFreeItems || 0,
        fabricType: item.fabricType || 'N/A',
        size: item.size || 'N/A',
      })),
      subtotal,
      totalDiscount,
      total,
    } as InvoiceData;

    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    // Use the shared invoice HTML generation function
    const invoiceHtml = generateInvoiceHTML(data)
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    
    // Wait for images to load before printing
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
        // Try to disable headers/footers programmatically
        try {
          printWindow.print()
        } catch {
          // Fallback to regular print
          printWindow.print()
        }
      }, 1000) // Increased timeout to ensure logo loads
    }
  }

  // WhatsApp invoice handler - Auto capture and share invoice as image
  const handleWhatsAppInvoice = async (saleDataOverride?: InvoiceData) => {
    const data = saleDataOverride || lastSaleData || {
      invoiceNumber: await InvoiceCounterService.getNextInvoiceNumber(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || '',
      staffName: staffNameForInvoice, // Use staffNameForInvoice
      items: cart.map(item => ({
        name: item.name,
        code: item.code,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tradeDiscountFreeItems: item.tradeDiscountFreeItems || 0,
        fabricType: item.fabricType || 'N/A',
        size: item.size || 'N/A',
      })),
      subtotal,
      totalDiscount,
      total,
    } as InvoiceData;

    if (!data.customerPhone) {
      toast({
        title: "Missing Phone Number",
        description: "Please enter the customer's phone number to send the invoice via WhatsApp.",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate the same HTML as the print invoice
      const invoiceHTML = generateInvoiceHTML(data)

      // Create a hidden window for capturing
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

      // Wait for content to load, then capture and share
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
            const phone = normalizePhone(data.customerPhone as string)
            const message = `Hi ${data.customerName}! Your invoice #${data.invoiceNumber} is ready. Please check the attached image.`
            
            // Debug logging
            console.log('Customer phone:', data.customerPhone)
            console.log('Normalized phone:', phone)
            console.log('WhatsApp URL will be:', `https://wa.me/${phone}?text=${encodeURIComponent(message)}`)
            
            // Try Web Share API first (mobile browsers)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'invoice.png', { type: 'image/png' })] })) {
              try {
                await navigator.share({
                  title: `Invoice #${data.invoiceNumber}`,
                  text: message,
                  files: [new File([blob], 'invoice.png', { type: 'image/png' })]
                })
                
                toast({
                  title: "Invoice Shared!",
                  description: "Invoice image shared successfully via WhatsApp.",
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
            link.download = `Invoice_${data.invoiceNumber}_${data.customerName.replace(/\s+/g, '_')}.png`
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
              description: "Invoice image downloaded! Attach it to WhatsApp and send.",
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
      console.error('Error opening WhatsApp invoice window:', error)
      toast({
        title: "Error",
        description: "Failed to open invoice window. Please try again.",
        variant: "destructive",
      })
    }
  }


  // Extract invoice HTML generation into a separate function
  const generateInvoiceHTML = (data: InvoiceData) => {
    // Get items with trade discount
    const itemsWithTradeDiscount = data.items.filter(i => i.tradeDiscountFreeItems && i.tradeDiscountFreeItems > 0)

    return `
      <html>
        <head>
          <title>Invoice</title>
          <style>
            @media print {
              @page {
                margin: 0;
                size: A4;
              }
              body {
                margin: 0 !important;
                padding: 24px !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
                         body { 
               font-family: Arial, sans-serif; 
               padding: 24px; 
               padding-top: 40px;
               max-width: 800px; 
               margin: 0 auto; 
             }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 2px solid #ddd; padding-bottom: 16px; }
            .company-info { flex: 1; }
                         .company-name { font-size: 28px; font-weight: bold; margin-bottom: 8px; color: #333; text-align: center; }
            .company-details { font-size: 15px; color: #666; line-height: 1.4; margin-bottom: 6px; padding: 4px 0; }
            .invoice-details { background: #f8f9fa; padding: 8px 0 8px 0; border-radius: 6px; margin-bottom: 10px; font-size: 15px; }
            .invoice-details p { margin: 2px 0; font-size: 15px; }
            .section-separator {
              width: 100%;
              border: none;
              border-top: 1.5px dashed #2196f3;
              margin: 4px 0 8px 0;
            }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 10px 6px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; font-weight: bold; color: #333; font-size: 13px; }
            tbody td { font-size: 15px; }
            .text-right { text-align: right; }
            .totals { margin-top: 16px; }
            .totals td, .totals .total-row { font-size: 12px; }
            .totals table { border: none; }
            .totals td { border: none; padding: 8px 0; font-size: 16px; }
            .totals .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
            .discount-row { color: #d32f2f; font-weight: bold; }
            .thank-you { text-align: center; margin-top: 16px; padding: 8px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #2196f3; font-size: 12px; }
            .thank-you h3 { margin-top: 0; margin-bottom: 4px; font-size: 18px; color: #1976d2; }
            .thank-you p { margin: 4px 0; color: #555; font-size: 11px; }
                         .product-images { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 20px; margin: 16px 0; }
             .product-images img { width: 100px; height: auto; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .product-images-top { width: 100%; margin: 16px 0; padding: 0; }
            .product-images-top img { width: 103%; height: 125px; object-fit: cover; border-radius: 8px; display: block; }
            .product-image-bottom { width: 100%; display: block; margin: 32px 0 0 0; border-radius: 8px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
            .brand-section { display: flex; align-items: flex-start; gap: 16px; }
            .logo-container { display: flex; flex-direction: column; align-items: flex-start; }
            .logo-and-text { display: flex; align-items: center; gap: 12px; }
            .brand-logo { width: 90px; height: 90px; border-radius: 12px; border: 2px solid #ddd; object-fit: contain; background: #fff; }
            .brand-name { font-size: 32px; font-weight: 900; color: #222; letter-spacing: 2px; }
            .company-name-right { font-size: 28px; font-weight: bold; color: #1976d2; text-align: right; }
            .product-images-grid { display: flex; justify-content: flex-start; align-items: center; gap: 6px; margin: 8px 0 0 0; padding: 0; }
            .product-images-grid img { width: 60px; height: 60px; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="header-top">
                <div class="brand-section">
                  <div class="logo-container">
                    <div class="logo-and-text">
                      <img 
                        src="${window.location.origin}/sufianah-logo.svg" 
                        alt="Company Logo" 
                        class="brand-logo"
                        onerror="this.style.display='none';"
                      />
                      <span class="brand-name">Sufianah Islamic Store</span>
                    </div>
                    <div class="product-images-grid">
                      <img src="${window.location.origin}/1.png" alt="Product 1" onerror="this.style.display='none';" />
                      <img src="${window.location.origin}/2.png" alt="Product 2" onerror="this.style.display='none';" />
                      <img src="${window.location.origin}/3.png" alt="Product 3" onerror="this.style.display='none';" />
                      <img src="${window.location.origin}/4.png" alt="Product 4" onerror="this.style.display='none';" />
                    </div>
                  </div>
                </div>
                <div class="company-name-right">Sufianah Islamic Store</div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <div class="company-details" style="flex: 1; padding-right: 20px;">
                  Islamic Books, Clothing, Accessories & Halal Products<br/>
                  Contact No. : +92-XXX-XXXXXXX<br/>
                  Email: info@sufianahislamic.com<br/>
                  Address: [Your Store Address]
                </div>
                <div class="invoice-details" style="flex: 1; padding-left: 20px;">
                  <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                  <p><strong>Date:</strong> ${data.date} | <strong>Time:</strong> ${data.time}</p>
                  <p><strong>Customer:</strong> ${data.customerName}</p>
                  <p><strong>Customer Address:</strong> ${data.customerAddress || 'N/A'}</p>
                  <p><strong>Phone:</strong> ${data.customerPhone}</p>
                  ${data.staffName ? `<p><strong>Staff Member:</strong> ${data.staffName}</p>` : ''}
                </div>
              </div>
            </div>
          </div>
          
          <table style="font-size: 12px;">
            <thead>
              <tr>
                <th style="font-size: 12px;">Product Name</th>
                <th style="font-size: 12px;">Packaging</th>
                <th class="text-right" style="font-size: 12px;">Qty (Cartons)</th>
                <th class="text-right" style="font-size: 12px;">Unit Price</th>
                <th class="text-right" style="font-size: 12px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item) => `
                <tr>
                  <td style="font-size: 12px;">${item.name}</td>
                  <td style="font-size: 12px;">${item.size || 'N/A'}</td>
                  <td class="text-right" style="font-size: 12px;">${item.quantity}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? ` + ${item.tradeDiscountFreeItems}(TD)` : ''}</td>
                  <td class="text-right" style="font-size: 12px;">${item.unitPrice === 0 ? 'FREE' : `Rs${item.unitPrice.toLocaleString()}`}</td>
                  <td class="text-right" style="font-size: 12px;">${item.unitPrice === 0 ? 'Rs0' : `Rs${(item.unitPrice * item.quantity).toLocaleString()}`}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 18px;">
            <div style="text-align: left;">
              <p style="font-size: 16px; font-weight: bold; margin: 0;">Signature: ____________________</p>
            </div>
            
            <div class="totals">
              <table style="width: 300px; margin: 0;">
              <tr><td><strong>Subtotal:</strong></td><td class="text-right">Rs${data.subtotal.toLocaleString()}</td></tr>
              <tr class="discount-row">
                <td><strong>Total Discount: (${data.totalDiscount > 0 && data.subtotal > 0 ? Math.round((data.totalDiscount / data.subtotal) * 100) : 0}%)</strong></td>
                <td class="text-right">-Rs${data.totalDiscount.toLocaleString()}</td>
              </tr>
              <tr class="total-row"><td><strong>TOTAL:</strong></td><td class="text-right">Rs${data.total.toLocaleString()}</td></tr>
              </table>
            </div>
          </div>

          ${itemsWithTradeDiscount.length > 0 ? `
          <div style="margin-top: 8px;">
            <hr class="section-separator" />
            <div style="font-weight: bold; margin-bottom: 4px; color: #d32f2f; font-size: 10px;">Trade Discount Items:</div>
            <ul style="margin: 0; padding-left: 16px;">
              ${itemsWithTradeDiscount.map(item => `<li style="color: #d32f2f; font-size: 10px;">${item.name} (${item.size || 'N/A'}): ${item.tradeDiscountFreeItems} free Carton(s)</li>`).join('')}
            </ul>
          </div>` : ''}
          
          <div style="margin-top: 40px; padding: 20px 0; text-align: center; background: #f0f8ff; border-radius: 6px; border: 1px solid #2196f3; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #1976d2; font-weight: 500;">Thank you for ordering with us – quality, quantity, and freshness.</p>
            <p style="margin: 2px 0; color: #555; font-size: 10px;">For any queries or support, please contact us at <strong>03001552339</strong></p>
            <p style="margin: 2px 0 0 0; color: #555; font-size: 10px;"><strong>Visit us again!</strong></p>
          </div>

        </body>
      </html>
    `
  }





  // Enhanced customer search logic
  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    
    if (value.length > 0) {
      const filteredCustomers = customers.filter(c => {
        // Search by name
        if (c.name.toLowerCase().includes(value.toLowerCase())) {
          return true;
        }
        
        // Search by address
        if (c.address && c.address.toLowerCase().includes(value.toLowerCase())) {
          return true;
        }
        
        // Search by phone with smart 0/92 handling
        if (c.phone.includes(value)) {
          return true;
        }
        
        // Handle phone number searches that start with 0 or 92
        if (value.match(/^[0-9]/)) {
          const customerPhone = c.phone;
          
          // If user types 92 prefix and customer has 0 prefix
          if (value.startsWith('92') && customerPhone.startsWith('0')) {
            const userNumber = value.substring(2); // Remove "92"
            const customerNumber = customerPhone.substring(1); // Remove "0"
            return customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
          }
          
          // If user types 0 prefix and customer has 92 prefix
          if (value.startsWith('0') && customerPhone.startsWith('92')) {
            const userNumber = value.substring(1); // Remove "0"
            const customerNumber = customerPhone.substring(2); // Remove "92"
            return customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
          }
          
          // If both have same prefix, do normal matching
          if ((value.startsWith('92') && customerPhone.startsWith('92')) || 
              (value.startsWith('0') && customerPhone.startsWith('0'))) {
            return customerPhone.includes(value) || value.includes(customerPhone);
          }
          
          // Additional fallback: try cross-matching even if prefixes don't match exactly
          if (value.startsWith('0') && customerPhone.startsWith('92')) {
            const userNumber = value.substring(1); // Remove "0"
            const customerNumber = customerPhone.substring(2); // Remove "92"
            return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
          }
          
          if (value.startsWith('92') && customerPhone.startsWith('0')) {
            const userNumber = value.substring(2); // Remove "92"
            const customerNumber = customerPhone.substring(1); // Remove "0"
            return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
          }
        }
        
        return false;
      });
      setCustomerSuggestions(filteredCustomers.slice(0, 10)); // Limit to 10 suggestions
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleShowAllCustomers = () => {
    setCustomerSuggestions(customers.slice(0, 20)); // Show first 20 customers
  };

  const handleCustomerSuggestionSelect = (customer: Customer) => {
    setCustomerName(customer.name || '');
    setCustomerPhone(customer.phone || '');
    setCustomerAddress(customer.address || '');
    setCustomerSuggestions([]);
  };

  // Phone normalization for WhatsApp/invoice
  const normalizePhone = (phone: string) => {
    const p = phone.trim();
    if (p.startsWith("0") && p.length === 11) {
      return "+92" + p.slice(1);
    }
    if (p.startsWith("+92")) {
      return p;
    }
    // fallback: return as is
    return p;
  };

  const staffNameForInvoice = manualStaffName.trim() || (employees.find((emp) => emp.id === staffMember)?.name || "");



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
              <h2 className="text-2xl font-bold text-foreground">Loading POS Module</h2>
              <p className="text-muted-foreground">Please wait while we prepare your point of sale system...</p>
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
    <div>
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
                    className={`flex items-center justify-between p-3 border border-border rounded-lg transition-all duration-300 hover:shadow-lg ${
                      product.stock <= 0 ? 'opacity-50 bg-muted' : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Code: {product.code}</p>
                      <p className="text-xs text-muted-foreground">Size: {product.size}</p>
                      <p className={`text-xs ${product.stock <= 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>
                        Stock: {product.stock} carton(s)
                        {product.stock <= 0 && (
                          <span className="ml-1 text-white font-medium">Out of Stock</span>
                        )}
                      </p>
                    </div>
                                          <div className="text-right space-y-1">
                        <p className="font-bold text-sm text-foreground">Rs{product.currentPrice}</p>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            disabled={product.stock <= 0}
                            className={`h-7 w-7 p-0 border-border hover:bg-white hover:text-black transition-all duration-200 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            disabled={product.stock <= 0}
                            className={`h-7 w-7 p-0 border-orange-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 dark:border-orange-600 dark:hover:bg-orange-600 dark:disabled:bg-gray-700 dark:disabled:hover:bg-gray-700 dark:disabled:text-gray-500 dark:disabled:border-gray-600 transition-all duration-200 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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

        {/* Customer Details */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-lg card-hover bg-white dark:bg-gray-900">
          <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Customer Details
            </CardTitle>
            <CardDescription className="text-teal-700 dark:text-teal-300">Optional customer information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <div className="relative">
                  <Input
                    id="customerName"
                    placeholder="Search or enter customer name"
                    value={customerName}
                    onChange={handleCustomerNameChange}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {customers.length > 0 && customerName.length === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShowAllCustomers}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
                    >
                      Browse All ({customers.length})
                    </Button>
                  )}
                </div>
                {customerSuggestions.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto bg-background border border-border rounded-md shadow-lg z-10">
                    <div className="p-2 text-xs text-muted-foreground border-b border-border">
                      Found {customerSuggestions.length} customer{customerSuggestions.length !== 1 ? 's' : ''}
                    </div>
                    {customerSuggestions.map((customer) => (
                      <div
                        key={customer.id}
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground p-3 border-b border-border last:border-b-0 transition-colors"
                        onClick={() => handleCustomerSuggestionSelect(customer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            {customer.address && (
                              <p className="text-xs text-muted-foreground truncate max-w-48">{customer.address}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {customer.customerType || 'Regular'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChange={(e) => {
                    const phone = normalizePhone(e.target.value);
                    setCustomerPhone(phone);
                    
                    // Search customers by phone when typing
                    if (phone.length > 3) {
                      const phoneCustomers = customers.filter(c => {
                        const customerPhone = c.phone;
                        
                        // If user types 92 prefix and customer has 0 prefix
                        if (phone.startsWith('92') && customerPhone.startsWith('0')) {
                          const userNumber = phone.substring(2); // Remove "92"
                          const customerNumber = customerPhone.substring(1); // Remove "0"
                          return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
                        }
                        
                        // If user types 0 prefix and customer has 92 prefix
                        if (phone.startsWith('0') && customerPhone.startsWith('92')) {
                          const userNumber = phone.substring(1); // Remove "0"
                          const customerNumber = customerPhone.substring(2); // Remove "92"
                          return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
                        }
                        
                        // If both have same prefix, do normal matching
                        if ((phone.startsWith('92') && customerPhone.startsWith('92')) || 
                            (phone.startsWith('0') && customerPhone.startsWith('0'))) {
                          return customerPhone.includes(phone) || phone.includes(customerPhone);
                        }
                        
                        // Fallback to normal matching
                        return customerPhone.includes(phone) || phone.includes(customerPhone);
                      });
                      if (phoneCustomers.length > 0 && phoneCustomers.length <= 5) {
                        setCustomerSuggestions(phoneCustomers);
                      }
                    } else if (phone.length === 0) {
                      setCustomerSuggestions([]);
                    }
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Input
                  id="customerAddress"
                  placeholder="Enter customer address"
                  value={customerAddress}
                  onChange={(e) => {
                    const address = e.target.value;
                    setCustomerAddress(address);
                    
                    // Search customers by address when typing
                    if (address.length > 2) {
                      const addressCustomers = customers.filter(c => 
                        c.address && c.address.toLowerCase().includes(address.toLowerCase())
                      );
                      if (addressCustomers.length > 0 && addressCustomers.length <= 5) {
                        setCustomerSuggestions(addressCustomers);
                      }
                    } else if (address.length === 0) {
                      setCustomerSuggestions([]);
                    }
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <Label>Delivery Type</Label>
                <Select value={deliveryType} onValueChange={(value) => setDeliveryType(value as "pickup" | "delivery")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {deliveryType === 'delivery' && (
                <>
                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address</Label>
                    <Input
                      id="deliveryAddress"
                      placeholder="Enter delivery address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryDate">Delivery Date (optional)</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-gray-100">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="mobile">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="credit">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Credit Sale
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || !paymentMethod || hasStockIssues || isProcessingSale}
                  size="lg"
                  className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-600 dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-gray-600 dark:disabled:hover:bg-gray-600 dark:disabled:text-gray-400"
                >
                  {isProcessingSale ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Complete Sale'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Cart & Checkout */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-lg font-semibold">Shopping Cart</span>
                {hasStockIssues && (
                  <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 animate-pulse" />
                )}
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
                  const product = products.find((p) => p.id === item.id)
                  const exceedsStock = product ? item.quantity > product.stock : false
                  const uniqueKey = `${item.id}-${index}`
                  
                  return (
                    <div key={uniqueKey} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 ${exceedsStock ? 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/20' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
                            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800">
                              {item.code}
                            </Badge>
                            {exceedsStock && (
                              <Badge variant="destructive" className="text-xs">
                                Stock Issue
                              </Badge>
                            )}
                            {item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <Gift className="h-3 w-3 mr-1" />
                                {item.tradeDiscountFreeItems} Free
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Size: {product?.size}</span>
                            <span>Unit Price: Rs{item.unitPrice.toFixed(2)}</span>
                            {exceedsStock && (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Available: {product?.stock || 0}
                              </span>
                            )}
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

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:border-red-600 dark:hover:bg-red-600"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={product?.stock || 0}
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
                          disabled={product ? item.quantity >= product.stock : false}
                          className="border-green-300 hover:bg-green-500 hover:text-white hover:border-green-500 disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 dark:border-green-600 dark:hover:bg-green-600 dark:disabled:bg-gray-700 dark:disabled:hover:bg-gray-700 dark:disabled:text-gray-500 dark:disabled:border-gray-600"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => addTradeDiscountUnit(item.id)}
                            className="bg-white text-black hover:bg-gray-100"
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
                                className="border-border hover:bg-white/10 hover:text-white"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-xs font-medium text-foreground px-1">
                                {item.tradeDiscountFreeItems}
                              </span>
                            </>
                          )}
                        </div>
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
                      <div className="text-xs text-muted-foreground text-center">
                        Carton(s)
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Price:</span>
                          <span>Rs{item.unitPrice}</span>
                        </div>
                        {/* Remove per-item discount input */}
                        {/* <div className="flex items-center gap-2">
                          <Label className="text-xs">Discount:</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.discount}
                            onChange={(e) => updateDiscount(item.id, Number(e.target.value))}
                            className="h-6 text-xs"
                          />
                        </div> */}
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total:</span>
                          <span>Rs{item.unitPrice * item.quantity}</span>
                        </div>
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
      </div>

        {/* Staff Member */}
        <Card className="h-fit border-gray-200 dark:border-gray-700 shadow-lg card-hover bg-white dark:bg-gray-900">
          <CardHeader className="pb-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-base text-gray-900 dark:text-gray-100">Staff Member</CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">Select or enter staff member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={staffMember} onValueChange={setStaffMember}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select staff (optional)" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Or type staff name"
              value={manualStaffName}
              onChange={e => setManualStaffName(e.target.value)}
              className="h-9"
            />
          </CardContent>
        </Card>
      </div>

      {/* Post-sale modal */}
      <PostSaleModal 
        isOpen={showPostSaleModal}
        onClose={() => setShowPostSaleModal(false)}
        onWhatsApp={() => handleWhatsAppInvoice(lastSaleData || undefined)}
        onPrint={() => handlePrint(lastSaleData || undefined)}
        saleData={lastSaleData}
      />

      {/* Floating Footer - Only show when cart has items */}
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
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessingSale}
                className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:disabled:bg-gray-600 dark:disabled:hover:bg-gray-600 dark:disabled:text-gray-400 px-8 py-2 mr-35"
              >
                {isProcessingSale ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Checkout"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { POSModule }; 