import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { INDIAN_STATES, VENDOR_TYPES, ITC_OPTIONS } from '../data/constants';
import { GSTRegistration } from '../types';
import { EmailService } from '../services/emailService';

interface FormErrors {
  gstin?: string;
  vendor_type?: string;
  email?: string;
  turnover?: string;
  state?: string;
  itc?: string;
  general?: string;
}

export const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
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

  const handleEmailVerification = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setEmailVerifying(true);
    try {
      const result = await EmailService.verifyEmail(formData.email);
      
      if (result.success && result.valid) {
        setEmailVerified(true);
        setErrors(prev => ({ ...prev, email: undefined }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          email: result.message || 'Email verification failed. Please check the email address.' 
        }));
        setEmailVerified(false);
      }
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        email: 'Email verification service is currently unavailable. Please try again later.' 
      }));
      setEmailVerified(false);
    } finally {
      setEmailVerifying(false);
    }
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

    if (!emailVerified) {
      newErrors.email = 'Please verify your email address';
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
      // Check if GSTIN already exists
      const existingRegistrations = JSON.parse(localStorage.getItem('gstRegistrations') || '{}');
      
      if (existingRegistrations[formData.gstin!]) {
        setErrors({ general: 'This GSTIN is already registered. Please use a different GSTIN or login with existing credentials.' });
        setLoading(false);
        return;
      }
      
      // Store registration data with GSTIN as key
      existingRegistrations[formData.gstin!] = {
        ...formData,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('gstRegistrations', JSON.stringify(existingRegistrations));
      localStorage.setItem('currentGSTIN', formData.gstin!);
      
      // Navigate to invoice page
      navigate('/invoice');
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GSTRegistration, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset email verification when email changes
    if (field === 'email') {
      setEmailVerified(false);
    }
    
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
            
            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleEmailVerification}
                loading={emailVerifying}
                disabled={!formData.email || emailVerified}
                size="sm"
              >
                {emailVerifying ? 'Verifying...' : emailVerified ? 'Email Verified ✓' : 'Verify Email'}
              </Button>
              {emailVerified && (
                <p className="text-sm text-green-600">✓ Email address verified successfully</p>
              )}
            </div>

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

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

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