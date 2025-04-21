'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function getProviderDetails(providerEmail) {
  try {
	if (!providerEmail) {
    	throw new Error('Provider email parameter is required.');
	}
	// Load connection profile.
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

	// Use a consistent wallet path.
	const walletPath = path.join(process.cwd(), 'wallet');
	const wallet = await Wallets.newFileSystemWallet(walletPath);

	// Look up provider identity using providerEmail.
	const identity = await wallet.get(providerEmail);
	if (!identity) {
  	throw new Error(`An identity for the provider "${providerEmail}" does not exist in the wallet`);
	}

	const gateway = new Gateway();
	await gateway.connect(ccp, { wallet, identity: providerEmail, discovery: { enabled: true, asLocalhost: true } });
	const network = await gateway.getNetwork('mychannel');
	const contract = network.getContract('stake');

	console.log('Evaluating transaction: getProviderDetails');
	const result = await contract.evaluateTransaction('getProviderDetails');
	console.log(`Transaction result: ${result.toString()}`);
	await gateway.disconnect();
	return result.toString();
  } catch (error) {
	console.error(`Failed to get provider details: ${error.message}`);
	throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
	console.log('Usage: node getProviderDetails.js <providerEmail>');
	process.exit(1);
  }
  getProviderDetails(args[0]);
}

module.exports = getProviderDetails;




