require('dotenv').config();
const { Pool } = require('pg');

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: 'postgres', // Connect to default postgres database first
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''), // Ensure it's a string
  ssl: false,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log('\n🔄 Testing connection...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Check if our database exists
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname='calisan_sube_db'");
    if (result.rows.length > 0) {
      console.log('✅ Database calisan_sube_db exists');
    } else {
      console.log('❌ Database calisan_sube_db does not exist, creating...');
      await client.query('CREATE DATABASE calisan_sube_db');
      console.log('✅ Database calisan_sube_db created');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();