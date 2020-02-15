'use strict';

/**
 * This is a Node.JS application to Approve a New User on the Network
 */

const helper = require('./contractHelper');

/*var args = process.argv.slice(2);

let name = args[0].toString();retailDrug (ctx,drugName, serialNo, retailerCRN, customerAadhar
let aadharNo = args[1].toString();*/ 

async function main(drugName, serialNo, retailerCRN, customerAadhar) {

	try {
		const pharmanetContract = await helper.getContractInstance();

		
		console.log('.....Requesting retail drug on the Network');
		const retailDrugBuffer = await pharmanetContract.submitTransaction('retailDrug', drugName, serialNo, retailerCRN, customerAadhar);

		// process response
		console.log('.....Processing retail drug Transaction Response \n\n');
		let drugOb = JSON.parse(retailDrugBuffer.toString());
		console.log(drugOb);
		console.log('\n\n.....retail drug Transaction Complete!');
		return drugOb;

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
