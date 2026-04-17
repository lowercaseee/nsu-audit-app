const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '..', 'api-history.json');

class HistoryService {
  static load() {
    if (fs.existsSync(HISTORY_FILE)) {
      try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch {}
    }
    return [];
  }

  static save(history) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  }

  static log(endpoint, user, success) {
    const history = this.load();
    history.unshift({ 
      endpoint, 
      user: user || 'anonymous', 
      timestamp: new Date().toISOString(), 
      status: success ? 'success' : 'failed' 
    });
    if (history.length > 100) history.splice(100);
    this.save(history);
  }

  static getAll() {
    return this.load();
  }

  static getByUser(user) {
    const history = this.load();
    return history.filter(h => h.user === user);
  }
}

module.exports = HistoryService;