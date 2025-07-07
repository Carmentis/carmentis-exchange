'use client';

import axios from 'axios';
import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';

// Get environment variables using next-runtime-env
const EXCHANGE_API = env('NEXT_PUBLIC_EXCHANGE_API');
const STANCER_API = env('NEXT_PUBLIC_STANCER_API') || 'https://api.stancer.com/v1';
const STANCER_PUBLIC_KEY = env('NEXT_PUBLIC_STANCER_PUBLIC_KEY');

if (!EXCHANGE_API) {
  console.error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
}

if (!STANCER_PUBLIC_KEY) {
  console.error("The NEXT_PUBLIC_STANCER_PUBLIC_KEY variable is not defined");
}

/**
 * Hook to fetch exchange configuration
 * @returns {Object} Object containing nodeUrl and loading/error states
 */
export function useExchangeConfig() {
  const [nodeUrl, setNodeUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!EXCHANGE_API) {
        setError(new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined"));
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(EXCHANGE_API + '/networkConfig');
        setNodeUrl(response.data.nodeUrl);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { nodeUrl, loading, error };
}

/**
 * Hook to create a token account
 * @returns {Object} Object containing createAccount function and loading/error states
 */
export function useCreateTokenAccount() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  const createAccount = async (accountData: { publicKey: string; tokenAmount: number }) => {
    if (!EXCHANGE_API) {
      throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(EXCHANGE_API + '/creditTokenAccount', {
        publicKey: accountData.publicKey,
        tokenAmount: accountData.tokenAmount,
      });
      setData(response.data);
      setLoading(false);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      console.error(`Cannot credit the account: got the following error:`, errorMessage);
      setError(errorMessage);
      setLoading(false);
      throw errorMessage;
    }
  };

  return { createAccount, loading, error, data };
}

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

/**
 * Hook to process card payments using the backend payment endpoint
 * @returns {Object} Object containing processPayment function and loading/error states
 */
export function useCardPayment() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const processPayment = async (paymentDetails: CardPaymentData) => {
    if (!EXCHANGE_API) {
      throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
    }

    setLoading(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      // Call the backend payment endpoint
      const response = await axios.post(`${EXCHANGE_API}/payment`, {
        card: {
          number: paymentDetails.cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(paymentDetails.expiryDate.split('/')[0], 10),
          exp_year: parseInt('20' + paymentDetails.expiryDate.split('/')[1], 10),
          cvc: paymentDetails.cvc,
          name: paymentDetails.cardholderName
        },
        amount: paymentDetails.amount * 100, // Convert to cents
        tokens: paymentDetails.amount, // Assuming 1 token = 1 currency unit
        walletPublicKey: paymentDetails.walletPublicKey || 'wallet-' + Date.now()
      });

      setPaymentData(response.data);

      // Open the redirection URL in a new tab
      if (response.data && response.data.redirect_url) {
        window.open(response.data.redirect_url, '_blank');

        // Start polling for payment status
        if (response.data.payment_id) {
          const checkPaymentStatus = async () => {
            try {
              const statusResponse = await axios.post(`${EXCHANGE_API}/payment/result/${response.data.payment_id}`);

              if (statusResponse.data && statusResponse.data.status) {
                if (statusResponse.data.status === 'completed') {
                  // Payment completed successfully
                  setPaymentStatus('success');
                  setLoading(false);

                  // Redirect to success page
                  //window.location.href = '/payment/success';
                  //return;
                } else if (statusResponse.data.status === 'failed') {
                  // Payment failed
                  throw new Error('Payment failed');
                }
              }

              // If payment is still pending, check again after 2 seconds
              setTimeout(checkPaymentStatus, 2000);
            } catch (statusError) {
              setError(statusError instanceof Error ? statusError : new Error(String(statusError)));
              setPaymentStatus('error');
              setLoading(false);
            }
          };

          // Start checking payment status
          checkPaymentStatus();
        }
      }

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      console.error(`Payment processing error:`, errorMessage);
      setError(errorMessage);
      setPaymentStatus('error');
      setLoading(false);
      throw errorMessage;
    }
  };

  return { processPayment, loading, error, paymentData, paymentStatus };
}

/**
 * Hook to process SEPA payments
 * @returns {Object} Object containing processPayment function and loading/error states
 */
export function useSEPAPayment() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const processPayment = async (paymentDetails: SEPAPaymentData) => {
    if (!EXCHANGE_API) {
      throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
    }

    setLoading(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      // Send SEPA payment information to the backend
      const response = await axios.post(`${EXCHANGE_API}/processPayment`, {
        paymentMethod: 'sepa',
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || 'eur',
        status: 'pending', // SEPA payments are pending until confirmed by the bank
        details: {
          accountHolderName: paymentDetails.accountHolderName,
          iban: paymentDetails.iban,
          bic: paymentDetails.bic,
          reference: paymentDetails.reference || `TOKEN-${Date.now()}`
        }
      });

      setPaymentData(response.data);
      setPaymentStatus('success');
      setLoading(false);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      console.error(`SEPA payment processing error:`, errorMessage);
      setError(errorMessage);
      setPaymentStatus('error');
      setLoading(false);
      throw errorMessage;
    }
  };

  return { processPayment, loading, error, paymentData, paymentStatus };
}

/**
 * Hook to process cryptocurrency payments
 * @returns {Object} Object containing processPayment function and loading/error states
 */
export function useCryptoPayment() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const processPayment = async (paymentDetails: CryptoPaymentData) => {
    if (!EXCHANGE_API) {
      throw new Error("The NEXT_PUBLIC_EXCHANGE_API variable is not defined");
    }

    setLoading(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      // Send cryptocurrency payment information to the backend
      const response = await axios.post(`${EXCHANGE_API}/processPayment`, {
        paymentMethod: 'crypto',
        amount: paymentDetails.amount,
        status: 'pending', // Crypto payments are pending until confirmed on the blockchain
        details: {
          cryptoType: paymentDetails.cryptoType,
          walletAddress: paymentDetails.walletAddress
        }
      });

      setPaymentData(response.data);
      setPaymentStatus('success');
      setLoading(false);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      console.error(`Cryptocurrency payment processing error:`, errorMessage);
      setError(errorMessage);
      setPaymentStatus('error');
      setLoading(false);
      throw errorMessage;
    }
  };

  return { processPayment, loading, error, paymentData, paymentStatus };
}
