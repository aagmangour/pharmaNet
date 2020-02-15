'use strict';

/**
 * This is a Node.JS application to Approve a New User on the Network
 */

const helper = require('./contractHelper');

/*var args = process.argv.slice(2);

let name = args[0].toString();
let aadharNo = args[1].toString();*/

async function main(drugName, serialNo, mfgDate, expDate, companyCRN) {

	try {
		const pharmanetContract = await helper.getContractInstance();

		
		console.log('.....Requesting Add drug on the Network');
		const drugBuffer = await pharmanetContract.submitTransaction('addDrug', drugName, serialNo, mfgDate, expDate, companyCRN);

		// process response
		console.log('.....Processing Add drug  Transaction Response \n\n');
		let drugObj = JSON.parse(drugBuffer.toString());
		console.log(drugObj);
		console.log('\n\n.....Add drug  Transaction Complete!');
		return drugObj;

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
