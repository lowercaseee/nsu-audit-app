const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const GOOGLE_CLIENT_ID = '871051854278-tgov2na9jbu53n5680n9e3qpdlvh338b.apps.googleusercontent.com';

let storedToken = null;
let storedUser = null;

function apiCall(endpoint, method, data, auth) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth?.apiKey) headers['x-api-key'] = auth.apiKey;
    
    const opts = { hostname: 'localhost', port: 5000, path: endpoint, method, headers };
    if (body) { headers['Content-Length'] = Buffer.byteLength(body); }
    
    const req = http.request(opts, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(response) }); }
        catch { resolve({ status: res.statusCode, body: response }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ============================================================
// Google OAuth2 Device Authorization Grant (RFC 8628)
// ============================================================

async function requestDeviceCode() {
  console.log('\n🔐 Requesting device code from Google...');
  
  const postData = JSON.stringify({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'openid email profile https://www.googleapis.com/auth/userinfo.email'
  });
  
  const options = {
    hostname: 'oauth2.googleapis.com',
    port: 443,
    path: '/device/code',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse device code response'));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function pollForToken(deviceCode) {
  console.log('\n📱 Please visit:', deviceCode.verification_url);
  console.log('🔑 Enter this code:', deviceCode.user_code);
  console.log('\n⏳ Waiting for authorization...\n');
  
  const postData = JSON.stringify({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: 'GOCSPX-K9eQ2eG3WjV7xH9kM4nL2pQ6rT0',
    device_code: deviceCode.device_code,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
  });
  
  const options = {
    hostname: 'oauth2.googleapis.com',
    port: 443,
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  // Poll every 5 seconds for up to 180 seconds (Google's default)
  const maxAttempts = 36;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: {} });
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    if (result.data.access_token) {
      return result.data;
    }
    
    if (result.data.error) {
      if (result.data.error === 'authorization_pending') {
        process.stdout.write('.');
        continue;
      }
      if (result.data.error === 'slow_down') {
        console.log('\n⏸️  Slowing down polling...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      if (result.data.error === 'expired_token') {
        throw new Error('Authorization timed out. Please try again.');
      }
      if (result.data.error === 'access_denied') {
        throw new Error('Authorization denied by user.');
      }
      throw new Error(`OAuth error: ${result.data.error}`);
    }
  }
  
  throw new Error('Authorization timed out. Please try again.');
}

async function getUserInfo(accessToken) {
  const options = {
    hostname: 'www.googleapis.com',
    port: 443,
    path: '/oauth2/v2/userinfo',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Main login function using Device Flow
async function googleDeviceLogin() {
  try {
    // Step 1: Get device code
    const deviceCode = await requestDeviceCode();
    
    if (deviceCode.error) {
      console.error('❌ Error requesting device code:', deviceCode.error);
      return false;
    }
    
    // Step 2: Poll for token
    const tokenResponse = await pollForToken(deviceCode);
    
    console.log('\n✅ Authorization successful!\n');
    
    // Step 3: Get user info
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    console.log('👤 User:', userInfo.name || userInfo.email);
    console.log('📧 Email:', userInfo.email);
    
    // Step 4: Send to our server for validation
    try {
      const result = await apiCall('/auth/cli-login', 'POST', { 
        access_token: tokenResponse.access_token 
      });
      
      if (result.status === 200) {
        storedToken = result.body.token;
        storedUser = result.body.user;
        console.log('✅ Logged into NSU Audit System!');
        return true;
      } else {
        console.error('❌ Server error:', result.body.error);
        return false;
      }
    } catch (e) {
      console.error('❌ Could not connect to server. Make sure server is running.');
      console.log('\n💡 To start server: node server.js');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Login failed:', error.message);
    return false;
  }
}

// Upload image
async function uploadImage(imagePath) {
  if (!storedToken) {
    console.error('❌ Please login first: node cli.js login');
    return;
  }
  
  if (!fs.existsSync(imagePath)) {
    console.error('❌ File not found:', imagePath);
    return;
  }
  
  console.log('📤 Uploading:', imagePath);
  
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const mimeType = path.extname(imagePath).toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
  
  const result = await apiCall('/process-transcript', 'POST', { 
    image: `data:${mimeType};base64,${base64}` 
  }, { token: storedToken });
  
  if (result.status === 200) {
    displayResult(result.body);
  } else {
    console.error('❌ Error:', result.body.error);
  }
}

// Display results
function displayResult(data) {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║         NSU AUDIT RESULT                      ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║ Student: ' + (data.student?.name || 'N/A').padEnd(30) + '║');
  console.log('║ ID:      ' + (data.student?.id || 'N/A').padEnd(30) + '║');
  console.log('║ Status:  ' + (data.result || 'N/A').padEnd(30) + '║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║ Level 1: Credits                                ║');
  console.log('║   Total Credits: ' + String(data.audit?.level1?.totalCredits || 0).padEnd(22) + '║');
  console.log('║   Valid Courses: ' + String(data.audit?.level1?.valid || 0).padEnd(22) + '║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║ Level 2: CGPA                                   ║');
  console.log('║   CGPA:       ' + String(data.audit?.level2?.cgpa || 0).padEnd(22) + '║');
  console.log('║   Credits:   ' + String(data.audit?.level2?.credits || 0).padEnd(22) + '║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║ Level 3: Eligibility                           ║');
  console.log('║   Eligible:   ' + String(data.audit?.level3?.eligible ? 'YES' : 'NO').padEnd(22) + '║');
  console.log('║   Deficit:    ' + String(data.audit?.level3?.creditDeficit || 0).padEnd(22) + '║');
  console.log('╚════════════════════════════════════════════════╝\n');
}

// Run tests
async function runTests() {
  console.log('\n🧪 Running 3-Level Audit Tests...\n');
  
  const tests = [
    {
      name: 'TEST 1: VALID GRADUATE',
      description: '40 courses, 122 credits, CGPA 3.43 - Should PASS',
      courses: [
        { code: 'ACT201', grade: 'A-', credits: 3, semester: 'Spring 2007' },
        { code: 'ENG102', grade: 'B+', credits: 3, semester: 'Spring 2007' },
        { code: 'MIS101', grade: 'B+', credits: 3, semester: 'Spring 2007' },
        { code: 'ACT201', grade: 'A-', credits: 3, semester: 'Summer 2007' },
        { code: 'BUS101', grade: 'A-', credits: 3, semester: 'Summer 2007' },
        { code: 'MIS201', grade: 'A', credits: 3, semester: 'Summer 2007' },
        { code: 'ACT202', grade: 'B-', credits: 3, semester: 'Fall 2007' },
        { code: 'MGT210', grade: 'A', credits: 3, semester: 'Fall 2007' },
        { code: 'ECO172', grade: 'B+', credits: 3, semester: 'Spring 2008' },
        { code: 'ENG103', grade: 'A+', credits: 3, semester: 'Spring 2008' },
        { code: 'MKT202', grade: 'A-', credits: 3, semester: 'Spring 2008' },
        { code: 'ECO164', grade: 'B+', credits: 3, semester: 'Fall 2008' },
        { code: 'ECO134', grade: 'B+', credits: 3, semester: 'Fall 2008' },
        { code: 'ECO173', grade: 'B-', credits: 3, semester: 'Fall 2008' },
        { code: 'FIN254', grade: 'B+', credits: 3, semester: 'Fall 2008' },
        { code: 'LAW200', grade: 'B', credits: 3, semester: 'Fall 2008' },
        { code: 'ACT330', grade: 'C', credits: 3, semester: 'Fall 2009' },
        { code: 'BUS251', grade: 'B-', credits: 3, semester: 'Fall 2009' },
        { code: 'FIN433', grade: 'B+', credits: 3, semester: 'Fall 2009' },
        { code: 'BIO103', grade: 'A', credits: 3, semester: 'Spring 2010' },
        { code: 'BUS401', grade: 'B', credits: 3, semester: 'Spring 2010' },
        { code: 'FIN435', grade: 'B+', credits: 3, semester: 'Spring 2010' },
        { code: 'MGT314', grade: 'B', credits: 3, semester: 'Spring 2010' },
        { code: 'ENG105', grade: 'B+', credits: 3, semester: 'Summer 2010' },
        { code: 'FIN599A', grade: 'A', credits: 3, semester: 'Summer 2010' },
        { code: 'ACT322', grade: 'A', credits: 3, semester: 'Fall 2010' },
        { code: 'BUS498', grade: 'B+', credits: 4, semester: 'Spring 2011' },
        { code: 'MGT101', grade: 'A-', credits: 3, semester: 'Spring 2007' },
        { code: 'ECO101', grade: 'B+', credits: 3, semester: 'Fall 2007' },
        { code: 'MKT101', grade: 'B', credits: 3, semester: 'Spring 2008' },
        { code: 'LAW101', grade: 'B+', credits: 3, semester: 'Summer 2008' },
        { code: 'FIN101', grade: 'A', credits: 3, semester: 'Fall 2008' },
        { code: 'ACT101', grade: 'A-', credits: 3, semester: 'Spring 2009' },
        { code: 'BUS301', grade: 'B+', credits: 3, semester: 'Fall 2009' },
        { code: 'MGT401', grade: 'A', credits: 3, semester: 'Spring 2010' },
        { code: 'FIN501', grade: 'B+', credits: 3, semester: 'Summer 2010' },
        { code: 'ECO301', grade: 'B', credits: 3, semester: 'Fall 2010' },
        { code: 'MKT301', grade: 'A-', credits: 3, semester: 'Spring 2011' },
        { code: 'BUS399', grade: 'A', credits: 4, semester: 'Summer 2011' },
        { code: 'FIN599B', grade: 'A', credits: 3, semester: 'Fall 2011' }
      ]
    },
    {
      name: 'TEST 2: CREDIT DEFICIT',
      description: '20 courses, 60 credits, CGPA 3.0 - Should FAIL (deficit)',
      courses: [
        { code: 'ACT201', grade: 'A', credits: 3, semester: 'Spring 2007' },
        { code: 'ENG102', grade: 'B+', credits: 3, semester: 'Spring 2007' },
        { code: 'MIS101', grade: 'B', credits: 3, semester: 'Spring 2007' },
        { code: 'ACT202', grade: 'A-', credits: 3, semester: 'Summer 2007' },
        { code: 'BUS101', grade: 'B+', credits: 3, semester: 'Summer 2007' },
        { code: 'MGT210', grade: 'A', credits: 3, semester: 'Fall 2007' },
        { code: 'ECO172', grade: 'B', credits: 3, semester: 'Spring 2008' },
        { code: 'ENG103', grade: 'A-', credits: 3, semester: 'Spring 2008' },
        { code: 'MKT202', grade: 'B+', credits: 3, semester: 'Spring 2008' },
        { code: 'ECO164', grade: 'B', credits: 3, semester: 'Fall 2008' },
        { code: 'FIN254', grade: 'A', credits: 3, semester: 'Fall 2008' },
        { code: 'LAW200', grade: 'B+', credits: 3, semester: 'Fall 2008' },
        { code: 'ACT330', grade: 'B-', credits: 3, semester: 'Fall 2009' },
        { code: 'FIN433', grade: 'A', credits: 3, semester: 'Fall 2009' },
        { code: 'BIO103', grade: 'A', credits: 3, semester: 'Spring 2010' },
        { code: 'BUS401', grade: 'B+', credits: 3, semester: 'Spring 2010' },
        { code: 'FIN435', grade: 'A-', credits: 3, semester: 'Spring 2010' },
        { code: 'MGT314', grade: 'B', credits: 3, semester: 'Spring 2010' },
        { code: 'ENG105', grade: 'B+', credits: 3, semester: 'Summer 2010' },
        { code: 'FIN599A', grade: 'A', credits: 3, semester: 'Summer 2010' }
      ]
    },
    {
      name: 'TEST 3: LOW CGPA',
      description: '40 courses, 120 credits, CGPA 1.5 - Should FAIL (CGPA)',
      courses: Array(40).fill(null).map((_, i) => ({
        code: `CRS${100 + i}`,
        grade: i % 2 === 0 ? 'D' : 'C',
        credits: 3,
        semester: 'Spring 2020'
      }))
    }
  ];
  
  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('─'.repeat(50));
    console.log(test.description);
    
    try {
      const result = await apiCall('/process-transcript', 'POST', { courses: test.courses }, {});
      
      if (result.status === 200) {
        console.log('Result:', result.body.result);
        console.log('CGPA:', result.body.audit.level2.cgpa);
        console.log('Credits:', result.body.audit.level1.totalCredits);
        
        const test1Pass = test.name.includes('VALID GRADUATE') && result.body.result === 'GRADUATED';
        const test2Pass = test.name.includes('CREDIT DEFICIT') && result.body.result === 'NOT GRADUATED';
        const test3Pass = test.name.includes('LOW CGPA') && result.body.result === 'NOT GRADUATED';
        
        if (test1Pass || test2Pass || test3Pass) {
          console.log('✅ PASSED');
        } else {
          console.log('❌ FAILED - Expected different result');
        }
      } else {
        console.log('❌ Error:', result.body.error);
      }
    } catch (e) {
      console.log('❌ Could not connect to server. Make sure server is running.');
      console.log('   Error:', e.message);
      break;
    }
  }
  
  console.log('\n🧪 All tests complete!\n');
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  
  if (cmd === 'login') {
    await googleDeviceLogin();
    return;
  }
  
  if (cmd === 'upload') {
    const imagePath = args[1];
    if (!imagePath) {
      console.error('Usage: node cli.js upload <image-path>');
      return;
    }
    await uploadImage(imagePath);
    return;
  }
  
  if (cmd === 'test') {
    await runTests();
    return;
  }
  
  if (cmd === 'generate-key') {
    const result = await apiCall('/generate-key', 'POST', { name: 'CLI' });
    if (result.status === 200) {
      console.log('API Key:', result.body.apiKey);
    } else {
      console.error('Error:', result.body.error);
    }
    return;
  }
  
  if (cmd === 'history') {
    // Generate a temp key for history access
    const keyResult = await apiCall('/generate-key', 'POST', { name: 'CLI-History' });
    const apiKey = keyResult.status === 200 ? keyResult.body.apiKey : null;
    
    const result = await apiCall('/api-history', 'GET', {}, { apiKey });
    if (result.status === 200) {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║         API HISTORY                           ║');
      console.log('╚════════════════════════════════════════════════╝');
      result.body.history.forEach((h, i) => {
        console.log(`${i + 1}. ${h.endpoint}`);
        console.log(`   User: ${h.user} | ${h.status?.toUpperCase()} | ${h.timestamp}`);
      });
      console.log('');
    } else {
      console.log('❌ Error:', result.body.error);
    }
    return;
  }
  
  console.log(`
╔════════════════════════════════════════════════╗
║         NSU AUDIT CLI (RFC 8628 Device Flow)   ║
╠════════════════════════════════════════════════╣
║  login              Login with Google OAuth   ║
║  upload <path>      Upload transcript image   ║
║  test               Run 3-level audit tests    ║
║  generate-key       Generate API key          ║
║  history            View API history         ║
╚════════════════════════════════════════════════╝

Example:
  node cli.js login
  node cli.js upload path/to/transcript.png
  node cli.js test
  node cli.js history
  `);
}

main().catch(console.error);
