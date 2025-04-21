/*
 * serverAutoConfirmTickets.js
 * Auto-confirm tickets for a travel option that is within 2 hours of departure.
 */
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function autoConfirmTickets(travelOptionId, currentTimestamp, identityEmail) {
  try {
    if (!travelOptionId || !currentTimestamp || !identityEmail) {
      throw new Error('Travel option ID, current timestamp, and identity email are required.');
    }
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations',
      'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');
    const result = await contract.submitTransaction('autoConfirmTicketsForTravelOption', travelOptionId, currentTimestamp);
    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node serverAutoConfirmTickets.js <travelOptionId> <currentTimestamp> <identityEmail>');
    process.exit(1);
  }
  autoConfirmTickets(args[0], args[1], args[2]).then(console.log).catch(console.error);
}

module.exports = autoConfirmTickets;

