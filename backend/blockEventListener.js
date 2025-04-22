
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');


const pendingTickets = {};


const CONFIRMATION_BLOCK_THRESHOLD = 2;

async function startBlockListener() {
  try {
   
    const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

   
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork('mychannel');


    console.log('Starting block event listener...');
    await network.addBlockListener(async (blockEvent) => {
      const blockNumber = blockEvent.blockNumber.low; // simple number for example
      console.log(`New block received: ${blockNumber}`);


      for (const [ticketKey, bookingBlock] of Object.entries(pendingTickets)) {
        if ((blockNumber - bookingBlock) >= CONFIRMATION_BLOCK_THRESHOLD) {
          console.log(`Ticket ${ticketKey} has waited ${blockNumber - bookingBlock} blocks. Triggering confirmation...`);
          try {
            await confirmTicket(ticketKey);
          
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


async function confirmTicket(ticketKey) {
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

function addPendingTicket(ticketKey, bookingBlockNumber) {
  pendingTickets[ticketKey] = bookingBlockNumber;
  console.log(`Added pending ticket ${ticketKey} booked in block ${bookingBlockNumber}`);
}


module.exports = {
  startBlockListener,
  addPendingTicket
};


if (require.main === module) {
  startBlockListener();
}

