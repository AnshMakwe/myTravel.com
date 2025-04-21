/*
 * serverGetAllTravelOptions.js
 * Get all travel options from the ledger.
 */
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function getAllTravelOptions() {
  try {
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations',
      'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    // Use a fixed identity (e.g. "appUser") with permissions.
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');
    const result = await contract.evaluateTransaction('getAllTravelOptions');
    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  getAllTravelOptions().then(console.log).catch(console.error);
}

module.exports = getAllTravelOptions;

