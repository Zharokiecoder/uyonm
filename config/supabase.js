const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️ Missing Supabase credentials. Please check your .env file.');
}

// Public client (for user operations)
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Admin client (for server-side operations with elevated privileges)
const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || supabaseAnonKey || '');

module.exports = { supabase, supabaseAdmin };
