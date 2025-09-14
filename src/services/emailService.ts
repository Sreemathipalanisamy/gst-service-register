import { encryptData, API_CONFIG } from '../utils/encryption';

export interface EmailVerificationResponse {
  success: boolean;
  valid: boolean;
  message?: string;
}

export interface SendEmailRequest {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachment?: string | null;
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserRegistrationResponse {
  success: boolean;
  message?: string;
  user_id?: string;
}

export class EmailService {
  private static async makeRequest(endpoint: string, payload: any, useEncryption: boolean = true): Promise<any> {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      
      let body: any;
      let headers: any = {
        'Content-Type': 'application/json'
      };

      if (useEncryption) {
        headers = { ...headers, ...API_CONFIG.HEADERS };
        const encryptedData = encryptData(payload);
        body = JSON.stringify({ encrypted_data: encryptedData });
      } else {
        body = JSON.stringify(payload);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async verifyEmail(email: string, useEncryption: boolean = true): Promise<EmailVerificationResponse> {
    try {
      const payload = { email };
      const response = await this.makeRequest('/service/verify_email', payload, useEncryption);
      
      return {
        success: true,
        valid: response.valid || false,
        message: response.message
      };
    } catch (error) {
      console.error('Email verification failed:', error);
      return {
        success: false,
        valid: false,
        message: 'Failed to verify email. Please try again.'
      };
    }
  }

  static async sendEmail(emailData: SendEmailRequest, useEncryption: boolean = true): Promise<SendEmailResponse> {
    try {
      const response = await this.makeRequest('/service/send_email', emailData, useEncryption);
      
      return {
        success: true,
        message: response.message || 'Email sent successfully'
      };
    } catch (error) {
      console.error('Send email failed:', error);
      return {
        success: false,
        message: 'Failed to send email. Please try again.'
      };
    }
  }

  static async registerUser(userData: UserRegistrationRequest): Promise<UserRegistrationResponse> {
    try {
      const response = await this.makeRequest('/auth/register', userData, false);
      
      return {
        success: true,
        message: response.message || 'User registered successfully',
        user_id: response.user_id
      };
    } catch (error) {
      console.error('User registration failed:', error);
      return {
        success: false,
        message: 'Failed to register user. Please try again.'
      };
    }
  }
}