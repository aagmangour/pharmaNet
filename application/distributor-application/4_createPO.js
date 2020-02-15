'use strict';

/**
 * This is a Node.JS application to Approve a New User on the Network
 */

const helper = require('./contractHelper');

/*var args = process.argv.slice(2);

let name = args[0].toString();
let aadharNo = args[1].toString();*/

async function main(buyerCRN, sellerCRN, drugName, quantity) {

	try {
		const pharmanetContract = await helper.getContractInstance();

		
		console.log('.....Requesting to create a PO on the Network');
		const createPOBuffer = await pharmanetContract.submitTransaction('createPO', buyerCRN, sellerCRN, drugName, quantity);

		// process response
		console.log('.....Processing Approve PO Transaction Response \n\n');
		let po = JSON.parse(createPOBuffer.toString());
		console.log(po);
		console.log('\n\n.....PO Transaction Complete!');
		return po;

	} catch (error) {

		console.log(`\n\n ${error} \n\n`);
		throw new Error(error);

	} finally {

		// Disconnect from the fabric gateway
		helper.disconnect();

	}
}

/*main(name, aadharNo).then(() => {
	console.log('Approve New User Submitted on the Network');
});*/

module.exports.execute = main;
