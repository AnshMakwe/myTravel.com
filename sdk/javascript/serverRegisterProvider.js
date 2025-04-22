
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function registerProvider(name, contact, rating) {
  try {
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');
    
    console.log(`Submitting transaction: registerProvider with args "${name}", "${contact}", "${rating}"`);
    const result = await contract.submitTransaction('registerProvider', name, contact, rating.toString());
    console.log(`Transaction has been submitted, result: ${result.toString()}`);
    
    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    console.error(`Failed to register provider: ${error}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node serverRegisterProvider.js <name> <contact> <rating>');
    process.exit(1);
  }
  registerProvider(args[0], args[1], args[2]);
}

module.exports = registerProvider;




