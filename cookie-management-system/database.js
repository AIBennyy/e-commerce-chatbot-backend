/**
 * Database module for cookie management system
 * Handles storage and retrieval of cookies
 */
const sqlite3 = require('sqlite3').verbose();
const CryptoJS = require('crypto-js');
const config = require('./config');
const { promisify } = require('util');

class Database {
  constructor() {
    this.db = new sqlite3.Database(config.database.path);
    this.initializeDatabase();
  }

  /**
   * Initialize the database with required tables
   */
  async initializeDatabase() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create cookies table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS cookies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            cookie_string TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
          )
        `, (err) => {
          if (err) {
            console.error('Error creating cookies table:', err);
            reject(err);
          } else {
            console.log('Database initialized successfully');
            resolve();
          }
        });
      });
    });
  }

  /**
   * Encrypt sensitive data before storing
   * @param {string} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  encrypt(data) {
    return CryptoJS.AES.encrypt(data, config.encryption.secret).toString();
  }

  /**
   * Decrypt data retrieved from storage
   * @param {string} encryptedData - Encrypted data
   * @returns {string} - Decrypted data
   */
  decrypt(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, config.encryption.secret);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Store cookies for a specific platform
   * @param {string} platform - Platform identifier (e.g., 'motonet')
   * @param {string} cookieString - Cookie string to store
   * @param {number} expiresIn - Time in milliseconds until cookies expire
   * @returns {Promise<number>} - ID of the stored cookie entry
   */
  async storeCookies(platform, cookieString, expiresIn) {
    const encryptedCookies = this.encrypt(cookieString);
    const now = Date.now();
    const expiresAt = now + expiresIn;

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO cookies (platform, cookie_string, created_at, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [platform, encryptedCookies, now, expiresAt],
        function(err) {
          if (err) {
            console.error(`Error storing cookies for ${platform}:`, err);
            reject(err);
          } else {
            console.log(`Cookies stored for ${platform} with ID ${this.lastID}`);
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Get the latest valid cookies for a specific platform
   * @param {string} platform - Platform identifier (e.g., 'motonet')
   * @returns {Promise<Object|null>} - Cookie data or null if not found
   */
  async getLatestCookies(platform) {
    const now = Date.now();

    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id, cookie_string, created_at, expires_at 
         FROM cookies 
         WHERE platform = ? AND expires_at > ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [platform, now],
        (err, row) => {
          if (err) {
            console.error(`Error retrieving cookies for ${platform}:`, err);
            reject(err);
          } else if (!row) {
            console.log(`No valid cookies found for ${platform}`);
            resolve(null);
          } else {
            console.log(`Retrieved cookies for ${platform} with ID ${row.id}`);
            try {
              const decryptedCookies = this.decrypt(row.cookie_string);
              resolve({
                id: row.id,
                cookieString: decryptedCookies,
                createdAt: row.created_at,
                expiresAt: row.expires_at
              });
            } catch (decryptError) {
              console.error(`Error decrypting cookies for ${platform}:`, decryptError);
              reject(decryptError);
            }
          }
        }
      );
    });
  }

  /**
   * Delete expired cookies to keep the database clean
   * @returns {Promise<number>} - Number of deleted entries
   */
  async cleanupExpiredCookies() {
    const now = Date.now();

    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM cookies WHERE expires_at < ?`,
        [now],
        function(err) {
          if (err) {
            console.error('Error cleaning up expired cookies:', err);
            reject(err);
          } else {
            console.log(`Cleaned up ${this.changes} expired cookie entries`);
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * Close the database connection
   */
  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = new Database();
