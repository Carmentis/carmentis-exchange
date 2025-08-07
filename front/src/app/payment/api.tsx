'use client';

/**
 * Interface for card payment data
 */
export interface CardPaymentData {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  cardholderName: string;
  amount: number;
  currency?: string;
  description?: string;
  walletPublicKey?: string;
}

/**
 * Interface for SEPA payment data
 */
export interface SEPAPaymentData {
  accountHolderName: string;
  iban: string;
  bic: string;
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
}

/**
 * Interface for crypto payment data
 */
export interface CryptoPaymentData {
  cryptoType: string;
  walletAddress: string;
  amount: number;
  description?: string;
}

