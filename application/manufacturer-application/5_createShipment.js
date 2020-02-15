'use strict';

/**
 * This is a Node.JS application to Approve a New User on the Network
 */

const helper = require('./contractHelper');

/*var args = process.argv.slice(2);

let name = args[0].toString(); createShipment (ctx,buyerCRN, drugName, listOfAssets, transporterCRN
let aadharNo = args[1].toString();*/

async function main(buyerCRN, drugName, listOfAssets, transporterCRN) {

	try {
		const pharmanetContract = await helper.getContractInstance();

		
		console.log('..... Shipment creation request the Network');
		const shipmentBuffer = await pharmanetContract.submitTransaction('createShipment', buyerCRN, drugName, listOfAssets, transporterCRN);

		// process response
		console.log('.....Processing Shipment creation request Transaction Response \n\n');
		let shipmentOb = JSON.parse(shipmentBuffer.toString());
		console.log(shipmentOb);
		console.log('\n\n.....Shipment creation request the Transaction Complete!');
		return shipmentOb;

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
