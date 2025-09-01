import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Product } from '../types';
import { PRODUCT_CATEGORIES } from '../data/constants';
import { calculateProductTotals, formatCurrency } from '../utils/calculations';

interface ProductFormProps {
  onAddProduct: (product: Product) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onAddProduct, onCancel }) => {
  const [product, setProduct] = useState<Partial<Product>>({
    sku: '',
    product_name: '',
    category: '',
    buying_price: 0,
    unit_price: 0,
    quantity: 0,
    discount: 0,
    price_after_discount: 0,
    cgst: 0,
    igst: 0,
    sgst: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const calculated = calculateProductTotals(product);
    setProduct(prev => ({
      ...prev,
      ...calculated
    }));
  }, [product.unit_price, product.quantity, product.discount]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!product.sku) newErrors.sku = 'SKU is required';
    if (!product.product_name) newErrors.product_name = 'Product name is required';
    if (!product.category) newErrors.category = 'Category is required';
    if (!product.buying_price || product.buying_price <= 0) newErrors.buying_price = 'Valid buying price is required';
    if (!product.unit_price || product.unit_price <= 0) newErrors.unit_price = 'Valid unit price is required';
    if (!product.quantity || product.quantity <= 0) newErrors.quantity = 'Valid quantity is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onAddProduct(product as Product);
    
    // Reset form
    setProduct({
      sku: '',
      product_name: '',
      category: '',
      buying_price: 0,
      unit_price: 0,
      quantity: 0,
      discount: 0,
      price_after_discount: 0,
      cgst: 0,
      igst: 0,
      sgst: 0
    });
  };

  const handleInputChange = (field: keyof Product, value: string | number) => {
    setProduct(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Product</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="SKU"
            value={product.sku || ''}
            onChange={(e) => handleInputChange('sku', e.target.value)}
            placeholder="PROD-001"
            error={errors.sku}
          />

          <Input
            label="Product Name"
            value={product.product_name || ''}
            onChange={(e) => handleInputChange('product_name', e.target.value)}
            placeholder="Product name"
            error={errors.product_name}
          />

          <Select
            label="Category"
            value={product.category || ''}
            onChange={(value) => handleInputChange('category', value)}
            options={PRODUCT_CATEGORIES}
            placeholder="Select category"
            error={errors.category}
          />

          <Input
            label="Buying Price (₹)"
            type="number"
            value={product.buying_price || ''}
            onChange={(e) => handleInputChange('buying_price', parseFloat(e.target.value) || 0)}
            placeholder="100.00"
            error={errors.buying_price}
            min="0"
            step="0.01"
          />

          <Input
            label="Unit Price (₹)"
            type="number"
            value={product.unit_price || ''}
            onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
            placeholder="120.00"
            error={errors.unit_price}
            min="0"
            step="0.01"
          />

          <Input
            label="Quantity"
            type="number"
            value={product.quantity || ''}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
            placeholder="10"
            error={errors.quantity}
            min="1"
          />

          <Input
            label="Discount (₹)"
            type="number"
            value={product.discount || ''}
            onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
            placeholder="50.00"
            min="0"
            step="0.01"
          />
        </div>

        {/* Calculated Fields Display */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-gray-900">Calculated Values</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Price After Discount:</span>
              <p className="font-medium">{formatCurrency(product.price_after_discount || 0)}</p>
            </div>
            <div>
              <span className="text-gray-600">CGST (9%):</span>
              <p className="font-medium">{formatCurrency(product.cgst || 0)}</p>
            </div>
            <div>
              <span className="text-gray-600">SGST (9%):</span>
              <p className="font-medium">{formatCurrency(product.sgst || 0)}</p>
            </div>
            <div>
              <span className="text-gray-600">IGST (18%):</span>
              <p className="font-medium">{formatCurrency(product.igst || 0)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            Add Product
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};