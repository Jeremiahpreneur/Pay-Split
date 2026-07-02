import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Users, DollarSign, User, Mail, FileText } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">PaySplit 💸</h1>
          <p className="text-gray-500 mt-2">Split any bill. Share the link. Get paid.</p>
        </div>

        {/* Form */}
        <div className="space-y-4">

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
              <FileText size={16} /> Bill Title
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Dinner at Chicken Republic"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Total Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
              <DollarSign size={16} /> Total Amount (₦)
            </label>
            <input
              type="number"
              name="total_amount"
              placeholder="e.g. 20000"
              value={form.total_amount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Number of Participants */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
              <Users size={16} /> Number of People
            </label>
            <input
              type="number"
              name="num_participants"
              placeholder="e.g. 4"
              value={form.num_participants}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Amount Per Person */}
          {Number(amountPerPerson) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
              <p className="text-sm text-green-700 font-medium">
                Each person pays: <span className="text-lg font-bold">₦{Number(amountPerPerson).toLocaleString()}</span>
              </p>
            </div>
          )}

          {/* Organizer Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
              <User size={16} /> Your Name
            </label>
            <input
              type="text"
              name="organizer_name"
              placeholder="e.g. Jeremiah"
              value={form.organizer_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Organizer Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
              <Mail size={16} /> Your Email
            </label>
            <input
              type="email"
              name="organizer_email"
              placeholder="e.g. jeremiah@email.com"
              value={form.organizer_email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Split...' : 'Create Split 🚀'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default Home