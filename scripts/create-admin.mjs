import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_KEY (or VITE_ variants).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const email = process.env.ADMIN_EMAIL || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];
const fullName = process.env.ADMIN_FULLNAME || process.argv[4] || 'Admin';
const department = process.env.ADMIN_DEPARTMENT || process.argv[5] || null;

if (!email || !password) {
  console.error('Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/create-admin.mjs');
  console.error('Or: node scripts/create-admin.mjs <email> <password> [Full Name] [Department]');
  process.exit(1);
}

try {
  const signUp = await supabase.auth.signUp({ email, password });
  if (signUp.error) {
    console.error('Auth signUp error:', signUp.error.message || signUp.error);
    process.exit(1);
  }
  const userId = signUp.data?.user?.id;
  if (!userId) {
    console.error('Unable to obtain user id from signup response.');
    process.exit(1);
  }

  const insertPayload = {
    id: userId,
    role: 'admin',
    full_name: fullName,
    department: department,
    password_hash: 'supabase-auth',
    status: 'approved',
    has_voted: false,
  };

  const { error: insertError } = await supabase.from('users').insert(insertPayload);
  if (insertError) {
    console.error('Insert into users failed:', insertError.message || insertError);
    process.exit(1);
  }

  console.log('Admin user created successfully:');
  console.log('  id:', userId);
  console.log('  email:', email);
} catch (err) {
  console.error('Unexpected error:', err);
  process.exit(1);
}
