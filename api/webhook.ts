import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Connect to Supabase using environment variables
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests from Nomba
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const payload = req.body
    console.log('WEBHOOK RECEIVED:', JSON.stringify(payload))

    // Get the payment reference and status from Nomba's payload
    const orderReference = payload?.data?.orderReference
    const status = payload?.data?.status

    // Only mark as paid if payment was successful
    if (!orderReference || status !== 'SUCCESS') {
      return res.status(200).json({ message: 'Ignored - not a successful payment' })
    }

    // Find the participant with this payment reference and mark them as paid
    const { error } = await supabase
      .from('participants')
      .update({
        has_paid: true,
        paid_at: new Date().toISOString(),
      })
      .eq('payment_reference', orderReference)

    if (error) {
      console.error('Supabase update error:', error)
      return res.status(500).json({ message: 'Database update failed' })
    }

    console.log('Participant marked as paid:', orderReference)
    return res.status(200).json({ message: 'Payment confirmed successfully' })

  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}