// fetchTravelOptions.js
const axios = require('axios');
const fs    = require('fs');

const API = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:8000'
});

async function fetchOptions() {
  try {
    const res = await API.get('/getalltraveloptions');
    // backend returns a JSON string or array
    let options = res.data;
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }
    // only keep id + seatCapacity
    const travelOptions = options.map(o => ({
      travelOptionId: o.travelOptionId,
      seatCapacity: o.seatCapacity
    }));
    fs.writeFileSync(
      'travelOptions.json',
      JSON.stringify(travelOptions, null, 2)
    );
    console.log(`Wrote ${travelOptions.length} travel options to travelOptions.json`);
  } catch (e) {
    console.error('Error fetching travel options:', e.response?.data || e.message);
    process.exit(1);
  }
}

fetchOptions();

