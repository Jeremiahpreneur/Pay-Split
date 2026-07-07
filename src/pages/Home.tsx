import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Users, DollarSign, User, Mail, FileText, Wallet } from 'lucide-react'

function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    total_amount: '',
    num_participants: '',
    organizer_name: '',
    organizer_email: '',
  })

  const amountPerPerson = form.total_amount && form.num_participants
    ? (Number(form.total_amount) / Number(form.num_participants)).toFixed(2)
    : '0.00'

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.title || !form.total_amount || !form.num_participants || !form.organizer_name || !form.organizer_email) {
      toast.error('Please fill in all fields!')
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('splits')
      .insert([{
        title: form.title,
        total_amount: Number(form.total_amount),
        num_participants: Number(form.num_participants),
        amount_per_person: Number(amountPerPerson),
        organizer_name: form.organizer_name,
        organizer_email: form.organizer_email,
      }])
      .select()
      .single()

    if (error) {
      toast.error('Something went wrong. Try again!')
      setLoading(false)
      return
    }

    toast.success('Split created!')
    navigate(`/dashboard/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">

      {/* Nav */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
        <Wallet style={{ color: '#008000' }} size={20} />
        <span className="font-bold text-white tracking-tight text-lg">PaySplit</span>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-4 pt-12 pb-6 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border"
          style={{ backgroundColor: '#00800015', borderColor: '#00800040', color: '#008000' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: '#008000' }}
          />
          Powered by Nomba
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
          Split bills.<br />
          <span style={{ color: '#008000' }}>Collect instantly.</span>
        </h1>
        <p className="text-gray-400 text-sm max-w-xs">
          Create a split, share one link, and watch payments come in — no more chasing people on WhatsApp.
        </p>
      </div>

      {/* Form Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-400 flex items-center gap-2 mb-1.5 uppercase tracking-wider">
              <FileText size={12} /> Bill Title
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Dinner at Chicken Republic"
              value={form.title}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              style={{ outlineColor: '#008000' }}
            />
          </div>

          {/* Amount + People Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2 mb-1.5 uppercase tracking-wider">
                <DollarSign size={12} /> Amount (₦)
              </label>
              <input
                type="number"
                name="total_amount"
                placeholder="e.g. 20000"
                value={form.total_amount}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2 mb-1.5 uppercase tracking-wider">
                <Users size={12} /> People
              </label>
              <input
                type="number"
                name="num_participants"
                placeholder="e.g. 4"
                value={form.num_participants}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Amount Per Person */}
          {Number(amountPerPerson) > 0 && (
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between border"
              style={{ backgroundColor: '#00800015', borderColor: '#00800040' }}
            >
              <p className="text-xs" style={{ color: '#008000' }}>Each person pays</p>
              <p className="text-lg font-bold" style={{ color: '#008000' }}>
                ₦{Number(amountPerPerson).toLocaleString()}
              </p>
            </div>
          )}

          {/* Name + Email Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2 mb-1.5 uppercase tracking-wider">
                <User size={12} /> Your Name
              </label>
              <input
                type="text"
                name="organizer_name"
                placeholder="e.g. Jeremiah"
                value={form.organizer_name}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2 mb-1.5 uppercase tracking-wider">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                name="organizer_email"
                placeholder="you@email.com"
                value={form.organizer_email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide text-white"
            style={{ backgroundColor: '#008000' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#006600')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#008000')}
          >
            {loading ? 'Creating...' : 'Create Split →'}
          </button>

          <p className="text-xs text-center text-gray-600">
            Payments secured by Nomba 🔒
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home