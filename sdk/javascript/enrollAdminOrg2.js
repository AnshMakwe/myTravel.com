'use strict';
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdminOrg2() {
	try {
 
    	const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json');
    	const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    	
    	const caInfo = ccp.certificateAuthorities['ca.org2.example.com'];
    	const caTLSCACerts = caInfo.tlsCACerts.pem;
    	const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
   
    	const walletPath = path.join(process.cwd(), 'wallet');
    	const wallet = await Wallets.newFileSystemWallet(walletPath);
    	console.log(`Wallet path: ${walletPath}`);
   
    	const identity = await wallet.get('adminOrg2');
    	if (identity) {
        	console.log('An identity for the admin user "adminOrg2" already exists in the wallet');
        	return;
    	}
    	// Enroll the admin user for Org2, and import the new identity into the wallet.
    	const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
    	const x509Identity = {
        	credentials: {
            	certificate: enrollment.certificate,
            	privateKey: enrollment.key.toBytes(),
        	},
        	mspId: 'Org2MSP',
        	type: 'X.509',
    	};
    	await wallet.put('adminOrg2', x509Identity);
    	console.log('Successfully enrolled admin user "adminOrg2" and imported it into the wallet');
	} catch (error) {
    	console.error(`Failed to enroll admin user "adminOrg2": ${error.message}`);
    	process.exit(1);
	}
}

module.exports = enrollAdminOrg2;




