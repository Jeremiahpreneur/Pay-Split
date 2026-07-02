# PaySplit 💸

> Split any bill with anyone in Nigeria — create a group payment, share a link, and collect everyone's share instantly via Nomba.

## 🚀 What is PaySplit?

PaySplit is a group bill-splitting web app built for the DevCareer x Nomba Hackathon 2026. It lets an organizer create a bill split, share a unique payment link with participants, and track who has paid in real time — all powered by Nomba's payment API.

## 🔥 Features

- Create a bill split in seconds
- Auto-calculates each person's share
- Shareable payment link for participants
- Real-time dashboard showing paid vs pending
- Secure payments via Nomba Checkout
- Duplicate payment detection

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Realtime)
- **Payments:** Nomba Collections API
- **Hosting:** Vercel

## 📦 Getting Started

1. Clone the repository
```bash
   git clone https://github.com/YOUR_USERNAME/paysplit.git
   cd paysplit
```

2. Install dependencies
```bash
   npm install
```

3. Create a `.env` file and add your credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_NOMBA_CLIENT_ID=your_nomba_client_id
VITE_NOMBA_CLIENT_SECRET=your_nomba_client_secret
VITE_NOMBA_ACCOUNT_ID=your_nomba_account_id

4. Start the development server
```bash
   npm run dev
```

## 👨‍💻 Built By

**Jeremiah Albert** — Computer science student at University of Lagos  
DevCareer x Nomba Hackathon 2026 | Team Cooke