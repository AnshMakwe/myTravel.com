
'use strict';
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
async function registerUser() {
	try {
		const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
		const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
		console.log(ccp);
		const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
		const ca = new FabricCAServices(caURL);
		const walletPath = path.join(process.cwd(), 'wallet');
		console.log(walletPath);
		const wallet = await Wallets.newFileSystemWallet(walletPath);
		console.log(`Wallet path: ${walletPath}`);
		const userIdentity = await wallet.get('appUser');
		if (userIdentity) {
			console.log('An identity for the user "appUser" already exists in the wallet');
			return;
		}
		const adminIdentity = await wallet.get('admin');
		if (!adminIdentity) {
			console.log('An identity for the admin user "admin" does not exist in the wallet');
			console.log('Run the enrollAdmin.js application before retrying');
			return;
		}
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, 'admin');
		const secret = await ca.register({
			affiliation: 'org1.department1',
			enrollmentID: 'appUser',
			role: 'client',
			attrs: [{ name: 'role', value: 'minter', ecert: true }]
		}, adminUser);
		const enrollment = await ca.enroll({
			enrollmentID: 'appUser',
			enrollmentSecret: secret,
			attr_reqs: [{ name: 'role', optional: false }]
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: 'Org1MSP',
			type: 'X.509',
		};
		await wallet.put('appUser', x509Identity);
		console.log('Successfully registered and enrolled user "appUser" and imported it into the wallet');
	} catch (error) {
		console.error(`Failed to register user "appUser": ${error}`);
		process.exit(1);
	}
}
module.exports = registerUser;




