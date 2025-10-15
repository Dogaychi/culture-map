export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const envClient = process.env.NEXT_PUBLIC_SUPABASE_URL || 'not-set';
  const envServer = process.env.SUPABASE_URL || 'not-set';

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let db = { ok:false, reason:'skipped' };
  try {
    if (url && key) {
      const supabase = createClient(url, key);
      const { count, error } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });
      db = error ? { ok:false, reason:error.message } : { ok:true, approvedCount: count ?? null };
    } else {
      db = { ok:false, reason:'missing url/key' };
    }
  } catch (e) {
    db = { ok:false, reason: e.message };
  }

  return new Response(JSON.stringify({
    envClient, envServer, vercelEnv: process.env.VERCEL_ENV || 'unknown', db
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
