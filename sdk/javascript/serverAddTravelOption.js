'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function addTravelOption(providerEmail, source, destination, departureDate, departureTime, transportMode, seatCapacity, basePrice) {
  try {
	if (!providerEmail || !source || !destination || !departureDate || !departureTime || !transportMode || !seatCapacity || !basePrice) {
    	throw new Error('Missing required parameters for adding a travel option.');
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

	console.log(`Submitting transaction: addTravelOption with args "${source}", "${destination}", "${departureDate}", "${departureTime}", "${transportMode}", "${seatCapacity}", "${basePrice}"`);
	const result = await contract.submitTransaction('addTravelOption', source, destination, departureDate, departureTime, transportMode, seatCapacity.toString(), basePrice.toString());
	console.log(`Transaction result: ${result.toString()}`);

	await gateway.disconnect();
	return result.toString();
  } catch (error) {
	console.error(`Failed to add travel option: ${error.response ? error.response.data : error.message}`);
	throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 8) {
	console.log('Usage: node serverAddTravelOption.js <providerEmail> <source> <destination> <departureDate> <departureTime> <transportMode> <seatCapacity> <basePrice>');
	process.exit(1);
  }
  addTravelOption(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
}

module.exports = addTravelOption;




