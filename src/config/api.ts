// API Configuration for connecting to local PostgreSQL backend
// Update these values to match your local backend server

export const API_CONFIG = {
  // Base URL for the backend API server
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Enable/disable API connection (set to false to use mock data)
  enabled: import.meta.env.VITE_API_ENABLED === 'true' || false,
};

// Database connection info (for documentation purposes)
// The actual connection is handled by the backend server
export const DATABASE_INFO = {
  host: 'localhost',
  port: 5432,
  database: 'db_monitor',
  user: 'db_monitor_user',
};
