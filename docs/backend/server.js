// ============================================
// DB Monitor Backend - Express Server
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Database Connection
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected successfully');
  }
});

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// ============================================
// Auth Middleware
// ============================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.id, 'admin']
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// ============================================
// Auth Routes
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, approval_status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, email, name, approval_status, created_at`,
      [email.toLowerCase(), passwordHash, name]
    );

    // Assign default 'user' role
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [result.rows[0].id, 'user']
    );

    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const result = await pool.query(
      `SELECT u.*, ur.role 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check approval status
    if (user.approval_status === 'pending') {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    if (user.approval_status === 'rejected') {
      return res.status(403).json({ error: 'Account access denied' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        approvalStatus: user.approval_status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.approval_status, u.created_at, u.last_login, ur.role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============================================
// User Management Routes (Admin Only)
// ============================================

// List all users
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.approval_status, u.created_at, u.last_login, ur.role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       ORDER BY u.created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Approve user
app.put('/api/users/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET approval_status = 'approved', updated_at = NOW()
       WHERE id = $1 RETURNING id, email, name, approval_status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User approved', user: result.rows[0] });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject user
app.put('/api/users/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET approval_status = 'rejected', updated_at = NOW()
       WHERE id = $1 RETURNING id, email, name, approval_status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User rejected', user: result.rows[0] });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// ============================================
// Database Routes
// ============================================

app.get('/api/databases', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM databases WHERE is_active = true ORDER BY type, short_name'
    );
    res.json({ databases: result.rows });
  } catch (error) {
    console.error('List databases error:', error);
    res.status(500).json({ error: 'Failed to list databases' });
  }
});

// ============================================
// Daily Checks Routes
// ============================================

app.get('/api/daily-checks', authenticateToken, async (req, res) => {
  try {
    const { databaseId, startDate, endDate } = req.query;
    
    let query = `
      SELECT dc.*, d.short_name as database_name, ct.name as check_name
      FROM daily_checks dc
      JOIN databases d ON dc.database_id = d.id
      JOIN check_types ct ON dc.check_type_id = ct.id
      WHERE 1=1
    `;
    const params = [];

    if (databaseId) {
      params.push(databaseId);
      query += ` AND dc.database_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND dc.check_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND dc.check_date <= $${params.length}`;
    }

    query += ' ORDER BY dc.check_date DESC, d.short_name, ct.display_order';

    const result = await pool.query(query, params);
    res.json({ dailyChecks: result.rows });
  } catch (error) {
    console.error('List daily checks error:', error);
    res.status(500).json({ error: 'Failed to list daily checks' });
  }
});

// ============================================
// Weekly Checks Routes
// ============================================

app.get('/api/weekly-checks', authenticateToken, async (req, res) => {
  try {
    const { databaseId, year } = req.query;
    
    let query = `
      SELECT wc.*, d.short_name as database_name
      FROM weekly_checks wc
      JOIN databases d ON wc.database_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (databaseId) {
      params.push(databaseId);
      query += ` AND wc.database_id = $${params.length}`;
    }

    if (year) {
      params.push(year);
      query += ` AND wc.year = $${params.length}`;
    }

    query += ' ORDER BY wc.year DESC, wc.week_number DESC';

    const result = await pool.query(query, params);
    res.json({ weeklyChecks: result.rows });
  } catch (error) {
    console.error('List weekly checks error:', error);
    res.status(500).json({ error: 'Failed to list weekly checks' });
  }
});

// ============================================
// Health Check
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Error Handler
// ============================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`DB Monitor API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
