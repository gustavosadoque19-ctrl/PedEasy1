import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios. ` +
    `SUPABASE_URL=${supabaseUrl ? 'definido' : 'indefinido'}, ` +
    `SUPABASE_ANON_KEY=${supabaseKey ? 'definido' : 'indefinido'}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
