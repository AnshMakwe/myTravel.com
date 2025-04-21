// blockEventListener.js
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// In-memory pending ticket registry.
// Format: { ticketKey: bookingBlockNumber }
const pendingTickets = {};

// Threshold: number of blocks required for confirmation.
const CONFIRMATION_BLOCK_THRESHOLD = 2;

async function startBlockListener() {
  try {
    // Load connection profile.
    const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Set up wallet and gateway using an identity (e.g., appUser).
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork('mychannel');

    // Listen for block events.
    console.log('Starting block event listener...');
    await network.addBlockListener(async (blockEvent) => {
      const blockNumber = blockEvent.blockNumber.low; // simple number for example
      console.log(`New block received: ${blockNumber}`);

      // For demonstration, assume that whenever a ticket is booked, another process adds its ticket key
      // and the current block number to our in-memory registry. Here, we simulate checking all pending tickets.
      for (const [ticketKey, bookingBlock] of Object.entries(pendingTickets)) {
        if ((blockNumber - bookingBlock) >= CONFIRMATION_BLOCK_THRESHOLD) {
          console.log(`Ticket ${ticketKey} has waited ${blockNumber - bookingBlock} blocks. Triggering confirmation...`);
          try {
            await confirmTicket(ticketKey);
            // Remove ticket from registry after confirmation.
            delete pendingTickets[ticketKey];
            console.log(`Ticket ${ticketKey} confirmed.`);
          } catch (err) {
            console.error(`Error confirming ticket ${ticketKey}:`, err);
          }
        }
      }
    });

  } catch (error) {
    console.error(`Error in block event listener: ${error.message}`);
  }
}

// Example function to simulate calling the confirmTicket endpoint directly.
async function confirmTicket(ticketKey) {
  // This function can use the serverConfirmTicket.js module (or similar) to submit the transaction.
  const { Gateway, Wallets } = require('fabric-network');
  const fs = require('fs');
  const path = require('path');

  const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const walletPath = path.join(process.cwd(), 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const gateway = new Gateway();
  // Use "appUser" for example.
  await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
  const network = await gateway.getNetwork('mychannel');
  const contract = network.getContract('stake');
  await contract.submitTransaction('confirmTicket', ticketKey);
  await gateway.disconnect();
}

// For demonstration purposes, simulate adding a ticket to the registry when booked.
// In your actual booking flow, when a ticket is successfully booked, add it to the registry.
function addPendingTicket(ticketKey, bookingBlockNumber) {
  pendingTickets[ticketKey] = bookingBlockNumber;
  console.log(`Added pending ticket ${ticketKey} booked in block ${bookingBlockNumber}`);
}

// Export the listener and helper functions.
module.exports = {
  startBlockListener,
  addPendingTicket
};

// If this file is run directly, start the listener.
if (require.main === module) {
  startBlockListener();
}

