import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { PaymentService } from '@/services/payment';
import { TransactionsService } from '@/services/transactions';
import { NotificationsService } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transactionId = searchParams.get('transaction') || undefined;

  const verifyPayment = useCallback(async () => {
    try {
      setVerifying(true);
      setError(null);

      // Wait a moment for the webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get payment status
      const statusResult = await PaymentService.getPaymentStatus(transactionId!);
      
      if (statusResult.success) {
        if (statusResult.status === 'payment_completed' || statusResult.status === 'escrowed') {
          setVerified(true);
          
          // Update transaction status to escrowed if not already
          if (statusResult.status === 'payment_completed') {
            await TransactionsService.updateTransactionStatus(transactionId!, 'escrowed');
            
            // Create notifications
            if (statusResult.data) {
              const transaction = statusResult.data;
              
              // Notify buyer
              await NotificationsService.createNotification({
                user_id: user?.id || '',
                type: 'transaction_completed',
                title: 'Payment Successful',
                message: 'Your payment has been processed and is held in escrow.',
                data: {
                  transaction_id: transactionId || undefined,
                  listing_id: transaction.listing_id,
                },
                priority: 'high',
                channels: {
                  in_app: true,
                  email: true,
                  sms: true,
                  push: true,
                },
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              });

              // Notify seller
              await NotificationsService.createNotification({
                user_id: transaction.seller_id,
                type: 'payment_received',
                title: 'Payment Received',
                message: 'Buyer has made payment for your listing.',
                data: {
                  transaction_id: transactionId || undefined,
                  listing_id: transaction.listing_id,
                  amount: transaction.amount,
                  currency: transaction.currency,
                },
                priority: 'high',
                channels: {
                  in_app: true,
                  email: true,
                  sms: true,
                  push: true,
                },
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              });

              // Notify admin
              await NotificationsService.createAdminNotification(
                'New Escrow Transaction',
                `A new transaction is in escrow and requires admin attention.`,
                'urgent',
                `/admin?tab=manage-escrow&transaction=${transactionId}`
              );
            }
          }
          
          toast.success('Payment verified successfully!');
        } else {
          // Get transaction to determine payment method
          const { data: transactionData } = await supabase
            .from('transactions')
            .select('payment_method')
            .eq('id', transactionId!)
            .single();

          let verifyResult;
          
          // Verify with appropriate payment gateway
          if (transactionData?.payment_method === 'telebirr') {
            verifyResult = await PaymentService.verifyTelebirrPayment(transactionId!);
          } else if (transactionData?.payment_method === 'bibit') {
            verifyResult = await PaymentService.verifyBibitPayment(transactionId!);
          } else {
            // Default to Chapa
            verifyResult = await PaymentService.verifyChapaPayment(transactionId!);
          }
          
          if (verifyResult.success && verifyResult.data?.verified) {
            setVerified(true);
            toast.success('Payment verified successfully!');
            
            // Update to escrowed status
            await TransactionsService.updateTransactionStatus(transactionId!, 'escrowed');
          } else {
            setError('Payment verification failed. Please contact support.');
          }
        }
      } else {
        setError(statusResult.message || 'Failed to verify payment');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError('An error occurred while verifying payment');
    } finally {
      setVerifying(false);
    }
  }, [transactionId, user?.id]);

  useEffect(() => {
    if (transactionId) {
      verifyPayment();
    } else {
      setError('Transaction ID not found');
      setVerifying(false);
    }
  }, [transactionId, verifyPayment]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your payment has been processed and is now held in escrow until you confirm receipt of the item.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Your payment is secured in escrow</li>
                  <li>• The seller will be notified of your payment</li>
                  <li>• Arrange item pickup/delivery with the seller</li>
                  <li>• Confirm receipt to release payment to seller</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => navigate(`/profile?tab=my-transactions&transaction=${transactionId}`)}
                  className="w-full"
                >
                  View Transaction
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/buy')}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-6">
              {error || 'We were unable to verify your payment. Please contact support if payment was deducted from your account.'}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate(`/profile?tab=my-transactions`)}
                className="w-full"
              >
                View Transactions
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/contact')}
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;

