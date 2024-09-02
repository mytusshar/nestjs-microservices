export interface TotalQuantityPerSKU {
  [sku: string]: number;
}

export interface SalesReport {
  date: Date;
  totalSales: number;
  totalQuantityPerSKU: TotalQuantityPerSKU;
}
