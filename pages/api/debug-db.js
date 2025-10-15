import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const envClient = process.env.NEXT_PUBLIC_SUPABASE_URL || 'not-set';
  const envServer = process.env.SUPABASE_URL || 'not-set';

  // try server-side client with either set of vars
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let db = { ok:false, reason:'skipped' };
  try {
    if (url && key) {
      const supabase = createClient(url, key);
      // try to read approved submissions count (public policy usually allows)
      const { count, error } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });
      db = error ? { ok:false, reason:error.message } : { ok:true, approvedCount: count };
    } else {
      db = { ok:false, reason:'missing url/key' };
    }
  } catch (e) {
    db = { ok:false, reason: e.message };
  }

  res.status(200).json({
    envClient,    // NEXT_PUBLIC_SUPABASE_URL
    envServer,    // SUPABASE_URL
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    db,
  });
}
