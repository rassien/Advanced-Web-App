require('dotenv').config();
const { pool } = require('./models/database');

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database schema...\n');
    
    // Check calisanlar table
    const calisanlarResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'calisanlar' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 CALISANLAR table structure:');
    calisanlarResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check subeler table
    const subelerResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'subeler' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🏢 SUBELER table structure:');
    subelerResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if we have PostGIS columns
    const postgisCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('calisanlar', 'subeler') 
      AND data_type = 'USER-DEFINED'
    `);
    
    console.log('\n🗺️ PostGIS columns:');
    if (postgisCheck.rows.length > 0) {
      postgisCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name}`);
      });
    } else {
      console.log('  - No PostGIS geometry columns found, using latitude/longitude');
    }
    
    // Count existing data
    const employeeCount = await client.query('SELECT COUNT(*) FROM calisanlar');
    const branchCount = await client.query('SELECT COUNT(*) FROM subeler');
    const assignmentCount = await client.query('SELECT COUNT(*) FROM atamalar');
    
    console.log('\n📊 Current data:');
    console.log(`  - Employees: ${employeeCount.rows[0].count}`);
    console.log(`  - Branches: ${branchCount.rows[0].count}`);
    console.log(`  - Assignments: ${assignmentCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();