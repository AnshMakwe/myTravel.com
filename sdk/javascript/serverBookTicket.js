
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { addPendingTicket } = require('../../backend/pendingTicketRegistry'); // adjust the path as needed
const { common } = require('fabric-protos');

async function bookTicket(travelOptionId, seatnumber,identityEmail) {
  try {
    if (!travelOptionId) {
      throw new Error('Travel option ID is required for booking.');
    }
    if (!identityEmail) {
      throw new Error('Customer identity email is required for booking.');
    }
    if (!seatnumber) {
      throw new Error('Please provide a vaild seat number.');
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
    
    console.log(`Submitting transaction: bookTicket with travelOptionId "${travelOptionId}" using identity "${identityEmail}"`);
    const resultBuffer = await contract.submitTransaction('bookTicket', travelOptionId, seatnumber);
    console.log(`Transaction result: ${resultBuffer.toString()}`);
    
    // Parse the returned ticket data
    const ticket = JSON.parse(resultBuffer.toString());
    
    // Query the blockchain height via qscc
    const qscc = network.getContract('qscc');
    const infoBuffer = await qscc.evaluateTransaction('GetChainInfo', 'mychannel');
    const blockchainInfo = common.BlockchainInfo.decode(infoBuffer);
    const currentHeight = parseInt(blockchainInfo.height.toString(), 10);
    // Assume the ticket was recorded in block (currentHeight - 1)
    const bookingBlock = currentHeight - 1;
    console.log(`Ticket booked at block ${bookingBlock}`);
    
    // Add this ticket to the pending registry
    addPendingTicket(ticket.ticketId, bookingBlock);
    
    await gateway.disconnect();
    return resultBuffer.toString();
  } catch (error) {
    console.error(`Failed to book ticket: ${error.response ? error.response.data : error.message}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node serverBookTicket.js <travelOptionId> <identityEmail> <seatnumber>');
    process.exit(1);
  }
  bookTicket(args[0], args[1]).then(console.log).catch(console.error);
}

module.exports = bookTicket;

