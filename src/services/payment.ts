import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

// Payment Gateway Configuration
const PAYMENT_CONFIG = {
  chapa: {
    baseUrl: 'https://api.chapa.co/v1',
    publicKey: import.meta.env.VITE_CHAPA_PUBLIC_KEY || '',
    secretKey: import.meta.env.VITE_CHAPA_SECRET_KEY || '',
  },
  telebirr: {
    baseUrl: 'https://app.telebirr.com/api/api',
    fabricAppId: import.meta.env.VITE_TELEBIRR_FABRIC_APP_ID || '', // Fabric App ID
    appSecret: import.meta.env.VITE_TELEBIRR_APP_SECRET || '', // App Secret
    merchantId: import.meta.env.VITE_TELEBIRR_MERCHANT_ID || '', // Merchant AppId
    merchantCode: import.meta.env.VITE_TELEBIRR_SHORT_CODE || '', // ShortCode
  },
  bibit: {
    baseUrl: 'https://api.bibit.com/v1',
    apiKey: import.meta.env.VITE_BIBIT_API_KEY || '',
    merchantId: import.meta.env.VITE_BIBIT_MERCHANT_ID || '',
  },
};

export interface ChapaPaymentRequest {
  amount: string;
  currency: string;
  email: string;
  phone_number: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization: {
    title: string;
    description: string;
  };
  meta?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface ChapaPaymentResponse {
  status: string;
  message: string;
  data?: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
  status: string;
  message: string;
  data?: {
    id: string;
    tx_ref: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  };
}

export class PaymentService {
  // Initialize Chapa payment
  static async initializeChapaPayment(
    transactionId: string,
    listingId: string,
    amount: number,
    currency: string,
    buyerEmail: string,
    buyerPhone: string,
    buyerName: string
  ): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    try {
      console.log('🔍 DEBUG: Using Supabase Edge Function to initialize Chapa payment');

      // Use Supabase Edge Function to avoid CORS issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (!supabaseUrl) {
        console.error('❌ VITE_SUPABASE_URL not configured');
        return {
          success: false,
          message: 'Supabase URL not configured. Please contact support.',
        };
      }

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/initialize-chapa-payment`;
      console.log('🔍 DEBUG: Calling Edge Function:', edgeFunctionUrl);
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          transactionId,
          listingId,
          amount,
          currency,
          buyerEmail,
          buyerPhone,
          buyerName,
        }),
      });

      console.log('🔍 DEBUG: Edge function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge function error:', errorText);
        
        // Provide helpful error message
        if (response.status === 404) {
          return {
            success: false,
            message: 'Payment service not available. Please contact support or try again later.',
          };
        }
        
        return {
          success: false,
          message: `Failed to initialize payment: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Transaction already updated by edge function
        return {
          success: true,
          checkoutUrl: data.checkoutUrl,
        };
      }

