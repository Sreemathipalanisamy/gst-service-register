export interface GSTRegistration {
  id?: string;
  gstin: string;
  vendor_type: string;
  email: string;
  turnover: number;
  state: string;
  itc: string;
  created_at?: string;
}

export interface Product {
  id?: string;
  sku: string;
  product_name: string;
  category: string;
  buying_price: number;
  unit_price: number;
  quantity: number;
  discount: number;
  price_after_discount: number;
  cgst: number;
  igst: number;
  sgst: number;
}

export interface Invoice {
  id?: string;
  gstin: string;
  invoice_id: string;
  date: string;
  status: string;
  payment_status: string;
  products: Product[];
  buying_price: number;
  amount: number;
  amount_paid: number;
  cgst: number;
  sgst: number;
  igst: number;
  net_amount: number;
  itc: string;
  state: string;
  created_at?: string;
}

export interface LoginCredentials {
  gstin: string;
  email: string;
}