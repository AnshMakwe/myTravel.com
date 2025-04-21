// topUpBalance.js
const axios = require('axios');
const fs    = require('fs');

const API = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:8000'
});

async function topUp(amount = 100000, startFrom = 'cust1@test.com') {
  let customers = [];
  try {
    customers = JSON.parse(fs.readFileSync('customers.json'));
  } catch (e) {
    console.error('Could not read customers.json:', e.message);
    process.exit(1);
  }

  const startIndex = customers.findIndex(email => email.includes(startFrom));
  if (startIndex === -1) {
    console.error(`Start customer "${startFrom}" not found in customers.json`);
    process.exit(1);
  }

  const selectedCustomers = customers.slice(startIndex);

  for (const email of selectedCustomers) {
    try {
      await API.post(
        `/depositfunds?email=${encodeURIComponent(email)}`,
        { amount }
      );
      console.log(`  ${email} topped up by ${amount}`);
    } catch (e) {
      console.error(` ${email}:`, e.response?.data || e.message);
    }
  }
}

topUp().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

