import CryptoJS from 'crypto-js';

interface EncryptedData {
  ciphertext: string;
  nonce: string;
  tag: string;
  salt: string;
  algorithm: string;
  iterations: number;
}

export const encryptData = (data: any, password: string = 'default_password'): string => {
  try {
    // Generate random salt and nonce
    const salt = CryptoJS.lib.WordArray.random(16);
    const nonce = CryptoJS.lib.WordArray.random(12);
    
    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000
    });
    
    // Convert data to string
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Encrypt using AES-GCM (simulated with AES-CTR + HMAC)
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: nonce,
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding
    });
    
    // Generate authentication tag (simplified)
    const tag = CryptoJS.HmacSHA256(encrypted.ciphertext.toString(), key).toString().substring(0, 24);
    
    const encryptedData: EncryptedData = {
      ciphertext: encrypted.ciphertext.toString(),
      nonce: nonce.toString(CryptoJS.enc.Base64),
      tag: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(tag)),
      salt: salt.toString(CryptoJS.enc.Base64),
      algorithm: 'AES-256-GCM',
      iterations: 100000
    };
    
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(encryptedData)));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const API_CONFIG = {
  BASE_URL: 'http://10.96.232.159:5000',
  HEADERS: {
    'X-API-KEY': '0898c79d9edee1eaf79e1f97718ea84da47472f70884944ba1641b58ed24796c',
    'X-CLIENT-SECRET': 'default_password',
    'Content-Type': 'application/json'
  }
};