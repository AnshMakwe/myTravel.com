'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function getCustomerDetails(userEmail) {
  try {
	if (!userEmail) {
    	throw new Error('User email parameter is required.');
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


	const identities = await wallet.list();
	console.log('Wallet identities:', identities);

	
	const identity = await wallet.get(userEmail);
	if (!identity) {
  	throw new Error(`Identity not found in wallet: ${userEmail}`);
	}

	const gateway = new Gateway();
	await gateway.connect(ccp, { wallet, identity: userEmail, discovery: { enabled: true, asLocalhost: true } });
	const network = await gateway.getNetwork('mychannel');
	const contract = network.getContract('stake');

	console.log('Evaluating transaction: getCustomerDetails');
	const result = await contract.evaluateTransaction('getCustomerDetails');
	console.log(`Transaction result: ${result.toString()}`);

	await gateway.disconnect();
	return result.toString();
  } catch (error) {
	console.error(`Failed to get customer details: ${error.message}`);
	throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
	console.log('Usage: node getCustomerDetails.js <userEmail>');
	process.exit(1);
  }
  getCustomerDetails(args[0]);
}

module.exports = getCustomerDetails;




