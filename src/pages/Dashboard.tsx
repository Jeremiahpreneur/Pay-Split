import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Copy, CheckCircle, Clock, ArrowLeft, Wallet } from 'lucide-react'
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
  const progressPercent = split ? (paidCount / split.num_participants) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
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

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">

      {/* Top Nav */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Wallet className="text-green-400" size={20} />
          <span className="font-bold text-white tracking-tight">PaySplit</span>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={14} /> New Split
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Hero Card */}
        <div className="bg-linear-to-br from-green-500/20 to-emerald-600/10 border border-green-500/20 rounded-2xl p-6">
          <p className="text-green-400 text-xs font-medium uppercase tracking-widest mb-1">Active Split</p>
          <h1 className="text-2xl font-bold text-white mb-1">{split.title}</h1>
          <p className="text-gray-400 text-sm">Organized by {split.organizer_name}</p>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{paidCount} of {split.num_participants} paid</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Bill</p>
              <p className="font-bold text-white text-sm">₦{split.total_amount.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Per Person</p>
              <p className="font-bold text-green-400 text-sm">₦{split.amount_per_person.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Collected</p>
              <p className="font-bold text-white text-sm">₦{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Payment Link</p>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-sm text-gray-300 flex-1 truncate">{paymentLink}</p>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Share this link with everyone who needs to pay</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="text-green-400" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{paidCount}</p>
              <p className="text-xs text-gray-400">Paid</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <Clock className="text-orange-400" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{unpaidCount}</p>
              <p className="text-xs text-gray-400">Pending</p>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Participants</p>

          {participants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No payments yet.</p>
              <p className="text-gray-600 text-xs mt-1">Share the link above to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.email}</p>
                    </div>
                  </div>
                  {p.has_paid ? (
                    <span className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
                      <CheckCircle size={10} /> Paid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1 rounded-full">
                      <Clock size={10} /> Pending
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