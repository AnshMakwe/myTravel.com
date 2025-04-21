// pendingTicketRegistry.js
const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, 'pendingTickets.json');

function loadRegistry() {
  if (!fs.existsSync(registryPath)) {
    return {};
  }
  const data = fs.readFileSync(registryPath);
  return JSON.parse(data);
}

function saveRegistry(registry) {
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

function addPendingTicket(ticketId, blockNumber) {
  const registry = loadRegistry();
  registry[ticketId] = blockNumber;
  saveRegistry(registry);
}

function getPendingTickets() {
  return loadRegistry();
}

function removePendingTicket(ticketId) {
  const registry = loadRegistry();
  delete registry[ticketId];
  saveRegistry(registry);
}

module.exports = { addPendingTicket, getPendingTickets, removePendingTicket };


