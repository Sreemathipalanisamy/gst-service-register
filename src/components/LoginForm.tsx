import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { LoginCredentials } from '../types';

interface FormErrors {
  gstin?: string;
  email?: string;
  general?: string;
}

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [userInvoices, setUserInvoices] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    gstin: '',
    email: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateGSTIN = (gstin: string): boolean => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!credentials.gstin) {
      newErrors.gstin = 'GSTIN is required';
    } else if (!validateGSTIN(credentials.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }

    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(credentials.email)) {
      newErrors.email = 'Invalid email format';
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
      // Check if user exists in registrations
      const registrations = JSON.parse(localStorage.getItem('gstRegistrations') || '{}');
      const registration = registrations[credentials.gstin];
      
      if (registration) {
        if (registration.email === credentials.email) {
          localStorage.setItem('currentGSTIN', credentials.gstin);
          
          // Load existing invoices for this GSTIN
          const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
          const gstinInvoices = allInvoices.filter((inv: any) => inv.gstin === credentials.gstin);
          
          if (gstinInvoices.length > 0) {
            setUserInvoices(gstinInvoices);
            setShowInvoices(true);
          } else {
            navigate('/invoice');
          }
        } else {
          setErrors({ general: 'Invalid email address for this GSTIN' });
        }
      } else {
        setErrors({ general: 'No registration found. Please register first.' });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setErrors({ general: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoices = () => {
    navigate('/invoice');
  };

  const handleCreateNewInvoice = () => {
    navigate('/invoice');
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (showInvoices) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-600">GSTIN: {credentials.gstin}</p>
            <p className="text-sm text-gray-500">You have {userInvoices.length} existing invoice(s)</p>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Your Existing Invoices</h2>
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {userInvoices.map((invoice, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">Invoice ID: {invoice.invoice_id}</h3>
                      <p className="text-sm text-gray-600">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Status: {invoice.status} | Payment: {invoice.payment_status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">₹{invoice.net_amount?.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-gray-600">{invoice.products?.length || 0} products</p>
                    </div>
                  </div>
                  
                  {invoice.products && invoice.products.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">Products:</p>
                      <div className="space-y-1">
                        {invoice.products.map((product: any, pIndex: number) => (
                          <div key={pIndex} className="text-xs text-gray-600 flex justify-between">
                            <span>{product.product_name} (SKU: {product.sku})</span>
                            <span>Qty: {product.quantity} × ₹{product.unit_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleViewInvoices}
              className="flex-1"
              size="lg"
            >
              Continue to Invoice Management
            </Button>
            <Button
              onClick={handleCreateNewInvoice}
              variant="secondary"
              className="flex-1"
              size="lg"
            >
              Create New Invoice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Access your GST filing dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="GSTIN"
            type="text"
            value={credentials.gstin}
            onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            error={errors.gstin}
            maxLength={15}
          />

          <Input
            label="Email Address"
            type="email"
            value={credentials.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="business@example.com"
            error={errors.email}
          />

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};