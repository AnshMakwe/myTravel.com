'use strict';
const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function registerCustomerDynamic({ enrollmentID, name, contact }) {
  try {
	if (!enrollmentID || !name || !contact) {
    	throw new Error('Enrollment ID, name, and contact are required for customer registration.');
	}
	// Load the connection profile for Org1.
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


	const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
	const ca = new FabricCAServices(caURL);


	const walletPath = path.join(process.cwd(), 'wallet');
	const wallet = await Wallets.newFileSystemWallet(walletPath);

	
	const existingIdentity = await wallet.get(enrollmentID);
	if (existingIdentity) {
  	throw new Error(`An identity for ${enrollmentID} already exists`);
	}


	const adminIdentity = await wallet.get('admin');
	if (!adminIdentity) {
  	throw new Error('Admin identity not found. Run enrollAdmin.js first.');
	}
	const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
	const adminUser = await provider.getUserContext(adminIdentity, 'admin');


	const secret = await ca.register(
  	{
    	affiliation: 'org1.department1',
    	enrollmentID: enrollmentID,
    	role: 'client',
    	attrs: [
      	{ name: 'role', value: 'customer', ecert: true },
      	{ name: 'name', value: name, ecert: true },
      	{ name: 'contact', value: contact, ecert: true }
    	]
  	},
  	adminUser
	);


	const enrollment = await ca.enroll({
  	enrollmentID: enrollmentID,
  	enrollmentSecret: secret,
  	attr_reqs: [{ name: 'role', optional: false }]
	});
	const x509Identity = {
  	credentials: {
    	certificate: enrollment.certificate,
    	privateKey: enrollment.key.toBytes()
  	},
  	mspId: 'Org1MSP',
  	type: 'X.509'
	};

	// Store the new identity in the wallet (using the email).
	await wallet.put(enrollmentID, x509Identity);
	console.log(`Successfully enrolled identity for ${enrollmentID}`);

	// Now invoke the chaincode to register the customer.
	const gw = new Gateway();
	await gw.connect(ccp, {
  	wallet,
  	identity: enrollmentID,
  	discovery: { enabled: true, asLocalhost: true }
	});
	const network = await gw.getNetwork('mychannel');
	const contract = network.getContract('stake');

	console.log(`Submitting chaincode transaction: registerCustomer with args "${name}", "${contact}"`);
	const result = await contract.submitTransaction('registerCustomer', name, contact);
	console.log(`Chaincode transaction result: ${result.toString()}`);

	await gw.disconnect();

	return { enrollmentID, name, contact, chaincodeResult: result.toString() };
  } catch (error) {
	throw new Error(`Failed to register customer: ${error.response ? error.response.data : error.message}`);
  }
}

module.exports = registerCustomerDynamic;




