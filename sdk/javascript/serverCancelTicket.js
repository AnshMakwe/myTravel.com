
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function cancelTicket(ticketId, currentTimestamp, identityEmail) {
  try {
    if (!ticketId || !currentTimestamp) {
      throw new Error('Ticket ID and current timestamp are required for cancellation.');
    }
    if (!identityEmail) {
      throw new Error('Customer identity email is required for cancellation.');
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
  
    console.log(`Submitting transaction: cancelTicket with args "${ticketId}", "${currentTimestamp}" using identity "${identityEmail}"`);
    const result = await contract.submitTransaction('cancelTicket', ticketId, currentTimestamp);
    console.log(`Transaction has been submitted, result: ${result.toString()}`);
  
    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    console.error(`Failed to cancel ticket: ${error.response ? error.response.data : error.message}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node serverCancelTicket.js <ticketId> <currentTimestamp> <identityEmail>');
    process.exit(1);
  }
  cancelTicket(args[0], args[1], args[2]);
}

module.exports = cancelTicket;




