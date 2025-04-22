
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function listTravelOptions(source, destination) {
  try {
	if (!source || !destination) {
    	throw new Error('Both source and destination are required.');
	}
	const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
	const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
 
	const walletPath = path.join(process.cwd(), 'wallet');
	const wallet = await Wallets.newFileSystemWallet(walletPath);
 
	const gateway = new Gateway();
	await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
 
	const network = await gateway.getNetwork('mychannel');
	const contract = network.getContract('stake');
 
	console.log(`Evaluating transaction: listTravelOptions with args "${source}", "${destination}"`);
	const result = await contract.evaluateTransaction('listTravelOptions', source, destination);
	console.log(`Transaction result: ${result.toString()}`);
 
	await gateway.disconnect();
	return result.toString();
  } catch (error) {
	console.error(`Failed to list travel options: ${error.response ? error.response.data : error.message}`);
	throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
	console.log('Usage: node serverListTravelOptions.js <source> <destination>');
	process.exit(1);
  }
  listTravelOptions(args[0], args[1]);
}

module.exports = listTravelOptions;




