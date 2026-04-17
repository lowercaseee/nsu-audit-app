const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const BASE_DIR = path.join(__dirname, '..');
const USERS_FILE = path.join(BASE_DIR, 'users.json');
const API_KEYS_FILE = path.join(BASE_DIR, 'api-keys.json');
const JWT_SECRET = process.env.JWT_SECRET || 'nsu-audit-jwt-secret-2024';

class AuthService {
  static loadUsers() {
    if (fs.existsSync(USERS_FILE)) {
      try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch {}
    }
    return [];
  }

  static saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }

  static loadApiKeys() {
    if (fs.existsSync(API_KEYS_FILE)) {
      try { return JSON.parse(fs.readFileSync(API_KEYS_FILE, 'utf8')); } catch {}
    }
    return [];
  }

  static saveApiKeys(keys) {
    fs.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2));
  }

  static findOrCreate(googleUser) {
    let users = this.loadUsers();
    let user = users.find(u => u.email === googleUser.email);
    if (!user) {
      user = { id: crypto.randomUUID(), ...googleUser, createdAt: new Date().toISOString() };
      users.push(user);
    } else {
      user = { ...user, ...googleUser, lastLogin: new Date().toISOString() };
    }
    this.saveUsers(users);
    return user;
  }

  static generateToken(user) {
    return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token) {
    try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
  }

  static generateApiKey(name = 'CLI') {
    const keys = this.loadApiKeys();
    const newKey = { key: crypto.randomBytes(32).toString('hex'), name, created: new Date().toISOString(), active: true };
    keys.push(newKey);
    this.saveApiKeys(keys);
    return newKey;
  }

  static validateApiKey(apiKey) {
    const keys = this.loadApiKeys();
    return keys.find(k => k.key === apiKey && k.active);
  }
}

module.exports = AuthService;