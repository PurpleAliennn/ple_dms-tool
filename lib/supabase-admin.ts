import { createClient } from '@supabase/supabase-js';

// This file should ONLY be imported in Server Actions or API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Keep this secret!
);