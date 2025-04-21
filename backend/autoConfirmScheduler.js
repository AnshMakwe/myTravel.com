// autoConfirmScheduler.js
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { getPendingTickets, removePendingTicket } = require('./pendingTicketRegistry');
const { common } = require('fabric-protos');

// Existing function: get current block height
async function getCurrentBlockHeight(identity = 'appUser') {
  try {
    const ccpPath = path.resolve(
      __dirname,
      '..',
      'test-network',
      'organizations',
      'peerOrganizations',
      'org1.example.com',
      'connection-org1.json'
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const qscc = network.getContract('qscc');
    const infoBuffer = await qscc.evaluateTransaction('GetChainInfo', 'mychannel');
    const blockchainInfo = common.BlockchainInfo.decode(infoBuffer);
    const height = parseInt(blockchainInfo.height.toString(), 10);
    await gateway.disconnect();
    return height;
  } catch (error) {
    console.error('Error getting current block height:', error);
    throw error;
  }
}

// Existing function: confirm a ticket
async function confirmTicket(ticketId, identity = 'appUser') {
  try {
    const ccpPath = path.resolve(
      __dirname,
      '..',
      'test-network',
      'organizations',
      'peerOrganizations',
      'org1.example.com',
      'connection-org1.json'
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');
    console.log(`Submitting transaction: confirmTicket for ticket ${ticketId}`);
    const result = await contract.submitTransaction('confirmTicket', ticketId);
    console.log(`Ticket confirmation result: ${result.toString()}`);
    await gateway.disconnect();
  } catch (error) {
    console.error(`Error confirming ticket ${ticketId}:`, error);
  }
}

// Existing block–based check on pending tickets.
async function processPendingTickets() {
  try {
    const identity = 'appUser';
    const currentHeight = await getCurrentBlockHeight(identity);
    console.log(`Current block height: ${currentHeight}`);

    const pending = getPendingTickets();
    for (const [ticketId, bookingBlock] of Object.entries(pending)) {
      // Note: The threshold below (>= 2000) is as you have it.
      if (currentHeight - bookingBlock >= 2) {
        console.log(`Ticket ${ticketId} is eligible for confirmation (booked at block ${bookingBlock}).`);
        await confirmTicket(ticketId, identity);
        removePendingTicket(ticketId);
      } else {
        console.log(`Ticket ${ticketId} is not yet eligible (booked at block ${bookingBlock}).`);
      }
    }
  } catch (error) {
    console.error('Error processing pending tickets:', error);
  }
}

// NEW: Time-based check for travel options departing within 2 hours
async function processTimeBasedAutoConfirm() {
  try {
    // Require the function that returns all travel options.
    const getAllTravelOptions = require('../sdk/javascript/serverGetAllTravelOptions');
    const travelOptionsStr = await getAllTravelOptions();
    const travelOptions = JSON.parse(travelOptionsStr);
    const now = new Date();
    const twoHoursMs = 2 * 60 * 1000;

    for (const option of travelOptions) {
      // Construct a Date object for departure time.
      // Assumes option.departureDate and option.departureTime are in a format compatible with Date.
      const departureTime = new Date(`${option.departureDate}T${option.departureTime}`);
      const timeDiff = departureTime - now;
      console.log(timeDiff);
      if (timeDiff >=0 && timeDiff <= twoHoursMs) {
        console.log(`Travel option ${option.travelOptionId} is within 2 hours of departure.`);
        // Get current time as ISO string.
        const currentTimestamp = now.toISOString();
        // Call the chaincode function "autoConfirmTicketsForTravelOption" to trigger auto-confirmation.
        // Here we use a similar approach as confirmTicket.
        try {
          const ccpPath = path.resolve(
            __dirname,
            '..',
            'test-network',
            'organizations',
            'peerOrganizations',
            'org1.example.com',
            'connection-org1.json'
          );
          const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
          const walletPath = path.join(process.cwd(), 'wallet');
          const wallet = await Wallets.newFileSystemWallet(walletPath);
          const gateway = new Gateway();
          await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
          const network = await gateway.getNetwork('mychannel');
          const contract = network.getContract('stake');
          console.log(`Submitting auto-confirm for travel option ${option.travelOptionId} with current timestamp ${currentTimestamp}`);
          const result = await contract.submitTransaction('autoConfirmTicketsForTravelOption', option.travelOptionId, currentTimestamp);
          console.log(`Auto-confirm result for option ${option.travelOptionId}: ${result.toString()}`);
          await gateway.disconnect();
        } catch (err) {
          console.error(`Error auto-confirming tickets for option ${option.travelOptionId}:`, err);
        }
      } else {
        console.log(`Travel option ${option.travelOptionId} is not within 2 hours of departure.`);
      }
    }
  } catch (error) {
    console.error('Error processing time-based auto-confirmation:', error);
  }
}

// Combined scheduler: run both block-based and time-based checks.
async function scheduler() {
  await processPendingTickets();
  await processTimeBasedAutoConfirm();
}

// Run scheduler every minute.
setInterval(scheduler, 5 * 60 * 1000);

// If run directly, process once and exit.
if (require.main === module) {
  scheduler().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = {
  startBlockListener: processPendingTickets,
  addPendingTicket: (id, block) => {
    console.log(`Adding pending ticket ${id} booked in block ${block}`);
  }
};




