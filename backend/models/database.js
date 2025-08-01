const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'calisan_sube_db',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection timeout settings
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    
    // Test PostGIS extension (optional)
    try {
      const result = await client.query('SELECT PostGIS_Version()');
      console.log('✅ PostGIS extension available:', result.rows[0].postgis_version);
    } catch (postgisError) {
      console.log('⚠️ PostGIS not available, will install during table creation');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize database tables
const initializeTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Try to enable PostGIS extension
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
      console.log('✅ PostGIS extension enabled');
    } catch (postgisError) {
      console.log('⚠️ PostGIS extension not available, using basic tables');
    }
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create branches table (subeler) - with fallback for non-PostGIS
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS subeler (
          id SERIAL PRIMARY KEY,
          ad VARCHAR(255) NOT NULL,
          adres TEXT NOT NULL,
          konum GEOMETRY(POINT, 4326),
          norm_kadro INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.log('⚠️ Creating subeler table without PostGIS geometry');
      await client.query(`
        CREATE TABLE IF NOT EXISTS subeler (
          id SERIAL PRIMARY KEY,
          ad VARCHAR(255) NOT NULL,
          adres TEXT NOT NULL,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          norm_kadro INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Create employees table (calisanlar) - with fallback for non-PostGIS
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS calisanlar (
          id SERIAL PRIMARY KEY,
          ad VARCHAR(255) NOT NULL,
          soyad VARCHAR(255) NOT NULL,
          tckn VARCHAR(11) UNIQUE,
          acik_adres TEXT NOT NULL,
          konum GEOMETRY(POINT, 4326),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.log('⚠️ Creating calisanlar table without PostGIS geometry');
      await client.query(`
        CREATE TABLE IF NOT EXISTS calisanlar (
          id SERIAL PRIMARY KEY,
          ad VARCHAR(255) NOT NULL,
          soyad VARCHAR(255) NOT NULL,
          tckn VARCHAR(11) UNIQUE,
          acik_adres TEXT NOT NULL,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Create assignments table (atamalar)
    await client.query(`
      CREATE TABLE IF NOT EXISTS atamalar (
        id SERIAL PRIMARY KEY,
        calisan_id INTEGER REFERENCES calisanlar(id) ON DELETE CASCADE,
        sube_id INTEGER REFERENCES subeler(id) ON DELETE CASCADE,
        mesafe DECIMAL(10,2),
        sure INTEGER,
        atama_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(calisan_id, sube_id)
      )
    `);
    
    // Create indexes for better performance
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_subeler_konum ON subeler USING GIST (konum)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_calisanlar_konum ON calisanlar USING GIST (konum)');
    } catch (error) {
      console.log('⚠️ Creating basic indexes instead of spatial indexes');
      await client.query('CREATE INDEX IF NOT EXISTS idx_subeler_lat_lng ON subeler(latitude, longitude)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_calisanlar_lat_lng ON calisanlar(latitude, longitude)');
    }
    await client.query('CREATE INDEX IF NOT EXISTS idx_calisanlar_tckn ON calisanlar(tckn)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_atamalar_calisan ON atamalar(calisan_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_atamalar_sube ON atamalar(sube_id)');
    
    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Function to get nearest branches using PostGIS
const getNearestBranches = async (employeeId, limit = 5) => {
  const query = `
    SELECT 
      s.id,
      s.ad,
      s.adres,
      s.norm_kadro,
      ST_Distance(
        ST_Transform(c.konum, 3857),
        ST_Transform(s.konum, 3857)
      ) / 1000 AS distance_km,
      ST_X(s.konum) as longitude,
      ST_Y(s.konum) as latitude
    FROM subeler s
    CROSS JOIN calisanlar c
    WHERE c.id = $1 
      AND s.konum IS NOT NULL 
      AND c.konum IS NOT NULL
      AND s.norm_kadro > 0
    ORDER BY ST_Distance(c.konum, s.konum)
    LIMIT $2
  `;
  
  const result = await pool.query(query, [employeeId, limit]);
  return result.rows;
};

module.exports = {
  pool,
  testConnection,
  initializeTables,
  getNearestBranches
};