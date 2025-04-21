/*
 * serverGetProviderTravelOptions.js
 * Get all travel options registered by the provider.
 */
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function getProviderTravelOptions(providerEmail) {
	try {
    	if (!providerEmail) {
        	throw new Error('Provider email parameter is required.');
    	}
    	const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    	const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
   	 
    	const walletPath = path.join(process.cwd(), 'wallet');
    	const wallet = await Wallets.newFileSystemWallet(walletPath);
   	 
    	const gateway = new Gateway();
    	await gateway.connect(ccp, { wallet, identity: providerEmail, discovery: { enabled: true, asLocalhost: true } });
   	 
    	const network = await gateway.getNetwork('mychannel');
    	const contract = network.getContract('stake');
   	 
    	console.log('Evaluating transaction: getProviderTravelOptions');
    	const result = await contract.evaluateTransaction('getProviderTravelOptions');
    	console.log(`Transaction evaluated, result: ${result.toString()}`);
   	 
    	await gateway.disconnect();
    	return result.toString();
	} catch (error) {
    	console.error(`Failed to get provider travel options: ${error.response ? error.response.data : error.message}`);
    	throw new Error(`Chaincode error: ${error.message}`);
	}
}

if (require.main === module) {
	const args = process.argv.slice(2);
	if (args.length < 1) {
    	console.log('Usage: node serverGetProviderTravelOptions.js <providerEmail>');
    	process.exit(1);
	}
	getProviderTravelOptions(args[0]);
}

module.exports = getProviderTravelOptions;
