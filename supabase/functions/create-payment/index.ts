
// @ts-ignore: Deno-specific import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore: Deno-specific global
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, description, redirectUrl, metadata } = await req.json()

    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100)

    const params = new URLSearchParams()
    params.append('mode', 'payment')
    params.append('currency', 'eur')
    params.append('success_url', `${redirectUrl}&payment_status=success`)
    params.append('cancel_url', `${redirectUrl}&payment_status=cancelled`)
    params.append('line_items[0][quantity]', '1')
    params.append('line_items[0][price_data][currency]', 'eur')
    params.append('line_items[0][price_data][unit_amount]', String(amountInCents))
    params.append('line_items[0][price_data][product_data][name]', description)
    if (metadata?.type) params.append('metadata[type]', metadata.type)
    if (metadata?.count !== undefined) params.append('metadata[count]', String(metadata.count))
    if (metadata?.userId) params.append('metadata[userId]', metadata.userId)

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create Stripe Checkout session')
    }

    return new Response(
      JSON.stringify({ checkoutUrl: data.url, sessionId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
