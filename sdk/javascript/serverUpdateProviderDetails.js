'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function updateProviderDetails(providerEmail, newName, newContact, newRating, isAnonymous) {
  try {
	if (!providerEmail) {
    	throw new Error('Provider email is required.');
	}
	if (!newName) {
    	throw new Error('New name is required.');
	}
	// If not anonymous, contact must be provided.
	if (!isAnonymous && !newContact) {
    	throw new Error('New contact is required when profile is not anonymous.');
	}
	if (newRating === undefined) {
    	throw new Error('New rating is required.');
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
	await gateway.connect(ccp, { wallet, identity: providerEmail, discovery: { enabled: true, asLocalhost: true } });
	const network = await gateway.getNetwork('mychannel');
	const contract = network.getContract('stake');

	console.log(`Submitting transaction: updateProviderDetails with args "${newName}", "${newContact}", "${newRating}", "${isAnonymous}"`);
	const result = await contract.submitTransaction('updateProviderDetails', newName, newContact, newRating.toString(), isAnonymous.toString());
	console.log(`Transaction result: ${result.toString()}`);
	await gateway.disconnect();
	return result.toString();
  } catch (error) {
	console.error(`Failed to update provider details: ${error.response ? error.response.data : error.message}`);
	throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 5) {
	console.log('Usage: node serverUpdateProviderDetails.js <providerEmail> <newName> <newContact> <newRating> <isAnonymous>');
	process.exit(1);
  }
  updateProviderDetails(args[0], args[1], args[2], args[3], args[4]);
}

module.exports = updateProviderDetails;




