const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qbkixxkmezbzfjrfongv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFia2l4eGttZXpiemZqcmZvbmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODg4NzgsImV4cCI6MjA5Mjk2NDg3OH0.x03T52MiKj2EAHNGcrSycgegIPOkUJOUL7lczwlfyXQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("=== SELECT ALL USUARIOS ===");
  const { data, error } = await supabase
    .from('usuarios')
    .select('*');
  if (error) console.error("Select usuarios error:", error);
  else console.log("Usuarios:", data);
}

test();
