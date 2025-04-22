
'use strict';
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function registerUserOrg2() {
	try {
		const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json');
		const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
		const caURL = ccp.certificateAuthorities['ca.org2.example.com'].url;
		const ca = new FabricCAServices(caURL);
		const walletPath = path.join(process.cwd(), 'wallet');
		const wallet = await Wallets.newFileSystemWallet(walletPath);
		console.log(`Wallet path: ${walletPath}`);
		const userIdentity = await wallet.get('appUserOrg2');
		if (userIdentity) {
			console.log('An identity for the user "appUserOrg2" already exists in the wallet');
			return;
		}
		const adminIdentity = await wallet.get('adminOrg2');
		if (!adminIdentity) {
			console.log('An identity for the admin user "adminOrg2" does not exist in the wallet');
			console.log('Run the enrollAdminOrg2.js application before retrying');
			return;
		}
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, 'adminOrg2');
		const secret = await ca.register({
			affiliation: 'org2.department1',
			enrollmentID: 'appUserOrg2',
			role: 'client',
			attrs: [{ name: 'role', value: 'minter', ecert: true }]
		}, adminUser);
		const enrollment = await ca.enroll({
			enrollmentID: 'appUserOrg2',
			enrollmentSecret: secret,
			attr_reqs: [{ name: 'role', optional: false }]
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: 'Org2MSP',
			type: 'X.509',
		};
		await wallet.put('appUserOrg2', x509Identity);
		console.log('Successfully registered and enrolled user "appUserOrg2" and imported it into the wallet');
	} catch (error) {
		console.error(`Failed to register user "appUserOrg2": ${error}`);
		process.exit(1);
	}
}
module.exports = registerUserOrg2;




