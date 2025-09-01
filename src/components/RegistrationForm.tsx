import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { INDIAN_STATES, VENDOR_TYPES, ITC_OPTIONS } from '../data/constants';
import { GSTRegistration } from '../types';

interface FormErrors {
  gstin?: string;
  vendor_type?: string;
  email?: string;
  turnover?: string;
  state?: string;
  itc?: string;
}

export const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<GSTRegistration>>({
    gstin: '',
    vendor_type: '',
    email: '',
    turnover: 0,
    state: '',
    itc: ''
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

    if (!formData.gstin) {
      newErrors.gstin = 'GSTIN is required';
    } else if (!validateGSTIN(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }

    if (!formData.vendor_type) {
      newErrors.vendor_type = 'Vendor type is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.turnover || formData.turnover <= 0) {
      newErrors.turnover = 'Valid turnover amount is required';
    }

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.itc) {
      newErrors.itc = 'ITC option is required';
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
      // Store registration data in localStorage for demo purposes
      localStorage.setItem('gstRegistration', JSON.stringify(formData));
      localStorage.setItem('currentGSTIN', formData.gstin!);
      
      // Navigate to invoice page
      navigate('/invoice');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GSTRegistration, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GST Service Registration</h1>
          <p className="text-gray-600">Register your business for GST filing services</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="GSTIN"
              type="text"
              value={formData.gstin || ''}
              onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              error={errors.gstin}
              maxLength={15}
            />

            <Select
              label="Vendor Type"
              value={formData.vendor_type || ''}
              onChange={(value) => handleInputChange('vendor_type', value)}
              options={VENDOR_TYPES}
              placeholder="Select vendor type"
              error={errors.vendor_type}
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="business@example.com"
              error={errors.email}
            />

            <Input
              label="Annual Turnover (₹)"
              type="number"
              value={formData.turnover || ''}
              onChange={(e) => handleInputChange('turnover', parseFloat(e.target.value) || 0)}
              placeholder="2000000"
              error={errors.turnover}
              min="0"
              step="0.01"
            />

            <Select
              label="State"
              value={formData.state || ''}
              onChange={(value) => handleInputChange('state', value)}
              options={INDIAN_STATES}
              placeholder="Select state"
              error={errors.state}
            />

            <Select
              label="Input Tax Credit (ITC)"
              value={formData.itc || ''}
              onChange={(value) => handleInputChange('itc', value)}
              options={ITC_OPTIONS}
              placeholder="Select ITC option"
              error={errors.itc}
            />
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Registering...' : 'Register Business'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already registered?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};