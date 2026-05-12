// Database test script
// Run with: node scripts/test-db.js

require('dotenv').config();

async function testDatabase() {
  console.log('🔍 Testing Aylnor.ai Database Setup...\n');
  
  // Check environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY_1',
    'GROK_API_KEY_1'
  ];
  
  console.log('📋 Environment Variables:');
  let envOk = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    console.log(`  ${varName}: ${status}`);
    if (!value) envOk = false;
  });
  
  if (!envOk) {
    console.log('\n❌ Missing environment variables. Please check your .env.local file.');
    return false;
  }
  
  // Test database connection
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('\n🔗 Testing Database Connection:');
    const { data, error } = await supabase.from('users').select('count').single();
    
    if (error) {
      console.log(`  ❌ Connection failed: ${error.message}`);
      return false;
    }
    
    console.log('  ✅ Database connected successfully');
    
    // Test tables
    console.log('\n📊 Testing Tables:');
    const tables = ['users', 'chat_sessions', 'chat_messages', 'ai_usage'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').single();
      const status = error ? '❌' : '✅';
      console.log(`  ${table}: ${status}`);
      if (error) console.log(`    Error: ${error.message}`);
    }
    
    console.log('\n🎉 Database setup test completed!');
    return true;
    
  } catch (err) {
    console.log(`\n❌ Test failed: ${err.message}`);
    return false;
  }
}

testDatabase();
