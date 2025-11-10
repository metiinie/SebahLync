import { supabase } from '../lib/supabase';
import { Transaction, CreateTransactionData } from '../types';

export class TransactionsService {
  // Calculate commission (2%)
  static calculateCommission(amount: number): { amount: number; rate: number } {
    const rate = 0.02; // 2%
    return {
      amount: amount * rate,
      rate,
    };
  }

  // Create a new transaction
  static async createTransaction(
    transactionData: CreateTransactionData
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      // Calculate commission
      const commission = this.calculateCommission(transactionData.amount);
      
      const transactionPayload = {
        ...transactionData,
        commission: {
          amount: commission.amount,
          rate: commission.rate,
        },
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionPayload)
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to create transaction',
      };
    }
  }

  // Get transaction by ID
  static async getTransactionById(id: string): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images,
            owner:users!listings_owner_id_fkey(
              id,
              full_name,
              email,
              phone,
              verified,
              avatar_url
            )
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          ),
          admin:users!transactions_admin_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch transaction',
      };
    }
  }

  // Get user's transactions
  static async getUserTransactions(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Transaction[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('transactions')
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          )
        `, { count: 'exact' })
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch user transactions',
      };
    }
  }

  // Get transactions by status
  static async getTransactionsByStatus(
    status: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Transaction[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('transactions')
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching transactions by status:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch transactions by status',
      };
    }
  }

  // Update transaction status
  static async updateTransactionStatus(
    id: string,
    status: string,
    adminId?: string
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (adminId) {
        updateData.admin_id = adminId;
      }

      // If status is 'escrowed', set escrow_release_at
      if (status === 'escrowed') {
        updateData.escrow_release_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update transaction status',
      };
    }
  }

  // Release escrow funds
  static async releaseEscrow(
    transactionId: string,
    adminId: string
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      // Call the database function to handle escrow release
      const { data, error } = await supabase.rpc('handle_escrow_release', {
        p_transaction_id: transactionId,
        p_admin_id: adminId,
      });

      if (error) throw error;

      // Get the updated transaction
      const transaction = await this.getTransactionById(transactionId);
      return transaction;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to release escrow',
      };
    }
  }

  // Refund transaction
  static async refundTransaction(
    transactionId: string,
    adminId: string,
    reason?: string
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'refunded',
          admin_id: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error refunding transaction:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to refund transaction',
      };
    }
  }

  // Get transaction statistics
  static async getTransactionStats(): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('status, amount, currency, created_at, commission_amount');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byStatus: {} as Record<string, number>,
        totalVolume: 0,
        totalCommissions: 0,
        monthlyStats: {} as Record<string, any>,
      };

      if (data && data.length > 0) {
        // Calculate status distribution
        data.forEach((transaction) => {
          stats.byStatus[transaction.status] = (stats.byStatus[transaction.status] || 0) + 1;
          stats.totalVolume += transaction.amount;
          stats.totalCommissions += transaction.commission_amount || 0;
        });

        // Calculate monthly statistics
        data.forEach((transaction) => {
          const month = new Date(transaction.created_at).toISOString().substring(0, 7); // YYYY-MM
          if (!stats.monthlyStats[month]) {
            stats.monthlyStats[month] = {
              count: 0,
              volume: 0,
              commissions: 0,
            };
          }
          stats.monthlyStats[month].count += 1;
          stats.monthlyStats[month].volume += transaction.amount;
          stats.monthlyStats[month].commissions += transaction.commission_amount || 0;
        });
      }

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch transaction statistics',
      };
    }
  }

  // Get pending escrow transactions
  static async getPendingEscrowTransactions(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Transaction[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('transactions')
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('status', 'escrowed')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching pending escrow transactions:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch pending escrow transactions',
      };
    }
  }

  // Get transactions requiring admin action
  static async getTransactionsRequiringAction(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Transaction[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('transactions')
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          )
        `, { count: 'exact' })
        .in('status', ['pending', 'escrowed', 'disputed'])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching transactions requiring action:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch transactions requiring action',
      };
    }
  }

  // Mark transaction as disputed
  static async disputeTransaction(
    transactionId: string,
    reason: string,
    userId: string
  ): Promise<{ success: boolean; data: Transaction | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'disputed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select(`
          *,
          listing:listings!transactions_listing_id_fkey(
            id,
            title,
            price,
            currency,
            type,
            category,
            images
          ),
          buyer:users!transactions_buyer_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          ),
          seller:users!transactions_seller_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error disputing transaction:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to dispute transaction',
      };
    }
  }
}