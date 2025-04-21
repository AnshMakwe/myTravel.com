/*
 * serverRegisterCustomer.js
 * Register a new customer on the travel ticket platform.
 */
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function registerCustomer(name, contact) {
  try {
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');
    
    console.log(`Submitting transaction: registerCustomer with args "${name}", "${contact}"`);
    const result = await contract.submitTransaction('registerCustomer', name, contact);
    console.log(`Transaction has been submitted, result: ${result.toString()}`);
    
    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    console.error(`Failed to register customer: ${error}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node serverRegisterCustomer.js <name> <contact>');
    process.exit(1);
  }
  registerCustomer(args[0], args[1]);
}

module.exports = registerCustomer;