      return {
        success: false,
        message: data.message || 'Failed to initialize payment',
      };
    } catch (error) {
      console.error('Error initializing Chapa payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize payment',
      };
    }
  }

  // Verify Chapa payment
  static async verifyChapaPayment(transactionId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // Get transaction details
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      const txRef = transaction.payment_details?.tx_ref;
      
      if (!txRef) {
        return {
          success: false,
          message: 'Transaction reference not found',
        };
      }

      // Verify with Chapa
      const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYMENT_CONFIG.chapa.secretKey}`,
        },
      });

      const data: ChapaVerifyResponse = await response.json();

      if (data.status === 'success' && data.data) {
        // Update transaction status
        const newStatus = data.data.status === 'successful' ? 'payment_completed' : 'payment_initiated';
        
        await supabase
          .from('transactions')
          .update({
            status: newStatus,
            payment_details: {
              ...transaction.payment_details,
              gateway_response: data.data,
              processed_at: new Date().toISOString(),
            },
          })
          .eq('id', transactionId);

        return {
          success: true,
          data: {
            verified: data.data.status === 'successful',
            status: data.data.status,
            amount: data.data.amount,
            currency: data.data.currency,
          },
        };
      }

      return {
        success: false,
        message: data.message || 'Payment verification failed',
      };
    } catch (error) {
      console.error('Error verifying Chapa payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify payment',
      };
    }
  }

  // Handle Chapa webhook callback
  static async handleChapaWebhook(webhookData: any): Promise<{ success: boolean; message?: string }> {
    try {
      const txRef = webhookData.tx_ref;
      
      if (!txRef) {
        return {
          success: false,
          message: 'Transaction reference not found',
        };
      }

      // Find transaction by reference
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .like('payment_details->>tx_ref', txRef)
        .single();

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      // Update transaction based on webhook data
      const status = webhookData.status === 'successful' ? 'payment_completed' : 
                     webhookData.status === 'failed' ? 'cancelled' : 
                     'payment_initiated';

      await supabase
        .from('transactions')
        .update({
          status,
          payment_details: {
            ...transaction.payment_details,
            webhook_response: webhookData,
            webhook_received_at: new Date().toISOString(),
          },
        })
        .eq('id', transaction.id);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error handling Chapa webhook:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to handle webhook',
      };
    }
  }

  // Initialize Telebirr payment
  static async initializeTelebirrPayment(
    transactionId: string,
    listingId: string,
    amount: number,
    currency: string,
    buyerPhone: string,
    buyerName: string
  ): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    try {
      // Validate required credentials
      if (!PAYMENT_CONFIG.telebirr.fabricAppId || !PAYMENT_CONFIG.telebirr.appSecret) {
        console.error('Missing Telebirr credentials. Please configure VITE_TELEBIRR_FABRIC_APP_ID and VITE_TELEBIRR_APP_SECRET in your .env file');
        return {
          success: false,
          message: 'Telebirr payment gateway is not configured. Please contact support.',
        };
      }

      // Generate unique order ID
      const orderId = `SBL_${transactionId}_${Date.now()}`;
      
      // Callback URL for webhook - Use Supabase Edge Functions
      const callbackUrl = import.meta.env.VITE_TELEBIRR_WEBHOOK_URL || `${window.location.origin}/functions/v1/payment-telebirr`;
      
      // Return URL after payment
      const returnUrl = `${window.location.origin}/payment/success?transaction=${transactionId}`;

      // Telebirr payment request payload
      const paymentRequest = {
        outTradeNo: orderId,
        subject: `SebahLync Payment - ${transactionId}`,
        totalAmount: amount.toString(),
        shortCode: PAYMENT_CONFIG.telebirr.merchantCode || PAYMENT_CONFIG.telebirr.merchantId || '608986',
        notifyUrl: callbackUrl,
        returnUrl: returnUrl,
        receiveName: buyerName,
        appId: PAYMENT_CONFIG.telebirr.fabricAppId,
        timeoutExpress: '30m',
        account: PAYMENT_CONFIG.telebirr.merchantId,
      };

      // Generate signature for Telebirr API
      const timestamp = Date.now().toString();
      const nonce = Math.random().toString(36).substring(7);
      
      // Initialize payment with Telebirr API
      // Note: Telebirr requires X-APP-Key header (Fabric App ID)
      const response = await fetch(`${PAYMENT_CONFIG.telebirr.baseUrl}/payment/v1.0.0/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-APP-Key': PAYMENT_CONFIG.telebirr.fabricAppId, // Required: Fabric App ID
          'Authorization': `Bearer ${PAYMENT_CONFIG.telebirr.appSecret}`,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telebirr API error:', errorText);
        return {
          success: false,
          message: `Failed to initialize payment: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      if (data.code === '200' || data.success) {
        // Update transaction with payment reference
        await supabase
          .from('transactions')
          .update({
            payment_details: {
              order_id: orderId,
              gateway: 'telebirr',
              checkout_url: data.data?.toPayUrl || data.toPayUrl,
            },
          })
          .eq('id', transactionId);

        return {
          success: true,
          checkoutUrl: data.data?.toPayUrl || data.toPayUrl || data.checkoutUrl,
        };
      }

      return {
        success: false,
        message: data.message || 'Failed to initialize Telebirr payment',
      };
    } catch (error) {
      console.error('Error initializing Telebirr payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize Telebirr payment',
      };
    }
  }

  // Verify Telebirr payment
  static async verifyTelebirrPayment(transactionId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      const orderId = transaction.payment_details?.order_id;
      
      if (!orderId) {
        return {
          success: false,
          message: 'Order ID not found',
        };
      }

      // Verify payment with Telebirr
      const response = await fetch(`${PAYMENT_CONFIG.telebirr.baseUrl}/payment/v1.0.0/query-payment/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYMENT_CONFIG.telebirr.appSecret}`,
        },
      });

      const data = await response.json();

      if (data.code === '200' && data.data) {
        const isPaid = data.data.status === 'SUCCESS';
        const newStatus = isPaid ? 'payment_completed' : 'payment_initiated';
        
        await supabase
          .from('transactions')
          .update({
            status: newStatus,
            payment_details: {
              ...transaction.payment_details,
              gateway_response: data.data,
              processed_at: new Date().toISOString(),
            },
          })
          .eq('id', transactionId);

        return {
          success: true,
          data: {
            verified: isPaid,
            status: data.data.status,
            amount: data.data.totalAmount,
          },
        };
      }

      return {
        success: false,
        message: data.message || 'Payment verification failed',
      };
    } catch (error) {
      console.error('Error verifying Telebirr payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify payment',
      };
    }
  }

  // Handle Telebirr webhook callback
  static async handleTelebirrWebhook(webhookData: any): Promise<{ success: boolean; message?: string }> {
    try {
      const orderId = webhookData.outTradeNo;
      
      if (!orderId) {
        return {
          success: false,
          message: 'Order ID not found',
        };
      }

      // Find transaction by order ID
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .like('payment_details->>order_id', orderId)
        .single();

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      // Update transaction based on webhook data
      const status = webhookData.status === 'SUCCESS' ? 'payment_completed' : 
                     webhookData.status === 'FAILED' ? 'cancelled' : 
                     'payment_initiated';

      await supabase
        .from('transactions')
        .update({
          status,
          payment_details: {
            ...transaction.payment_details,
            webhook_response: webhookData,
            webhook_received_at: new Date().toISOString(),
          },
        })
        .eq('id', transaction.id);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error handling Telebirr webhook:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to handle webhook',
      };
    }
  }

  // Initialize Bibit payment
  static async initializeBibitPayment(
    transactionId: string,
    listingId: string,
    amount: number,
    currency: string,
    buyerEmail: string,
    buyerPhone: string
  ): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    try {
      // Validate required credentials
      if (!PAYMENT_CONFIG.bibit.apiKey || !PAYMENT_CONFIG.bibit.merchantId) {
        console.error('Missing Bibit credentials. Please configure VITE_BIBIT_API_KEY and VITE_BIBIT_MERCHANT_ID in your .env file');
        return {
          success: false,
          message: 'Bibit payment gateway is not configured. Please contact support.',
        };
      }

      // Generate unique reference for Bibit
      const bibitReference = `SBL_${transactionId}_${Date.now()}`;
      
      // Callback and return URLs - Use Supabase Edge Functions
      const callbackUrl = import.meta.env.VITE_BIBIT_WEBHOOK_URL || `${window.location.origin}/functions/v1/payment-bibit`;
      const returnUrl = `${window.location.origin}/payment/success?transaction=${transactionId}`;

      // Bibit payment request payload
      const paymentRequest = {
        merchantId: PAYMENT_CONFIG.bibit.merchantId,
        reference: bibitReference,
        amount: {
          value: amount.toString(),
          currency: currency.toUpperCase(),
        },
        customer: {
          email: buyerEmail,
          phone: buyerPhone,
        },
        description: `SebahLync Payment - ${listingId}`,
        callbackUrl: callbackUrl,
        returnUrl: returnUrl,
        metadata: {
          transaction_id: transactionId,
          listing_id: listingId,
        },
      };

      const response = await fetch(`${PAYMENT_CONFIG.bibit.baseUrl}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYMENT_CONFIG.bibit.apiKey}`,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bibit API error:', errorText);
        return {
          success: false,
          message: `Failed to initialize payment: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      if (data.status === 'success' || data.success) {
        // Update transaction with payment reference
        await supabase
          .from('transactions')
          .update({
            payment_details: {
              bibit_reference: bibitReference,
              gateway: 'bibit',
              checkout_url: data.data?.authorization_url || data.authorization_url,
            },
          })
          .eq('id', transactionId);

        return {
          success: true,
          checkoutUrl: data.data?.authorization_url || data.authorization_url || data.checkoutUrl,
        };
      }

      return {
        success: false,
        message: data.message || 'Failed to initialize Bibit payment',
      };
    } catch (error) {
      console.error('Error initializing Bibit payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize Bibit payment',
      };
    }
  }

  // Verify Bibit payment
  static async verifyBibitPayment(transactionId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      const bibitReference = transaction.payment_details?.bibit_reference;
      
      if (!bibitReference) {
        return {
          success: false,
          message: 'Bibit reference not found',
        };
      }

      // Verify payment with Bibit API
      const response = await fetch(`${PAYMENT_CONFIG.bibit.baseUrl}/payments/verify/${bibitReference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYMENT_CONFIG.bibit.apiKey}`,
        },
      });

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        const isPaid = data.data.status === 'success' || data.data.status === 'completed';
        const newStatus = isPaid ? 'payment_completed' : 'payment_initiated';
        
        await supabase
          .from('transactions')
          .update({
            status: newStatus,
            payment_details: {
              ...transaction.payment_details,
              gateway_response: data.data,
              processed_at: new Date().toISOString(),
            },
          })
          .eq('id', transactionId);

        return {
          success: true,
          data: {
            verified: isPaid,
            status: data.data.status,
            amount: data.data.amount,
          },
        };
      }

      return {
        success: false,
        message: data.message || 'Payment verification failed',
      };
    } catch (error) {
      console.error('Error verifying Bibit payment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify payment',
      };
    }
  }

  // Handle Bibit webhook callback
  static async handleBibitWebhook(webhookData: any): Promise<{ success: boolean; message?: string }> {
    try {
      const reference = webhookData.reference || webhookData.data?.reference;
      
      if (!reference) {
        return {
          success: false,
          message: 'Reference not found',
        };
      }

      // Find transaction by Bibit reference
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .like('payment_details->>bibit_reference', reference)
        .single();

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      // Update transaction based on webhook data
      const status = webhookData.status === 'success' || webhookData.status === 'completed' 
        ? 'payment_completed' 
        : webhookData.status === 'failed'
        ? 'cancelled' 
        : 'payment_initiated';

      await supabase
        .from('transactions')
        .update({
          status,
          payment_details: {
            ...transaction.payment_details,
            webhook_response: webhookData,
            webhook_received_at: new Date().toISOString(),
          },
        })
        .eq('id', transaction.id);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error handling Bibit webhook:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to handle webhook',
      };
    }
  }

  // Generic payment initialization based on method
  static async initializePayment(
    method: 'chapa' | 'telebirr' | 'bibit',
    transactionId: string,
    listingId: string,
    amount: number,
    currency: string,
    buyerEmail: string,
    buyerPhone: string,
    buyerName: string
  ): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
    switch (method) {
      case 'chapa':
        return this.initializeChapaPayment(
          transactionId,
          listingId,
          amount,
          currency,
          buyerEmail,
          buyerPhone,
          buyerName
        );
      case 'telebirr':
        return this.initializeTelebirrPayment(
          transactionId,
          listingId,
          amount,
          currency,
          buyerPhone,
          buyerName
        );
      case 'bibit':
        return this.initializeBibitPayment(
          transactionId,
          listingId,
          amount,
          currency,
          buyerEmail,
          buyerPhone
        );
      default:
        return {
          success: false,
          message: 'Invalid payment method',
        };
    }
  }

  // Get payment status
  static async getPaymentStatus(transactionId: string): Promise<{ success: boolean; status?: string; data?: any; message?: string }> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      return {
        success: true,
        status: transaction.status,
        data: transaction,
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get payment status',
      };
    }
  }
}

