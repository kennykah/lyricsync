const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// load .env.local manually
const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const match = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const matchKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = match ? match[1].trim() : process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = matchKey ? matchKey[1].trim() : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using URL:', url);
console.log('Anon key length:', key ? key.length : 'none');

const supabase = createClient(url, key);

(async () => {
  try {
    const email = `node-test-${Date.now()}@example.com`;
    console.log('Attempting signup for', email);
    const { data, error } = await supabase.auth.signUp({ email, password: 'Password123!' });
    console.log('Response data:', data);
    console.log('Response error:', error);
  } catch (err) {
    console.error('Exception:', err);
  }
})();
