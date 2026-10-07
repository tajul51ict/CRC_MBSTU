const http = require('http');

// Wait 1.5 seconds then run tests against running server
setTimeout(async () => {
  const baseUrl = 'http://localhost:5000';
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAIL: ${name} ->`, e.message);
      failed++;
    }
  }

  console.log('--- Starting Integration Tests ---');

  await test('API Health check', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Health check status is not ok');
  });

  await test('Fetch Activities', async () => {
    const res = await fetch(`${baseUrl}/api/activities`);
    const data = await res.json();
    if (!data.success || data.count < 4) throw new Error(`Expected at least 4 activities, got ${data.count}`);
  });

  await test('Fetch Committee Members', async () => {
    const res = await fetch(`${baseUrl}/api/committee`);
    const data = await res.json();
    if (!data.success || data.count < 4) throw new Error(`Expected at least 4 committee members, got ${data.count}`);
  });

  await test('Fetch Gallery Photos', async () => {
    const res = await fetch(`${baseUrl}/api/gallery`);
    const data = await res.json();
    if (!data.success || data.count < 6) throw new Error(`Expected at least 6 gallery photos, got ${data.count}`);
  });

  let adminToken = '';
  await test('Admin Login with seeded credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@crcmbstu.com', password: 'Admin@12345' })
    });
    const data = await res.json();
    if (!data.success || data.user.role !== 'admin' || !data.token) {
      throw new Error(`Admin login failed: ${data.message}`);
    }
    adminToken = data.token;
  });

  await test('Admin Dashboard Stats', async () => {
    const res = await fetch(`${baseUrl}/api/members/admin-stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!data.success || data.data.totalActivities < 4) {
      throw new Error(`Failed to fetch admin stats: ${data.message}`);
    }
  });

  await test('Pending Member Login Blocked', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pending@crcmbstu.com', password: 'Admin@12345' })
    });
    if (res.status !== 403) {
      throw new Error(`Expected status 403 for pending member, got ${res.status}`);
    }
  });

  let memberToken = '';
  await test('Active Member Login', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@crcmbstu.com', password: 'Admin@12345' })
    });
    const data = await res.json();
    if (!data.success || data.user.role !== 'member') {
      throw new Error(`Member login failed: ${data.message}`);
    }
    memberToken = data.token;
  });

  await test('Member Dashboard Stats', async () => {
    const res = await fetch(`${baseUrl}/api/members/member-stats`, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const data = await res.json();
    if (!data.success || data.data.joinedActivities < 1) {
      throw new Error(`Failed to fetch member stats: ${data.message}`);
    }
  });

  await test('Prevent Duplicate Activity Join', async () => {
    const res = await fetch(`${baseUrl}/api/activities/1/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const data = await res.json();
    if (res.status !== 400 || !data.message.includes('already joined')) {
      throw new Error(`Duplicate join not handled correctly: ${data.message}`);
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}, 2000);
