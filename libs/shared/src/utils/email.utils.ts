import * as moment from 'moment';
import {
  SalesReport,
  TotalQuantityPerSKU,
} from 'shared/src/interfaces/report.interface';

export function generateSkuTable(
  totalQuantityPerSKU: TotalQuantityPerSKU,
): string {
  let table =
    '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">';
  table += `
    <thead>
      <tr>
        <th>SKU</th>
        <th>Total Quantity Sold</th>
      </tr>
    </thead>
    <tbody>
  `;

  for (const [sku, quantity] of Object.entries(totalQuantityPerSKU)) {
    table += `
      <tr>
        <td>${sku}</td>
        <td>${quantity}</td>
      </tr>
    `;
  }

  table += `
    </tbody>
  </table>`;

  return table;
}

export function formatDate(date: Date): string {
  return moment(date).format('DD MMMM YYYY');
}

export function generateEmailTemplate(report: SalesReport): string {
  const { date, totalQuantityPerSKU, totalSales } = report;
  const formattedDate = formatDate(date);
  const table: string = generateSkuTable(totalQuantityPerSKU);
  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      <h2>Daily Sales Summary for ${formattedDate}</h2>
      <p>Dear Team,</p>
      <p>Please find below the summary of total quantity sold per SKU for the date ${formattedDate}.</p>
      <p>Total sales amount: ${totalSales}</p>
      ${table}
      <p>Best regards,</p>
      <p>Your Company</p>
    </div>
  `;
}
