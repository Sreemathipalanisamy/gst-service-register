import { Product } from '../types';

export const calculateProductTotals = (product: Partial<Product>): Partial<Product> => {
  const { unit_price = 0, quantity = 0, discount = 0 } = product;
  
  const price_after_discount = (unit_price * quantity) - discount;
  const cgst = price_after_discount * 0.09; // 9% CGST
  const sgst = price_after_discount * 0.09; // 9% SGST
  const igst = price_after_discount * 0.18; // 18% IGST (for inter-state)
  
  return {
    ...product,
    price_after_discount,
    cgst,
    sgst,
    igst
  };
};

export const calculateInvoiceTotals = (products: Product[], state: string, userState: string) => {
  let totalBuyingPrice = 0;
  let totalAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const isInterState = state !== userState;

  products.forEach(product => {
    totalBuyingPrice += product.buying_price * product.quantity;
    totalAmount += product.price_after_discount;
    
    if (isInterState) {
      totalIGST += product.igst;
    } else {
      totalCGST += product.cgst;
      totalSGST += product.sgst;
    }
  });

  const netAmount = totalAmount + totalCGST + totalSGST + totalIGST;

  return {
    buying_price: totalBuyingPrice,
    amount: totalAmount,
    cgst: totalCGST,
    sgst: totalSGST,
    igst: totalIGST,
    net_amount: netAmount
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};