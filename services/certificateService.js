const fs = require('fs');
const path = require('path');

const CERTS_DIR = path.join(__dirname, '..', 'certificates');

class CertificateService {
  static ensureDir() {
    if (!fs.existsSync(CERTS_DIR)) {
      fs.mkdirSync(CERTS_DIR, { recursive: true });
    }
  }

  static save(user, pdfBuffer, studentName) {
    this.ensureDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cert_${user.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
    const filepath = path.join(CERTS_DIR, filename);
    fs.writeFileSync(filepath, pdfBuffer);
    return { filename, path: filepath, timestamp };
  }

  static getByUser(user) {
    this.ensureDir();
    const files = fs.readdirSync(CERTS_DIR).filter(f => f.startsWith(`cert_${user.replace(/[^a-zA-Z0-9]/g, '_')}`) && f.endsWith('.pdf'));
    return files.map(f => {
      const filepath = path.join(CERTS_DIR, f);
      const stats = fs.statSync(filepath);
      return {
        filename: f,
        timestamp: stats.mtime.toISOString(),
        size: stats.size
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static getFile(filename) {
    const filepath = path.join(CERTS_DIR, filename);
    if (fs.existsSync(filepath)) {
      return fs.readFileSync(filepath);
    }
    return null;
  }
}

module.exports = CertificateService;