// loadTestSetup.js
const axios = require('axios');
const fs    = require('fs');

// adjust if your API is on a different host/port
const API = axios.create({ baseURL: process.env.API_BASE_URL || 'http://localhost:8000' });

async function registerCustomers(n = 500) {
  const customers = [];
  for (let i = 1; i <= n; i++) {
    const email   = `cust${i}@test.com`;
    const name    = `Customer ${i}`;
    const contact = `+91${Math.floor(9000000000 + Math.random()*1000000000)}`;
    try {
      await API.post('/registercustomer', { name, contact, email });
      customers.push(email);
    } catch (e) {
      console.error(`Failed to register customer ${email}:`, e.response?.data || e.message);
    }
  }
  return customers;
}

async function registerProviders(n = 500) {
  const providers = [];
  for (let i = 1; i <= n; i++) {
    const email          = `prov${i}@test.com`;
    const name           = `Provider ${i}`;
    const contact        = `+91${Math.floor(7000000000 + Math.random()*1000000000)}`;
    const rating         = (Math.random() * 5).toFixed(1);
    const serviceProvider= `SP${i}`;
    try {
      await API.post('/registerprovider', { name, contact, rating, email, serviceProvider });
      providers.push(email);
    } catch (e) {
      console.error(`Failed to register provider ${email}:`, e.response?.data || e.message);
    }
  }
  return providers;
}

async function addTravelOptions(providers, perProvider = 5) {
  const travelOptions = [];

  // 10 major Indian cities
  const cities = [
    'Mumbai','Delhi','Bangalore','Chennai','Hyderabad',
    'Kolkata','Pune','Ahmedabad','Jaipur','Lucknow'
  ];

  for (const email of providers) {
    for (let i = 0; i < perProvider; i++) {
      // pick two distinct cities
      let src = cities[Math.floor(Math.random()*cities.length)];
      let dst = cities[Math.floor(Math.random()*cities.length)];
      if (src === dst) {
        dst = cities[(cities.indexOf(src)+1) % cities.length];
      }
      const departureDate = new Date(Date.now() + (i+1)*24*60*60*1000)
                              .toISOString().slice(0,10);
      const departureTime = `${String(6 + (i%12)).padStart(2,'0')}:00`;
      const transportMode = ['bus','train','plane'][i%3];
      const seatCapacity  = 40 + Math.floor(Math.random()*61);  // 40–100 seats
      const basePrice     = 100 + Math.floor(Math.random()*1001); // 100–1500

      try {
        const res = await API.post('/addtraveloption', {
          providerEmail: email,
          source: src,
          destination: dst,
          departureDate,
          departureTime,
          transportMode,
          seatCapacity,
          basePrice
        });
        const opt = res.data;
        travelOptions.push({ travelOptionId: opt.travelOptionId, seatCapacity });
      } catch (e) {
        console.error(`  addTravelOption error for ${email}:`, e.response?.data || e.message);
      }
    }
  }
  return travelOptions;
}

(async () => {
  console.log('Starting Indian‐city load‑test setup…');
  const customers     = await registerCustomers();
  const providers     = await registerProviders();
  const travelOptions = await addTravelOptions(providers, 5);

  fs.writeFileSync('customers.json',     JSON.stringify(customers,     null, 2));
  fs.writeFileSync('providers.json',     JSON.stringify(providers,     null, 2));
  fs.writeFileSync('travelOptions.json', JSON.stringify(travelOptions, null, 2));

  console.log('Setup complete with Indian cities!');
  console.log(`  customers.json     (${customers.length})`);
  console.log(`  providers.json     (${providers.length})`);
  console.log(`  travelOptions.json (${travelOptions.length})`);
})();

