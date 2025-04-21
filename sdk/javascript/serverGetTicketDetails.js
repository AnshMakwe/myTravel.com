/*
 * serverGetTicketDetails.js
 * Get details of a specific ticket.
 */
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function getTicketDetails(ticketId) {
  try {
	if (!ticketId) {
    	throw new Error('Ticket ID is required to get ticket details.');
	}
	const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
	const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
 
	const walletPath = path.join(process.cwd(), 'wallet');
	const wallet = await Wallets.newFileSystemWallet(walletPath);
 
	const gateway = new Gateway();
	await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
 
	const network = await gateway.getNetwork('mychannel');
	const contract = network.getContract('stake');
 
	console.log(`Evaluating transaction: getTicketDetails with ticketId "${ticketId}"`);
	const result = await contract.evaluateTransaction('getTicketDetails', ticketId);
	console.log(`Transaction result: ${result.toString()}`);
 
	await gateway.disconnect();
	return result.toString();
  } catch (error) {
	console.error(`Failed to get ticket details: ${error.response ? error.response.data : error.message}`);
	throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
	console.log('Usage: node serverGetTicketDetails.js <ticketId>');
	process.exit(1);
  }
  getTicketDetails(args[0]);
}

module.exports = getTicketDetails;




