import type { Bill, Settings } from '@/types'

export const generateReceiptHTML = (
  bill: Bill,
  settings: Settings,
  isThermal = true
): string => {
  const totalQuantity =
    bill.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const itemsHtml =
    bill.items
      ?.map(
        (item) => `
        <tr>
          <td style="text-align:left; padding:4px 0;">
            ${item.service_name_snapshot}
          </td>
          <td style="text-align:center; padding:4px 0;">
            ${item.quantity}
          </td>
          <td style="text-align:right; padding:4px 0;">
            ₹${item.rate.toFixed(2)}
          </td>
          <td style="text-align:right; padding:4px 0;">
            ₹${item.amount.toFixed(2)}
          </td>
        </tr>
      `
      )
      .join('') || ''

  const customerInfo =
    settings.show_customer_on_receipt && bill.customer_name
      ? `<p>Customer: ${bill.customer_name}${
          bill.customer_mobile ? ` - ${bill.customer_mobile}` : ''
        }</p>`
      : ''

  const emailInfo =
    settings.show_email_on_receipt && settings.shop_email
      ? `<p>Email: ${settings.shop_email}</p>`
      : ''

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

/* ================================
   THERMAL RECEIPT
   ================================ */

${
  isThermal
    ? `
@page {
  size: 80mm 148mm;
  margin: 0;
}

body {
  width: 80mm;
  min-height: 148mm;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 11px;
}

.receipt {
  width: 80mm;
  min-height: 148mm;
  padding: 7mm;
}
`
    : `
/* ================================
   A4 PRINT
   ONE SMALL BILL AT TOP-LEFT
   ================================ */

@page {
  size: A4;
  margin: 0;
}

body {
  width: 210mm;
  min-height: 297mm;
  background: white;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 11px;
}

/*
  Small receipt area.
  Approx. 80mm x 148mm.
*/
.receipt {
  width: 80mm;
  min-height: 148mm;

  margin-top: 3mm;
  margin-left: 3mm;

  padding: 6mm;

  /*
    Cutting frame
  */
  border: 1px dashed #777;

  position: relative;
}
`
}

/* ================================
   RECEIPT DESIGN
   ================================ */

.header {
  text-align: center;
  margin-bottom: 8px;
  border-bottom: 1px dashed #333;
  padding-bottom: 7px;
}

.shop-name {
  font-size: 15px;
  font-weight: bold;
  margin: 0;
  line-height: 1.2;
}

.tagline {
  font-size: 8px;
  font-weight: bold;
  margin: 4px 0 0;
  line-height: 1.3;
}

.contact {
  font-size: 8px;
  margin: 3px 0;
}

.info {
  margin: 7px 0;
  font-size: 9px;
}

.info p {
  margin: 3px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 7px 0;
  table-layout: fixed;
}

th {
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
  padding: 5px 0;
  font-size: 9px;
}

td {
  padding: 5px 0;
  vertical-align: top;
  font-size: 9px;
}

/* Column widths */

th:nth-child(1),
td:nth-child(1) {
  width: 43%;
}

th:nth-child(2),
td:nth-child(2) {
  width: 14%;
}

th:nth-child(3),
td:nth-child(3) {
  width: 21%;
}

th:nth-child(4),
td:nth-child(4) {
  width: 22%;
}

.totals {
  margin-top: 7px;
  border-top: 1px dashed #333;
  padding-top: 6px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 9px;
}

.quantity-row {
  font-weight: bold;
}

.grand-total {
  font-size: 16px;
  font-weight: bold;

  border-top: 1px solid #333;

  padding-top: 7px;
  margin-top: 7px;
}

.payment {
  text-align: center;
  margin: 9px 0;
  font-size: 9px;
  font-weight: bold;
}

.footer {
  text-align: center;
  margin-top: 12px;
  padding-top: 7px;
  border-top: 1px dashed #777;
}

.footer p {
  margin: 3px 0;
  font-size: 9px;
}

.footer p:first-child {
  font-weight: bold;
}

/* ================================
   CUTTING CORNER MARKS
   ================================ */

${
  !isThermal
    ? `
.receipt::before,
.receipt::after {
  content: '';
  position: absolute;
  width: 8mm;
  height: 8mm;
  pointer-events: none;
}

/* Top-left and bottom-right style corner marks */
.receipt::before {
  top: 2mm;
  left: 2mm;

  border-top: 1px solid #333;
  border-left: 1px solid #333;
}

.receipt::after {
  bottom: 2mm;
  right: 2mm;

  border-bottom: 1px solid #333;
  border-right: 1px solid #333;
}

/* Prevent browser from creating unwanted extra pages */
@media print {
  html,
  body {
    width: 210mm;
    height: 297mm;
    margin: 0 !important;
    padding: 0 !important;
  }

  .receipt {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
`
    : ''
}

</style>
</head>

<body>

<div class="receipt">

  <div class="header">

    <p class="shop-name">
      ${settings.shop_name}
    </p>

    <p class="tagline">
      XEROX • PRINT • SCAN • LAMINATION • ONLINE SERVICES
    </p>

    ${
      settings.shop_address
        ? `<p class="contact">${settings.shop_address}</p>`
        : ''
    }

    ${
      settings.shop_phone
        ? `<p class="contact">☎ ${settings.shop_phone}</p>`
        : ''
    }

  </div>


  <div class="info">

    <p>
      <strong>Bill No:</strong>
      ${bill.bill_number}
    </p>

    <p>
      <strong>Date:</strong>
      ${new Date(bill.created_at).toLocaleDateString('en-IN')}
      &nbsp;
      <strong>Time:</strong>
      ${new Date(bill.created_at).toLocaleTimeString('en-IN')}
    </p>

    ${customerInfo}

    ${emailInfo}

  </div>


  <table>

    <thead>

      <tr>

        <th style="text-align:left;">
          # &nbsp; ITEM
        </th>

        <th style="text-align:center;">
          Qty
        </th>

        <th style="text-align:right;">
          Rate
        </th>

        <th style="text-align:right;">
          Amt
        </th>

      </tr>

    </thead>

    <tbody>
      ${itemsHtml}
    </tbody>

  </table>


  <div class="totals">

    <div class="total-row quantity-row">
      <span>Total Quantity</span>
      <span>${totalQuantity}</span>
    </div>

    <div class="total-row">
      <span>Subtotal</span>
      <span>₹${bill.subtotal.toFixed(2)}</span>
    </div>

    ${
      bill.discount > 0
        ? `
        <div class="total-row">
          <span>Discount</span>
          <span>₹${bill.discount.toFixed(2)}</span>
        </div>
        `
        : ''
    }

    <div class="total-row grand-total">
      <span>TOTAL</span>
      <span>₹${bill.total.toFixed(2)}</span>
    </div>

  </div>


  <div class="payment">
    Payment: ${bill.payment_method.toUpperCase()}
  </div>


  <div class="footer">

    <p>
      THANK YOU!
    </p>

    <p>
      VISIT AGAIN
    </p>

  </div>

</div>

</body>
</html>
`
}