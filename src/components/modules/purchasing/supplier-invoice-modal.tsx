import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, MessageSquare } from "lucide-react"

interface SupplierInvoiceData {
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
    tradeDiscountFreeItems?: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  total: number;
}

interface SupplierInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  onWhatsApp: () => void;
  invoiceData: SupplierInvoiceData | null;
}

export function SupplierInvoiceModal({
  isOpen,
  onClose,
  onPrint,
  onWhatsApp,
  invoiceData,
}: SupplierInvoiceModalProps) {
  if (!invoiceData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Completed!</DialogTitle>
          <DialogDescription>
            Invoice #{invoiceData.invoiceNumber} has been generated
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Purchase Summary</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Supplier:</strong> {invoiceData.supplierName}</p>
              <p><strong>Date:</strong> {invoiceData.date} at {invoiceData.time}</p>
              <p><strong>Items:</strong> {invoiceData.items.length}</p>
              <p><strong>Total:</strong> Rs{invoiceData.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onPrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
            <Button onClick={onWhatsApp} variant="outline" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send WhatsApp Invoice
            </Button>
          </div>

          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


// Generate supplier invoice HTML (reusing POS invoice design)
export function generateSupplierInvoiceHTML(data: SupplierInvoiceData) {
  return `
    <html>
      <head>
        <title>Supplier Invoice</title>
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
                <p><strong>Purchase Invoice:</strong> ${data.invoiceNumber}</p>
                <p><strong>Date:</strong> ${data.date} | <strong>Time:</strong> ${data.time}</p>
                <p><strong>Supplier:</strong> ${data.supplierName}</p>
                <p><strong>Supplier Address:</strong> ${data.supplierAddress || 'N/A'}</p>
                <p><strong>Contact:</strong> ${data.supplierContact}</p>
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
                <td class="text-right" style="font-size: 12px;">Rs${item.unitPrice.toLocaleString()}</td>
                <td class="text-right" style="font-size: 12px;">Rs${item.subtotal.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${data.items.some(item => item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0) ? `
        <div style="margin-top: 8px;">
          <hr class="section-separator" />
          <div style="font-weight: bold; margin-bottom: 4px; color: #d32f2f; font-size: 10px;">Trade Discount Items:</div>
          <ul style="margin: 0; padding-left: 16px;">
            ${data.items.filter(item => item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0).map(item => `<li style="color: #d32f2f; font-size: 10px;">${item.name} (${item.size || 'N/A'}): ${item.tradeDiscountFreeItems} free Carton(s)</li>`).join('')}
          </ul>
        </div>` : ''}
        
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
        
        <div style="margin-top: 40px; padding: 20px 0; text-align: center; background: #f0f8ff; border-radius: 6px; border: 1px solid #2196f3; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #1976d2; font-weight: 500;">Thank you for your business – quality, quantity, and freshness.</p>
          <p style="margin: 2px 0; color: #555; font-size: 10px;">For any queries or support, please contact us at <strong>03001552339</strong></p>
          <p style="margin: 2px 0 0 0; color: #555; font-size: 10px;"><strong>Visit us again!</strong></p>
        </div>

      </body>
    </html>
  `
}

