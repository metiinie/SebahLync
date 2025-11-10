import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ChapaWebhookData {
  event: string;
  data: {
    tx_ref?: string;
    transaction_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    customer?: {
      email?: string;
      name?: string;
      phone_number?: string;
    };
  };
}

serve(async (req) => {
  try {
    // Handle CORS for preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    // Parse webhook data
    const webhookData: ChapaWebhookData = await req.json();
    
    console.log("Chapa webhook received:", JSON.stringify(webhookData));

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find transaction by reference
    const txRef = webhookData.data?.tx_ref;
    
    if (!txRef) {
      console.error("No transaction reference found in webhook");
      return new Response(
        JSON.stringify({ error: "Transaction reference not found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find transaction by payment_details->tx_ref
    const { data: transactions, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("payment_details->>tx_ref", txRef);

    if (fetchError || !transactions || transactions.length === 0) {
      console.error("Transaction not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const transaction = transactions[0];

    // Determine status based on Chapa response
    let status = "payment_initiated";
    if (webhookData.data?.status === "successful") {
      status = "payment_completed";
    } else if (webhookData.data?.status === "failed") {
      status = "cancelled";
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status,
        payment_details: {
          ...transaction.payment_details,
          webhook_response: webhookData,
          webhook_received_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update transaction" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // If payment completed, create notifications
    if (status === "payment_completed") {
      // Notify buyer
      await supabase.from("notifications").insert({
        user_id: transaction.buyer_id,
        type: "transaction_completed",
        title: "Payment Successful",
        message: "Your payment has been processed and is held in escrow.",
        data: {
          transaction_id: transaction.id,
          listing_id: transaction.listing_id,
        },
        priority: "high",
        channels: {
          in_app: true,
          email: true,
          sms: false,
          push: false,
        },
        status: "pending",
        read: false,
      });

      // Notify seller
      await supabase.from("notifications").insert({
        user_id: transaction.seller_id,
        type: "payment_received",
        title: "Payment Received",
        message: "Buyer has made payment for your listing.",
        data: {
          transaction_id: transaction.id,
          listing_id: transaction.listing_id,
          amount: transaction.amount,
          currency: transaction.currency,
        },
        priority: "high",
        channels: {
          in_app: true,
          email: true,
          sms: false,
          push: false,
        },
        status: "pending",
        read: false,
      });
    }

    console.log(`Transaction ${transaction.id} updated to ${status}`);

    return new Response(
      JSON.stringify({ received: true, transaction_id: transaction.id, status }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      }
    );
  } catch (error) {
    console.error("Error processing Chapa webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

