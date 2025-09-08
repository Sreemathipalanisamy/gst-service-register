import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { ProductForm } from './ProductForm';
import { INDIAN_STATES, INVOICE_STATUS, PAYMENT_STATUS } from '../data/constants';
import { Invoice, Product, GSTRegistration } from '../types';
import { calculateInvoiceTotals, formatCurrency } from '../utils/calculations';
import { Plus, Trash2, LogOut } from 'lucide-react';

export const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [existingInvoices, setExistingInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [registration, setRegistration] = useState<GSTRegistration | null>(null);
  
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoice_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    payment_status: 'Pending',
    products: [],
    buying_price: 0,
    amount: 0,
    amount_paid: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    net_amount: 0,
    itc: '',
    state: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load registration data
    const currentGSTIN = localStorage.getItem('currentGSTIN');
    
    if (!currentGSTIN) {
      navigate('/');
      return;
    }

    // Load registration data for current GSTIN
    const registrations = JSON.parse(localStorage.getItem('gstRegistrations') || '{}');
    const regData = registrations[currentGSTIN];
    
    if (!regData) {
      navigate('/');
      return;
    }
    
    setRegistration(regData);
    
    // Load existing invoices for this GSTIN
    const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const gstinInvoices = allInvoices.filter((inv: any) => inv.gstin === currentGSTIN);
    setExistingInvoices(gstinInvoices);
    
    setInvoice(prev => ({
      ...prev,
      gstin: currentGSTIN,
      itc: regData.itc,
      state: regData.state
    }));
  }, [navigate]);

  const handleSelectInvoice = (invoiceId: string) => {
    const selectedInv = existingInvoices.find(inv => inv.invoice_id === invoiceId);
    if (selectedInv) {
      setInvoice(selectedInv);
      setSelectedInvoiceId(invoiceId);
      setShowInvoiceForm(false);
    }
  };

  const handleCreateNewInvoice = () => {
    setInvoice({
      invoice_id: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      payment_status: 'Pending',
      products: [],
      buying_price: 0,
      amount: 0,
      amount_paid: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      net_amount: 0,
      gstin: registration?.gstin || '',
      itc: registration?.itc || '',
      state: registration?.state || ''
    });
    setSelectedInvoiceId('');
    setShowInvoiceForm(false);
  };

  const handleAddNewInvoice = () => {
    setShowInvoiceForm(true);
  };

  const canAddProducts = () => {
    return invoice.invoice_id && invoice.invoice_id.trim() !== '';
  };

  const isNewInvoice = !selectedInvoiceId;

  useEffect(() => {
    if (invoice.products && invoice.products.length > 0 && registration) {
      const totals = calculateInvoiceTotals(
        invoice.products,
        invoice.state || '',
        registration.state
      );
      
      setInvoice(prev => ({
        ...prev,
        ...totals
      }));
    }
  }, [invoice.products, invoice.state, registration]);

  const handleAddProduct = (product: Product) => {
    if (!canAddProducts()) {
      alert('Please create an invoice first before adding products.');
      return;
    }
    
    setInvoice(prev => ({
      ...prev,
      products: [...(prev.products || []), product]
    }));
    setShowProductForm(false);
  };

  const handleRemoveProduct = (index: number) => {
    setInvoice(prev => ({
      ...prev,
      products: prev.products?.filter((_, i) => i !== index) || []
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!invoice.invoice_id) newErrors.invoice_id = 'Invoice ID is required';
    if (!invoice.date) newErrors.date = 'Date is required';
    if (!invoice.status) newErrors.status = 'Status is required';
    if (!invoice.payment_status) newErrors.payment_status = 'Payment status is required';
    if (!invoice.state) newErrors.state = 'State is required';
    if (!invoice.products || invoice.products.length === 0) {
      newErrors.products = 'At least one product is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Store invoice data (demo purposes)
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      
      if (isNewInvoice) {
        // Create new invoice
        invoices.push({
          ...invoice,
          id: Date.now().toString(),
          created_at: new Date().toISOString()
        });
        alert('Invoice created successfully!');
      } else {
        // Update existing invoice
        const invoiceIndex = invoices.findIndex((inv: any) => inv.invoice_id === invoice.invoice_id);
        if (invoiceIndex !== -1) {
          invoices[invoiceIndex] = {
            ...invoices[invoiceIndex],
            ...invoice,
            updated_at: new Date().toISOString()
          };
        }
        alert('Invoice updated successfully!');
      }
      
      localStorage.setItem('invoices', JSON.stringify(invoices));
      
      // Refresh existing invoices list
      const currentGSTIN = localStorage.getItem('currentGSTIN');
      const updatedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const gstinInvoices = updatedInvoices.filter((inv: any) => inv.gstin === currentGSTIN);
      setExistingInvoices(gstinInvoices);
      
      if (isNewInvoice) {
        // Reset form for new invoice
        setInvoice(prev => ({
          invoice_id: '',
          date: new Date().toISOString().split('T')[0],
          status: 'Draft',
          payment_status: 'Pending',
          products: [],
          buying_price: 0,
          amount: 0,
          amount_paid: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          net_amount: 0,
          gstin: prev.gstin,
          itc: prev.itc,
          state: prev.state
        }));
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentGSTIN');
    navigate('/');
  };

  const handleInputChange = (field: keyof Invoice, value: string | number) => {
    setInvoice(prev => ({
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

  if (!registration) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
              <p className="text-gray-600">GSTIN: {registration.gstin} | {registration.vendor_type}</p>
              {selectedInvoiceId && (
                <p className="text-sm text-blue-600">Currently editing: {selectedInvoiceId}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleAddNewInvoice}>
                Add Invoice
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Existing Invoices Selection */}
        {existingInvoices.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Invoices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingInvoices.map((inv, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedInvoiceId === inv.invoice_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectInvoice(inv.invoice_id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{inv.invoice_id}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inv.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      inv.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      inv.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {new Date(inv.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium">
                    ₹{inv.net_amount?.toLocaleString('en-IN')} | {inv.products?.length || 0} products
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button onClick={handleCreateNewInvoice} variant="secondary">
                Create New Invoice
              </Button>
            </div>
          </div>
        )}

        {showInvoiceForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Invoice</h2>
              <Button variant="secondary" onClick={() => setShowInvoiceForm(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Fill in the invoice details below to create a new invoice. You can add products after creating the invoice.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Details */}
          {(showInvoiceForm || selectedInvoiceId || existingInvoices.length === 0) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Invoice ID"
                value={invoice.invoice_id || ''}
                onChange={(e) => handleInputChange('invoice_id', e.target.value)}
                placeholder="INV-001"
                error={errors.invoice_id}
              />

              <Input
                label="Date"
                type="date"
                value={invoice.date || ''}
                onChange={(e) => handleInputChange('date', e.target.value)}
                error={errors.date}
              />

              <Select
                label="Status"
                value={invoice.status || ''}
                onChange={(value) => handleInputChange('status', value)}
                options={INVOICE_STATUS}
                error={errors.status}
              />

              <Select
                label="Payment Status"
                value={invoice.payment_status || ''}
                onChange={(value) => handleInputChange('payment_status', value)}
                options={PAYMENT_STATUS}
                error={errors.payment_status}
              />

              <Select
                label="State"
                value={invoice.state || ''}
                onChange={(value) => handleInputChange('state', value)}
                options={INDIAN_STATES}
                error={errors.state}
              />

              <Input
                label="Amount Paid (₹)"
                type="number"
                value={invoice.amount_paid || ''}
                onChange={(e) => handleInputChange('amount_paid', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Auto-filled fields */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Auto-filled Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">ITC Status:</span>
                  <span className="ml-2 font-medium">{invoice.itc}</span>
                </div>
                <div>
                  <span className="text-blue-700">Registered State:</span>
                  <span className="ml-2 font-medium">{registration.state}</span>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Products Section */}
          {(selectedInvoiceId || (invoice.invoice_id && invoice.invoice_id.trim() !== '')) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Products</h2>
              <Button
                type="button"
                onClick={() => setShowProductForm(true)}
                disabled={showProductForm || !canAddProducts()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {!canAddProducts() && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-700">
                  Please create an invoice first before adding products.
                </p>
              </div>
            )}

            {errors.products && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.products}</p>
              </div>
            )}

            {showProductForm && (
              <div className="mb-6">
                <ProductForm
                  onAddProduct={handleAddProduct}
                  onCancel={() => setShowProductForm(false)}
                />
              </div>
            )}

            {/* Products List */}
            {invoice.products && invoice.products.length > 0 && (
              <div className="space-y-4">
                {invoice.products.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.product_name}</h4>
                        <p className="text-sm text-gray-600">SKU: {product.sku} | Category: {product.category}</p>
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <p className="font-medium">{product.quantity}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit Price:</span>
                        <p className="font-medium">{formatCurrency(product.unit_price)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Discount:</span>
                        <p className="font-medium">{formatCurrency(product.discount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Final Price:</span>
                        <p className="font-medium">{formatCurrency(product.price_after_discount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {/* Invoice Summary */}
          {invoice.products && invoice.products.length > 0 && canAddProducts() && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Total Buying Price</span>
                  <p className="text-lg font-semibold">{formatCurrency(invoice.buying_price || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Subtotal</span>
                  <p className="text-lg font-semibold">{formatCurrency(invoice.amount || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">
                    {registration.state === invoice.state ? 'CGST + SGST' : 'IGST'}
                  </span>
                  <p className="text-lg font-semibold">
                    {formatCurrency((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0))}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <span className="text-blue-700 text-sm font-medium">Net Amount</span>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(invoice.net_amount || 0)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">CGST (9%):</span>
                  <span className="ml-2 font-medium">{formatCurrency(invoice.cgst || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">SGST (9%):</span>
                  <span className="ml-2 font-medium">{formatCurrency(invoice.sgst || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">IGST (18%):</span>
                  <span className="ml-2 font-medium">{formatCurrency(invoice.igst || 0)}</span>
                </div>
              </div>
            </div>
          )}

          {(showInvoiceForm || selectedInvoiceId || existingInvoices.length === 0) && (
            <div className="flex gap-4">
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
              size="lg"
            >
              {loading ? 
                (isNewInvoice ? 'Creating Invoice...' : 'Updating Invoice...') : 
                (isNewInvoice ? 'Create Invoice' : 'Update Invoice')
              }
            </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};