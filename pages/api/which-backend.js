export default function handler(req, res) {
  res.status(200).json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not-set',
    env: process.env.VERCEL_ENV
  });
}
