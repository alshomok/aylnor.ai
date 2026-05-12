import { supabase } from './supabase';

// Test database connection
export async function testDatabaseConnection() {
  try {
    if (!supabase) {
      console.log('❌ Supabase client not initialized');
      return false;
    }

    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').single();
    
    if (error) {
      console.log('❌ Database connection error:', error.message);
      return false;
    }
    
    console.log('✅ Database connected successfully');
    return true;
  } catch (err) {
    console.log('❌ Database test failed:', err);
    return false;
  }
}

// Test table creation
export async function testTables() {
  if (!supabase) return false;
  
  const tables = ['users', 'chat_sessions', 'chat_messages', 'ai_usage'];
  const results = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').single();
      results.push({
        table,
        status: error ? '❌ Error' : '✅ OK',
        error: error?.message
      });
    } catch (err) {
      results.push({
        table,
        status: '❌ Error',
        error: (err as Error).message
      });
    }
  }
  
  console.log('📊 Table Status:');
  results.forEach(result => {
    console.log(`  ${result.table}: ${result.status}`);
    if (result.error) console.log(`    Error: ${result.error}`);
  });
  
  return results.every(r => r.status.includes('✅'));
}

// Test RLS policies
export async function testRLS() {
  if (!supabase) return false;
  
  try {
    // This should fail without authentication
    const { data, error } = await supabase.from('users').select('*');
    
    if (error && error.message.includes('row-level security')) {
      console.log('✅ RLS policies are working');
      return true;
    }
    
    console.log('⚠️ RLS policies might not be configured correctly');
    return false;
  } catch (err) {
    console.log('❌ RLS test failed:', err);
    return false;
  }
}
