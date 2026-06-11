// @ts-nocheck
// @ts-ignore: Deno-specific import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, payload } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    if (!name || !payload) {
      throw new Error('Name and Payload are required')
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FAINL Core <onboarding@resend.dev>', // Resend default from address or verified domain
        to: ['info@mnrv.nl'],
        subject: `[MISSION ENQUIRY] Core Sync Request: ${name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 4px solid #000000; padding: 40px;">
              <h1 style="text-transform: uppercase; font-size: 24px; font-weight: 900; letter-spacing: -0.05em; border-bottom: 4px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">
                Incoming Mission Directive
              </h1>
              <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; color: #666;">
                Source Identity:
              </p>
              <p style="font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px;">
                ${name}
              </p>
              <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; color: #666;">
                Communication Payload:
              </p>
              <div style="background-color: #000; color: #fff; padding: 20px; font-family: monospace; font-size: 14px; line-height: 1.6;">
                ${payload.replace(/\n/g, '<br>')}
              </div>
              <p style="margin-top: 40px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #ccc;">
                SYSTEM_ORIGIN: FAINL_CORE_TRANSCEIVER
              </p>
            </div>
          </div>
        `,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email via Resend')
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
