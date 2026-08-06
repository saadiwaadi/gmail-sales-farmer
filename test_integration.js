const http = require('http');

const PORT = 4000;
const HOST = 'localhost';
let cookie = '';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        if (setCookie) {
          cookie = setCookie[0].split(';')[0];
        }
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody ? JSON.parse(responseBody) : {}
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING INTEGRATION SMOKE TESTS ---');
  try {
    // 1. Try to Register Test User (ignore error if already exists)
    console.log('1. Registering test user...');
    const registerRes = await request('POST', '/api/auth/signup', {
      email: 'testuser@example.com',
      password: 'Password123',
      name: 'Test User',
      role: 'Admin',
      key: 'change-me-before-deploy'
    });
    console.log('Register status:', registerRes.statusCode, registerRes.body);

    // 2. Login
    console.log('2. Logging in...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'testuser@example.com',
      password: 'Password123'
    });
    if (loginRes.statusCode !== 200) {
      throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.body)}`);
    }
    console.log('Login success! Cookie:', cookie);

    // 3. Import CSV leads
    console.log('3. Importing leads via CSV...');
    const importRes = await request('POST', '/api/contacts/import', {
      rows: [
        {
          name: 'SmokeTest lead ' + Date.now(),
          company: 'SmokeTest Corp',
          email: 'smoketest@example.com',
          type: 'buyer',
          stage: 'New Lead',
          score: 90,
          raw_dump: 'Wants a modern luxury apartment in city center'
        }
      ]
    });
    console.log('Import response:', importRes.body);
    if (!importRes.body.success) {
      throw new Error('Import failed: ' + JSON.stringify(importRes.body));
    }

    // 4. Fetch contacts list
    console.log('4. Fetching contacts list...');
    const contactsRes = await request('GET', '/api/contacts');
    if (contactsRes.statusCode !== 200) {
      throw new Error('Failed to fetch contacts: ' + contactsRes.statusCode);
    }
    const contacts = contactsRes.body.contacts || [];
    const lead = contacts.find(c => c.name.startsWith('SmokeTest lead'));
    if (!lead) {
      throw new Error('Imported lead not found in contacts list');
    }
    console.log(`Found imported lead: ID=${lead.id}, Name=${lead.name}, Status=${lead.ai_status}`);

    // 5. Update Tone note
    console.log(`5. Patching tone note for lead ID=${lead.id}...`);
    const toneRes = await request('PATCH', `/api/contacts/${lead.id}/tone_note`, {
      tone_note: 'curiosity'
    });
    console.log('Patch Tone response:', toneRes.body);
    if (!toneRes.body.success) {
      throw new Error('Tone patch failed: ' + JSON.stringify(toneRes.body));
    }

    // 6. Fetch Messages (should be empty initially)
    console.log(`6. Fetching messages for lead ID=${lead.id}...`);
    const msgsInit = await request('GET', `/api/contacts/${lead.id}/messages`);
    console.log('Initial messages count:', msgsInit.body.messages?.length || 0);

    // 7. Trigger AI email drafting
    console.log(`7. Triggering AI draft for lead ID=${lead.id} with curiosity tone...`);
    const draftRes = await request('POST', `/api/contacts/${lead.id}/draft`, {
      tone: 'curiosity'
    });
    console.log('Draft generated response:', draftRes.statusCode, draftRes.body);
    if (draftRes.statusCode !== 200) {
      throw new Error('Drafting failed: ' + JSON.stringify(draftRes.body));
    }

    // 8. Fetch Messages again (should contain 1 message)
    console.log('8. Re-fetching messages...');
    const msgsAfter = await request('GET', `/api/contacts/${lead.id}/messages`);
    const msgList = msgsAfter.body.messages || [];
    console.log('Messages count after drafting:', msgList.length);
    if (msgList.length === 0) {
      throw new Error('No messages found in history after drafting!');
    }
    console.log('Latest message subject:', msgList[0].subject_line);
    console.log('Latest message body:', msgList[0].body);

    console.log('--- ALL SMOKE TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('--- SMOKE TEST FAILED ---');
    console.error(err);
    process.exit(1);
  }
}

runTests();
