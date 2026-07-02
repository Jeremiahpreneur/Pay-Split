export type Split = {
  id: string
  title: string
  total_amount: number
  num_participants: number
  amount_per_person: number
  organizer_name: string
  organizer_email: string
  created_at: string
}

export type Participant = {
  id: string
  split_id: string
  name: string
  email: string
  has_paid: boolean
  payment_reference: string | null
  paid_at: string | null
  created_at: string
}