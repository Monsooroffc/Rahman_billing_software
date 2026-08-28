import type { Bill, Settings } from '@/types'

export const generateReceiptHTML = (bill: Bill, settings: Settings, isThermal = true): string => {
  const width = isThermal ? '80mm' : '210mm'
  const height = isThermal ? '148mm' : '297mm'
  const padding = isThermal ? '10mm' : '18mm'
  const fontSize = isThermal ? '11px' : '14px'
  const titleSize = isThermal ? '18px' : '22px'
  const totalQuantity = bill.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  
  const itemsHtml = bill.items?.map(item => `
    <tr>
      <td style="text-align: left; padding: 4px 0;">${item.service_name_snapshot}</td>
      <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
      <td style="text-align: right; padding: 4px 0;">₹${item.rate.toFixed(2)}</td>
      <td style="text-align: right; padding: 4px 0;">₹${item.amount.toFixed(2)}</td>
    </tr>
  `).join('') || ''

  const customerInfo = settings.show_customer_on_receipt && bill.customer_name
    ? `<p>Customer: ${bill.customer_name}${bill.customer_mobile ? ` - ${bill.customer_mobile}` : ''}</p>`
    : ''

  const emailInfo = settings.show_email_on_receipt && settings.shop_email
    ? `<p>Email: ${settings.shop_email}</p>`
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: ${width} ${height}; margin: 0; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          font-size: ${fontSize}; 
          margin: 0; 
          padding: ${padding};
          width: ${width};
          box-sizing: border-box;
        }
        .header { text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #333; padding-bottom: 8px; }
        .shop-name { font-size: ${titleSize}; font-weight: bold; margin: 0; }
        .tagline { font-size: ${fontSize}; font-weight: bold; margin: 3px 0; }
        .contact { font-size: 10px; margin: 3px 0; }
        .info { margin: 8px 0; }
        .info p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th { border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 5px 0; text-align: left; }
        td { padding: 5px 0; vertical-align: top; }
        .totals { margin-top: 8px; border-top: 1px dashed #333; padding-top: 6px; }
        .total-row { display: flex; justify-content: space-between; margin: 4px 0; }
        .quantity-row { font-weight: bold; }
        .grand-total { font-size: ${isThermal ? '18px' : '20px'}; font-weight: bold; border-top: 1px solid #333; padding-top: 7px; margin-top: 7px; }
        .footer { text-align: center; margin-top: 16px; padding-top: 8px; border-top: 1px dashed #999; }
        .footer p { margin: 2px 0; }
        .payment { text-align: center; margin: 8px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <p class="shop-name">${settings.shop_name}</p>
        <p class="tagline">XEROX • PRINT • SCAN • LAMINATION • ONLINE SERVICES</p>
        ${settings.shop_address ? `<p class="contact">${settings.shop_address}</p>` : ''}
        ${settings.shop_phone ? `<p class="contact">☎ ${settings.shop_phone}</p>` : ''}
      </div>
      <div class="info">
        <p><strong>Bill No:</strong> ${bill.bill_number}</p>
        <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleDateString('en-IN')} &nbsp; <strong>Time:</strong> ${new Date(bill.created_at).toLocaleTimeString('en-IN')}</p>
        ${customerInfo}
        ${emailInfo}
      </div>
      <table>
        <thead>
          <tr>
            <th># &nbsp; ITEM</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amt</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="totals">
        <div class="total-row quantity-row"><span>Total Quantity</span><span>${totalQuantity}</span></div>
        <div class="total-row"><span>Subtotal</span><span>₹${bill.subtotal.toFixed(2)}</span></div>
        ${bill.discount > 0 ? `<div class="total-row"><span>Discount</span><span>₹${bill.discount.toFixed(2)}</span></div>` : ''}
        <div class="total-row grand-total"><span>TOTAL</span><span>₹${bill.total.toFixed(2)}</span></div>
      </div>
      <div class="payment">Payment: ${bill.payment_method.toUpperCase()}</div>
      <div class="footer">
        <p><strong>THANK YOU!</strong></p>
        <p>VISIT AGAIN</p>
      </div>
    </body>
    </html>
  `
}
