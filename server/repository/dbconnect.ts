import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USERNAME || '3NQ7BdWo4atCyZj.root',
  password: process.env.DB_PASSWORD || 'KkJ21lQQvI0TG00S',
  database: process.env.DB_DATABASE || 'test',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

let initialized = false

// ฟังก์ชันสร้างและตรวจสอบการเชื่อมต่อฐานข้อมูลกลาง (ตามแนวทาง repository/dbconnect)
export async function NewDbConnection(): Promise<mysql.Pool> {
  if (!initialized) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS urls (
          id INT AUTO_INCREMENT PRIMARY KEY,
          original_url TEXT NOT NULL,
          short_code VARCHAR(50) NOT NULL UNIQUE,
          title VARCHAR(255),
          click_count INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NULL,
          INDEX idx_short_code (short_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `)

      await pool.query(`
        CREATE TABLE IF NOT EXISTS click_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          url_id INT NOT NULL,
          ip_address VARCHAR(100),
          user_agent TEXT,
          referer TEXT,
          clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_url_id (url_id),
          FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `)

      initialized = true
      console.log('Database connected & tables initialized successfully')
    } catch (err) {
      console.error('Error connecting to database:', err)
    }
  }
  return pool
}
