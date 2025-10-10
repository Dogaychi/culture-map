cat > supabase.ts << 'EOF'
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dbpgeyhrvfsitsmxzlyi.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGdleWhydmZzaXRzbXh6bHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODQ1ODcsImV4cCI6MjA3NTQ2MDU4N30.0ebQ9033--HvbqbIO3R83BR2hTwqJJIRXD_zm_rBkrg"
);
EOF
