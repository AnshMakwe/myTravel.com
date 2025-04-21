/*
 * serverRescheduleTicket.js
 * Reschedule an existing ticket.
 */
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function rescheduleTicket(ticketId, newTravelOptionId, currentTimestamp, identityEmail, selectedSeat) {
  try {
    if (!ticketId || !newTravelOptionId || !currentTimestamp) {
      throw new Error('Ticket ID, new travel option ID, and current timestamp are required for rescheduling.');
    }
    if (!identityEmail) {
      throw new Error('Customer identity email is required for rescheduling.');
    }
    const ccpPath = path.resolve(
      __dirname,
      '..',
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
    await gateway.connect(ccp, { wallet, identity: identityEmail, discovery: { enabled: true, asLocalhost: true } });
    
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');
    
    console.log(`Submitting transaction: rescheduleTicket with args "${ticketId}", "${newTravelOptionId}", "${currentTimestamp}" using identity "${identityEmail}"`);
    const result = await contract.submitTransaction('rescheduleTicket', ticketId, newTravelOptionId, currentTimestamp, selectedSeat);
    console.log(`Transaction has been submitted, result: ${result.toString()}`);
    
    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    console.error(`Failed to reschedule ticket: ${error.response ? error.response.data : error.message}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.log('Usage: node serverRescheduleTicket.js <ticketId> <newTravelOptionId> <currentTimestamp> <identityEmail>');
    process.exit(1);
  }
  rescheduleTicket(args[0], args[1], args[2], args[3]);
}

module.exports = rescheduleTicket;




