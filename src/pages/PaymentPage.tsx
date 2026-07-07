import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { CreditCard, User, Mail, CheckCircle, Wallet } from 'lucide-react'
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

    const paid = await checkIfAlreadyPaid()
    if (paid) {
      toast.error('This email has already paid for this split!')
      setAlreadyPaid(true)
      setPaying(false)
      return
    }

    try {
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
      const accessToken = tokenData.data?.access_token

      if (!accessToken) {
        toast.error('Payment setup failed. Try again!')
        setPaying(false)
        return
      }

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
      const checkoutLink = checkoutData.data?.checkoutLink

      if (!checkoutLink) {
        toast.error('Could not create payment. Try again!')
        setPaying(false)
        return
      }

      await supabase.from('participants').insert([{
        split_id: id,
        name: form.name,
        email: form.email,
        has_paid: false,
        payment_reference: checkoutData.data?.orderReference,
      }])

      window.location.href = checkoutLink

    } catch {
      toast.error('Something went wrong. Please try again!')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#008000', borderTopColor: 'transparent' }} />
          <p className="text-gray-400 text-sm">Loading payment page...</p>
        </div>
      </div>
    )
  }

  if (!split) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <p className="text-gray-400">Split not found.</p>
      </div>
    )
  }

  if (alreadyPaid) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#00800020' }}>
            <CheckCircle size={32} style={{ color: '#008000' }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Already Paid!</h1>
          <p className="text-gray-400 mt-2">You have already paid your share for <strong className="text-white">{split.title}</strong>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">

      {/* Nav */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
        <Wallet style={{ color: '#008000' }} size={20} />
        <span className="font-bold text-white tracking-tight text-lg">PaySplit</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5">

          {/* Header */}
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Payment Request</p>
            <h1 className="text-xl font-bold text-white">{split.title}</h1>
            <p className="text-gray-400 text-sm mt-1">Organized by {split.organizer_name}</p>
          </div>

          {/* Amount Card */}
          <div
            className="rounded-xl p-5 text-center border"
            style={{ backgroundColor: '#00800015', borderColor: '#00800040' }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#008000' }}>Your Share</p>
            <p className="text-4xl font-bold" style={{ color: '#008000' }}>
              ₦{split.amount_per_person.toLocaleString()}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2 mb-1.5 uppercase tracking-wider">
                <User size={12} /> Your Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Ayomide"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2 mb-1.5 uppercase tracking-wider">
                <Mail size={12} /> Your Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="e.g. ayomide@email.com"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>

            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: '#008000' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#006600')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#008000')}
            >
              <CreditCard size={16} />
              {paying ? 'Processing...' : `Pay ₦${split.amount_per_person.toLocaleString()}`}
            </button>

            <p className="text-xs text-center text-gray-600">
              Secured by Nomba 🔒
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage