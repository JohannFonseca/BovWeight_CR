const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qbkixxkmezbzfjrfongv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFia2l4eGttZXpiemZqcmZvbmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODg4NzgsImV4cCI6MjA5Mjk2NDg3OH0.x03T52MiKj2EAHNGcrSycgegIPOkUJOUL7lczwlfyXQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("=== FINCAS ===");
  const { data: fincas, error: fincasError } = await supabase.from('fincas').select('*').limit(1);
  if (fincasError) console.error("Error fincas:", fincasError.message);
  else console.log("Fincas row:", fincas[0] ? fincas[0] : "No rows");

  console.log("=== ANIMALES ===");
  const { data: animales, error: animalesError } = await supabase.from('animales').select('*').limit(1);
  if (animalesError) console.error("Error animales:", animalesError.message);
  else console.log("Animales row:", animales[0] ? animales[0] : "No rows");

  console.log("=== RAZAS ===");
  const { data: razas, error: razasError } = await supabase.from('razas').select('*').limit(1);
  if (razasError) console.error("Error razas:", razasError.message);
  else console.log("Razas row:", razas[0] ? razas[0] : "No rows");
}

test();
