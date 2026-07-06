import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { CreditCard, User, Mail, CheckCircle } from 'lucide-react'
import type { Split } from '../types'

function PaymentPage() {
  const { id } = useParams()
  const [split, setSplit] = useState<Split | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
  })

  const fetchSplit = useCallback(async () => {
    const { data } = await supabase
      .from('splits')
      .select('*')
      .eq('id', id)
      .single()

    if (data) setSplit(data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSplit()
  }, [fetchSplit])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function checkIfAlreadyPaid() {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('split_id', id)
      .eq('email', form.email)
      .eq('has_paid', true)
      .maybeSingle()

    return !!data
  }

  async function handlePayment() {
    if (!form.name || !form.email) {
      toast.error('Please fill in your name and email!')
      return
    }

    if (!split) return

    setPaying(true)

    // Check if this email already paid
    const paid = await checkIfAlreadyPaid()
    if (paid) {
      toast.error('This email has already paid for this split!')
      setAlreadyPaid(true)
      setPaying(false)
      return
    }

    try {
      // Step 1: Get Nomba access token
        const tokenRes = await fetch('https://api.nomba.com/v1/auth/token/issue', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'accountId': import.meta.env.VITE_NOMBA_ACCOUNT_ID,
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: import.meta.env.VITE_NOMBA_CLIENT_ID,
          client_secret: import.meta.env.VITE_NOMBA_CLIENT_SECRET,
        }),
      })

      const tokenData = await tokenRes.json()
      console.log('NOMBA TOKEN RESPONSE:', JSON.stringify(tokenData))
      const accessToken = tokenData.data?.access_token

      if (!accessToken) {
        toast.error(`Token failed: ${JSON.stringify(tokenData)}`)
        setPaying(false)
        return
      }

      // Step 2: Create Nomba checkout
      const checkoutRes = await fetch('https://api.nomba.com/v1/checkout/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'accountId': import.meta.env.VITE_NOMBA_ACCOUNT_ID,
        },
        body: JSON.stringify({
          order: {
            orderReference: `PS-${(id ?? '').slice(0, 8)}-${Date.now().toString().slice(-8)}`,
            customerId: form.email,
            callbackUrl: `${window.location.origin}/split/${id}`,
            customerEmail: form.email,
            amount: split.amount_per_person,
            currency: 'NGN',
          },
          tokenizeCard: false,
        }),
      })

      const checkoutData = await checkoutRes.json()
      console.log('NOMBA CHECKOUT RESPONSE:', JSON.stringify(checkoutData))
      const checkoutLink = checkoutData.data?.checkoutLink

      if (!checkoutLink) {
        toast.error(`Checkout failed: ${JSON.stringify(checkoutData)}`)
        setPaying(false)
        return
      }

      // Step 3: Save participant to Supabase before redirecting
      await supabase.from('participants').insert([{
        split_id: id,
        name: form.name,
        email: form.email,
        has_paid: false,
        payment_reference: checkoutData.data?.orderReference,
      }])

      // Step 4: Redirect to Nomba checkout page
      window.location.href = checkoutLink

    } catch {
      toast.error('Something went wrong. Please try again!')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading payment page...</p>
      </div>
    )
  }

  if (!split) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Split not found.</p>
      </div>
    )
  }

  if (alreadyPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800">Already Paid!</h1>
          <p className="text-gray-500 mt-2">You have already paid your share for <strong>{split.title}</strong>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{split.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Organized by {split.organizer_name}</p>
        </div>

        {/* Amount Card */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-6">
          <p className="text-sm text-green-700">Your share</p>
          <p className="text-4xl font-bold text-green-600 mt-1">
            ₦{split.amount_per_person.toLocaleString()}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">

          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
              <User size={16} /> Your Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Ayomide"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
              <Mail size={16} /> Your Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="e.g. ayomide@email.com"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={paying}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CreditCard size={18} />
            {paying ? 'Processing...' : `Pay ₦${split.amount_per_person.toLocaleString()}`}
          </button>

          <p className="text-xs text-center text-gray-400">
            Secured by Nomba 🔒
          </p>

        </div>
      </div>
    </div>
  )
}

export default PaymentPage