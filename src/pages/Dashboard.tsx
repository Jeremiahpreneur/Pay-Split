import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Copy, CheckCircle, Clock, Users } from 'lucide-react'
import type { Split, Participant } from '../types'

function Dashboard() {
  const { id } = useParams()
  const [split, setSplit] = useState<Split | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  const paymentLink = `${window.location.origin}/split/${id}`

  function copyLink() {
    navigator.clipboard.writeText(paymentLink)
    toast.success('Link copied!')
  }

  const fetchData = useCallback(async () => {
    const { data: splitData } = await supabase
      .from('splits')
      .select('*')
      .eq('id', id)
      .single()

    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('split_id', id)
      .order('created_at', { ascending: true })

    if (splitData) setSplit(splitData)
    if (participantsData) setParticipants(participantsData)
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()

    const channel = supabase
      .channel('participants')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `split_id=eq.${id}`
      }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, fetchData])

  const paidCount = participants.filter(p => p.has_paid).length
  const unpaidCount = participants.filter(p => !p.has_paid).length
  const totalCollected = paidCount * (split?.amount_per_person || 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-6">

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800">{split.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Organized by {split.organizer_name}</p>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-gray-800">₦{split.total_amount.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Per Person</p>
              <p className="font-bold text-green-600">₦{split.amount_per_person.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Collected</p>
              <p className="font-bold text-blue-600">₦{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users size={18} /> Share Payment Link
          </h2>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-sm text-gray-600 flex-1 truncate">{paymentLink}</p>
            <button onClick={copyLink} className="text-green-600 hover:text-green-700 shrink-0">
              <Copy size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Share this link with everyone who needs to pay</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <CheckCircle className="text-green-600 mx-auto mb-1" size={24} />
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-xs text-green-700">Paid</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
            <Clock className="text-orange-500 mx-auto mb-1" size={24} />
            <p className="text-2xl font-bold text-orange-500">{unpaidCount}</p>
            <p className="text-xs text-orange-700">Pending</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Participants</h2>
          {participants.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              No payments yet. Share the link above! 🔗
            </p>
          ) : (
            <div className="space-y-3">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </div>
                  {p.has_paid ? (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} /> Paid
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashboard