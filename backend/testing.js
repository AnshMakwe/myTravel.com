import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const customers = new SharedArray('custs', () => JSON.parse(open('./customers.json')));
const optionsArr = new SharedArray('opts',  () => JSON.parse(open('./travelOptions.json')));

export let options = {
  scenarios: {
    bookin: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: 3200,
      maxDuration: '40m',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<6000'],
  },
};

export default function () {
  const customer = customers[Math.floor(Math.random()*customers.length)];
  const opt      = optionsArr[Math.floor(Math.random()*optionsArr.length)];
  const seat     = Math.ceil(Math.random()*opt.seatCapacity);

  let res = http.post(
    `http://localhost:8000/bookticket?email=${encodeURIComponent(customer)}`,
    JSON.stringify({ travelOptionId: opt.travelOptionId, seatnumber: seat }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, { 'status 200': (r) => r.status === 200 });

  sleep(1); 
}

