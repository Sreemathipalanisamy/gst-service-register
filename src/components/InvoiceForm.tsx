import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { ProductForm } from './ProductForm';
import { INDIAN_STATES, INVOICE_STATUS, PAYMENT_STATUS } from '../data/constants';
import { Invoice, Product, GSTRegistration } from '../types';
import { calculateInvoiceTotals, formatCurrency } from '../utils/calculations';
import { Plus, Trash2, LogOut, Eye, Save } from 'lucide-react';

export const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showExistingInvoices, setShowExistingInvoices] = useState(false);
  const [existingInvoices, setExistingInvoices] = useState<any[]>([]);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>('');
  const [isInvoiceCreated, setIsInvoiceCreated] = useState(false);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
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

  const handleSelectExistingInvoice = (selectedInvoice: any) => {
    setInvoice(selectedInvoice);
    setCurrentInvoiceId(selectedInvoice.invoice_id);
    setIsInvoiceCreated(true);
    setIsInvoiceSaved(true); // Existing invoices are considered saved
    setShowExistingInvoices(false);
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
    setCurrentInvoiceId('');
    setIsInvoiceCreated(false);
    setIsInvoiceSaved(false);
    setShowExistingInvoices(false);
  };

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
    if (!isInvoiceCreated || isInvoiceSaved) {
      alert(isInvoiceSaved ? 'Cannot add products to a saved invoice.' : 'Please create the invoice first before adding products.');
      return;
    }
    
    setInvoice(prev => ({
      ...prev,
      products: [...(prev.products || []), product]
    }));
    setShowProductForm(false);
  };

  const handleRemoveProduct = (index: number) => {
    if (isInvoiceSaved) {
      alert('Cannot remove products from a saved invoice.');
      return;
    }
    
    setInvoice(prev => ({
      ...prev,
      products: prev.products?.filter((_, i) => i !== index) || []
    }));
  };

  const validateInvoiceForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!invoice.invoice_id) newErrors.invoice_id = 'Invoice ID is required';
    if (!invoice.date) newErrors.date = 'Date is required';
    if (!invoice.status) newErrors.status = 'Status is required';
    if (!invoice.payment_status) newErrors.payment_status = 'Payment status is required';
    if (!invoice.state) newErrors.state = 'State is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInvoiceForm()) {
      return;
    }

    // Check if invoice ID already exists
    const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const existingInvoice = allInvoices.find((inv: any) => 
      inv.invoice_id === invoice.invoice_id && inv.gstin === invoice.gstin
    );

    if (existingInvoice && !currentInvoiceId) {
      setErrors({ invoice_id: 'Invoice ID already exists for this GSTIN' });
      return;
    }

    setLoading(true);
    
    try {
      setCurrentInvoiceId(invoice.invoice_id || '');
      setIsInvoiceCreated(true);
      setIsInvoiceSaved(false); // New invoice is created but not saved yet
      alert('Invoice created successfully! You can now add products.');
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (isInvoiceSaved) {
      alert('Invoice is already saved and cannot be modified.');
      return;
    }
    
    setLoading(true);
    
    try {
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      
      const existingIndex = invoices.findIndex((inv: any) => 
        inv.invoice_id === invoice.invoice_id && inv.gstin === invoice.gstin
      );

      if (existingIndex !== -1) {
        // Update existing invoice
        invoices[existingIndex] = {
          ...invoices[existingIndex],
          ...invoice,
          updated_at: new Date().toISOString()
        };
        alert('Invoice updated successfully!');
      } else {
        // Create new invoice
        invoices.push({
          ...invoice,
          id: Date.now().toString(),
          created_at: new Date().toISOString()
        });
        alert('Invoice saved successfully!');
      }
      
      setIsInvoiceSaved(true); // Mark invoice as saved
      localStorage.setItem('invoices', JSON.stringify(invoices));
      
      // Refresh existing invoices list
      const currentGSTIN = localStorage.getItem('currentGSTIN');
      const updatedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const gstinInvoices = updatedInvoices.filter((inv: any) => inv.gstin === currentGSTIN);
      setExistingInvoices(gstinInvoices);
      
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentGSTIN');
    navigate('/');
  };

  const handleInputChange = (field: keyof Invoice, value: string | number) => {
    if (isInvoiceSaved) {
      alert('Cannot modify a saved invoice.');
      return;
    }
    
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
              {currentInvoiceId && (
                <p className="text-sm text-blue-600">Current Invoice: {currentInvoiceId}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowExistingInvoices(true)}>
                <Eye className="w-4 h-4 mr-2" />
                View Existing Invoices
              </Button>
              <Button variant="secondary" onClick={handleCreateNewInvoice}>
                Add Invoice
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Existing Invoices Modal */}
        {showExistingInvoices && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Existing Invoices</h2>
                <Button variant="secondary" onClick={() => setShowExistingInvoices(false)}>
                  Close
                </Button>
              </div>
              
              {existingInvoices.length > 0 ? (
                <div className="space-y-4">
                  {existingInvoices.map((inv, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleSelectExistingInvoice(inv)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{inv.invoice_id}</h3>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(inv.date).toLocaleDateString()} | Status: {inv.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">₹{inv.net_amount?.toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-600">{inv.products?.length || 0} products</p>
                        </div>
                      </div>
                      
                      {inv.products && inv.products.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm font-medium text-gray-700 mb-2">Products:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {inv.products.map((product: any, pIndex: number) => (
                              <div key={pIndex} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <div className="font-medium">{product.product_name}</div>
                                <div>SKU: {product.sku} | Qty: {product.quantity} × ₹{product.unit_price}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No existing invoices found.</p>
              )}
            </div>
          </div>
        )}

        {/* Invoice Details Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
            {isInvoiceCreated && (
              <Button onClick={handleSaveInvoice} loading={loading}>
                {!isInvoiceSaved ? (
                  <Button
                    onClick={handleSaveInvoice}
                    loading={loading}
                    className="w-full md:w-auto"
                    size="lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Invoice
                  </Button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">✓ Invoice saved successfully</p>
                    <p className="text-green-600 text-sm">This invoice is now read-only and cannot be modified.</p>
                  </div>
                )}
              <Input
                label="Invoice ID"
                value={invoice.invoice_id || ''}
                onChange={(e) => handleInputChange('invoice_id', e.target.value)}
                placeholder="INV-001"
                error={errors.invoice_id}
                disabled={isInvoiceCreated || isInvoiceSaved}
              />

              <Input
                label="Date"
                type="date"
                value={invoice.date || ''}
                onChange={(e) => handleInputChange('date', e.target.value)}
                error={errors.date}
                disabled={isInvoiceSaved}
              />

              <Select
                label="Status"
                value={invoice.status || ''}
                onChange={(value) => handleInputChange('status', value)}
                options={INVOICE_STATUS}
                error={errors.status}
                disabled={isInvoiceSaved}
              />

              <Select
                label="Payment Status"
                value={invoice.payment_status || ''}
                onChange={(value) => handleInputChange('payment_status', value)}
                options={PAYMENT_STATUS}
                error={errors.payment_status}
                disabled={isInvoiceSaved}
              />

              <Select
                label="State"
                value={invoice.state || ''}
                onChange={(value) => handleInputChange('state', value)}
                options={INDIAN_STATES}
                error={errors.state}
                disabled={isInvoiceSaved}
              />

              <Input
                label="Amount Paid (₹)"
                type="number"
                value={invoice.amount_paid || ''}
                onChange={(e) => handleInputChange('amount_paid', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={isInvoiceSaved}
              />
            </div>

            {/* Auto-filled fields */}
            <div className="p-4 bg-blue-50 rounded-lg">
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

            {!isInvoiceCreated && (
              <div className="pt-4">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  {loading ? 'Creating Invoice...' : 'Create Invoice'}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Products Section - Only show when invoice is created */}
        {isInvoiceCreated && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Products for Invoice: {currentInvoiceId}
              </h2>
              <Button
                type="button"
                onClick={() => setShowProductForm(true)}
                disabled={showProductForm || isInvoiceSaved}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isInvoiceSaved ? 'Invoice Saved (Read-only)' : 'Add Product'}
              </Button>
            </div>

            {showProductForm && (
              <div className="mb-6">
                <ProductForm
                  onAddProduct={handleAddProduct}
                  onCancel={() => setShowProductForm(false)}
                />
              </div>
            )}

            {/* Existing Products List */}
            {invoice.products && invoice.products.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900">Added Products</h3>
                {invoice.products.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                        disabled={isInvoiceSaved}
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

            {/* Invoice Summary - Only show when products exist */}
            {invoice.products && invoice.products.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
                
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
          </div>
        )}

        {/* Instructions */}
        {!isInvoiceCreated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Getting Started</h3>
            <p className="text-sm text-yellow-700">
              1. Fill in the invoice details above and click "Create Invoice"<br/>
              2. Once created, you can add products to this specific invoice<br/>
              3. Products will appear directly below the invoice details<br/>
              4. Save your invoice when you're done adding products
              5. Once saved, the invoice becomes read-only and cannot be modified
            </p>
          </div>
        )}
        
        {isInvoiceSaved && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Invoice Status</h3>
            <p className="text-sm text-blue-700">
              This invoice has been saved and is now in read-only mode. No modifications can be made to the invoice details or products.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};