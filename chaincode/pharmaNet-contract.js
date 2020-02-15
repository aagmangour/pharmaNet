"use strict";

const {Contract} = require('fabric-contract-api');

class PharmaContract extends Contract {
	
	constructor() {
        super('org.pharma-network.com-pharmanet'); 
	}
	
	// This is a basic user defined function used at the time of instantiating the smart contract
	// to print the success message on console
	async instantiate(ctx) {
		console.log('Pharma Smart Contract Instantiated');
	}
	
	/**
	* 
	* @param {*} ctx 
	* @param {*} companyCRN 
	* @param {*} companyName 
	* @param {*} Location 
	* @param {*} organisationRole 
	*/
	async registerCompany (ctx,companyCRN, companyName, Location, organisationRole){
		//comprises the Company Registration Number (CRN) and the Name of the company along with appropriate namespace
		let companyCrnNameKey = companyCRN+'-'+companyName;
		let comapanyCrnKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.companyCRN', [companyCRN]);
		var hierarchyKey 
		if (organisationRole == 'Manufacturer' || organisationRole == 'manufacturer')
			hierarchyKey = 1;
		else if(organisationRole == 'Distributor' || organisationRole == 'distributor')
			hierarchyKey = 2
		else if(organisationRole == 'Retailer' || organisationRole == 'retailer')
			hierarchyKey = 3;
	  
	   let companyObj={
		 m_comapanyID: companyCrnNameKey,
		 m_companyName: companyName,
		 m_Location: Location,
		 m_organisationRole: organisationRole,
		 m_hierarchyKey:hierarchyKey,
		 createdAt: new Date()
  };

        // Convert the JSON object to a buffer and send it to blockchain for storage
        let dataBuffer = Buffer.from(JSON.stringify(companyObj));
        await ctx.stub.putState(comapanyCrnKey, dataBuffer);

        console.log("@ company object created is :: ",companyObj);
        return companyObj;
}

      /**
      * 
      * @param {*} drugName 
      * @param {*} serialNo 
      * @param {*} mfgDate 
      * @param {*} expDate 
      * @param {*} companyCRN 
      */
	async addDrug (ctx,drugName, serialNo, mfgDate, expDate, companyCRN){
		this.isInitiatorValid(ctx, ['manufacturer.pharma-network.com']);
		let productKey = drugName+'-'+serialNo;
		let productRequestKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.product.drugkey', [productKey]);
		let ownerKey =  ctx.stub.createCompositeKey('org.pharma.network.pharmanet.companyCRN', [companyCRN]);//companyCRN
		let manufacturerKey =  companyCRN
		
		 let drugObj={
		   m_productID: productRequestKey,
		   m_drugName: drugName,
		   m_serialNo: serialNo,
		   m_mfgDate: mfgDate,
		   m_expDate: expDate,
		   m_owner: ownerKey,//Owner key will change on every transaction
		   m_manufacturer: manufacturerKey,// this will remain same throughout the life.,
		   m_shipmentList:[],
		   createdAt: new Date()
         };

	   // Convert the JSON object to a buffer and send it to blockchain for storage
	     let dataBuffer = Buffer.from(JSON.stringify(drugObj));
	     await ctx.stub.putState(productRequestKey, dataBuffer);
		 console.log("@ Drug Object is :: ",drugObj)
		 return drugObj;
    }
	
      /**
      * 
      * @param {*} buyerCRN 
      * @param {*} sellerCRN 
      * @param {*} drugName 
      * @param {*} quantity 
      */

	async createPO (ctx,buyerCRN, sellerCRN, drugName, quantity) {
		this.isInitiatorValid(ctx, ['retailer.pharma-network.com','distributor.pharma-network.com']);
		var productOrderKey = buyerCRN +'-'+drugName;
		const POcompositeKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.productorder', [productOrderKey]); 
		//create composite key of buyer and seller and save it in obj,
		const buyerCompositeKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.companyCRN',[buyerCRN]);
		const sellerCompositeKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.companyCRN',[sellerCRN]);
	   
		let requestBuyerComapnyBuffer= await ctx.stub
						  .getState(buyerCompositeKey)
						  .catch(err => console.log(err));
			
			
		let buyerObj = JSON.parse(requestBuyerComapnyBuffer.toString());

		let requestSellerComapnyBuffer= await ctx.stub
						  .getState(sellerCompositeKey)
						  .catch(err => console.log(err));
			
			
		let sellerObj = JSON.parse(requestSellerComapnyBuffer.toString());
		
		/* Check for heirarchy to transfer drug  manufacturer(1)->distributor(2)->retailer(3) */
        if(buyerObj.m_hierarchyKey-sellerObj.m_hierarchyKey!= 1) {
			throw new Error("Can not Create the Product Order, as hierarchy of transfer is not correct!!");
		}
          
		let productOrderObj={
		   drugName:drugName,
		   quantity:quantity,
		   poId:POcompositeKey,
		   buyerKey:buyerCompositeKey,
		   sellerKey:sellerCompositeKey //seller is current owner here
		}
		
		let poBuffer = Buffer.from(JSON.stringify(productOrderObj));
			await ctx.stub.putState(POcompositeKey, poBuffer);
			
		console.log("Product order is  :: ",productOrderObj)
		return productOrderObj;    
	}

    /**
	 * 
	 * @param {*} ctx 
	 * @param {*} buyerCRN 
	 * @param {*} drugName 
	 * @param {*} listOfAssets 
	 * @param {*} transporterCRN 
	 */
	async createShipment (ctx,buyerCRN, drugName, listOfAssets, transporterCRN ) {
	  this.isInitiatorValid(ctx, ['manufacturer.pharma-network.com','distributor.pharma-network.com']);
	  let productOrderKey = buyerCRN+"-"+drugName;
	  let getProductCompositeKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.productorder', [productOrderKey]); 
	  
	  let requestPoBuffer= await ctx.stub
						 .getState(getProductCompositeKey)
						 .catch(err => console.log(err));
		   
		   
	  let productOrder = JSON.parse(requestPoBuffer.toString());
	  let m_listOfAssets;
	  m_listOfAssets = listOfAssets.split(',');
	  console.log("listOfAssets.length = ",m_listOfAssets.length+"  productOrder.quantity :",productOrder.quantity);
	  
	  /* Validation check 1: length of ‘listOfAssets’ shouldßß be exactly equal to the quantity specified in the PO*/
	  if(productOrder.quantity != m_listOfAssets.length){
		throw new Error("Quantity of drug mentioned in Product order does not matches with number of assets!!"); 
	}
	  
	/*Validation check 2: The IDs of the Asset should be valid IDs which are registered on the network.*/
	  for(var i = 0 ; i < m_listOfAssets.length ;i++){
          //item in this list is the drug composite key.drugName+'-'+serialNo
		  let drugCompositeKey = await ctx.stub.createCompositeKey('org.pharma.network.pharmanet.product.drugkey',[m_listOfAssets[i]]);
		  let requestBuffer = ctx.stub
		                      .getState(drugCompositeKey).catch(err => console.log(err));
          if(requestBuffer.length === 0){
			throw new Error(" Error in getting assets details from ledger, Check error logs ");
		 } 
	  }
	  const sellerKey =productOrder.sellerKey;//sellercompositekey from nw

	  let requestSellerBuffer= await ctx.stub
						 .getState(sellerKey)
						 .catch(err => console.log(err));
	  
	  let sellerObject = JSON.parse(requestSellerBuffer.toString());
	  let sellerCRN = sellerObject.m_comapanyID.split('-');
	  //sellerCRN[0] is crn of seller company;
	  console.log("seller company name is :: ",sellerCRN[1]+" seller CRN is  :: ",sellerCRN[0])
	  
	  let creatorCompositeKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.companyCRN', [sellerCRN[0]]); 
	  let transporterCompositeKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.transporterKey', [transporterCRN]);

	  let shipmentObj={
			buyerCRN:buyerCRN,
			drugName:drugName,
			transporterCRN:transporterCRN,
			creator:creatorCompositeKey,
			m_AssetsList : m_listOfAssets,
			m_transporterDetails: transporterCompositeKey,
			m_status: "in-transit"
		}
	   var shipmentKey = buyerCRN +'-'+drugName;
	   const shipmentCompositeKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.shipmentkey', [shipmentKey]); 
       console.log("shipment object is :: ",shipmentObj);
	   let dataBuffer = Buffer.from(JSON.stringify(shipmentObj));
	   await ctx.stub.putState(shipmentCompositeKey, dataBuffer);

	   return shipmentObj;
	}
   
   /**
	* 
	* @param {*} buyerCRN 
	* @param {*} drugName 
	* @param {*} transporterCRN 
	*/
	async updateShipment(ctx,buyerCRN, drugName, transporterCRN) {
       this.isInitiatorValid(ctx, ['transporter.pharma-network.com']);

       var shipmentKey = buyerCRN +'-'+drugName;
       const shipmentCompositeKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.shipmentkey', [shipmentKey]); 
   
       let requestShipmentBuffer= await ctx.stub
						 .getState(shipmentCompositeKey)
						 .catch(err => console.log(err));
	  
	   let shipmentObject = JSON.parse(requestShipmentBuffer.toString());
	   
	   //If transporter crn is not same as that of present in shipment object, there is some issue
	   console.log("@123 shipment object is :: ",shipmentObject);
       if(transporterCRN != shipmentObject.transporterCRN){
		throw new Error("transporterCRN passed "+transporterCRN+" , does not matches with transporterCRN from shipment object "+shipmentObject.transporterCRN);
	   }
	  
	   shipmentObject.m_status = "delivered";
       console.log("length of list in shipment object is ",shipmentObject.m_AssetsList.length)
	   
	   //update the shipment object on the ledger
	   let modifiedShipmentObBuffer = Buffer.from(JSON.stringify(shipmentObject));
	   await ctx.stub.putState(shipmentCompositeKey, modifiedShipmentObBuffer);
	   console.log("shipment object is :: ", shipmentObject)
        
	   let drugCompositeObject ;
	   for(var i = 0 ; i < shipmentObject.m_AssetsList.length ;i++){
		
		 console.log(" updateShipment inside loop , drug key is :: ",shipmentObject.m_AssetsList[i]);
	     const getProductRequestKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.product.drugkey',[shipmentObject.m_AssetsList[i]]);
	
	     let requestProductBuffer= await ctx.stub
						 .getState(getProductRequestKey)
						 .catch(err => console.log(" error in getting state  :: ",err));

		if(requestProductBuffer.length === 0){
				throw new Error(" Error in getting assets details from ledger, Check error logs ");
		}

		drugCompositeObject = JSON.parse(requestProductBuffer.toString());
		console.log(" drugobject  is  :: ",drugCompositeObject);
		console.log(" owner of drug is  ::  ",drugCompositeObject.m_owner);
		drugCompositeObject.m_owner = buyerCRN;
		console.log(" owner of drug is changed to ::  ",drugCompositeObject.m_owner);
		drugCompositeObject.m_shipmentList.push(shipmentCompositeKey);
		 
		console.log(" Latest drug object after pushing  is  :: ", drugCompositeObject)
		 
		 //update the drug object on the ledger
		 let drugObBuffer = Buffer.from(JSON.stringify(drugCompositeObject));
		 await ctx.stub.putState(getProductRequestKey, drugObBuffer);
	}
		return shipmentObject;
 }

    /**
	 * @param {*} drugName 
	 * @param {*} serialNo 
	 * @param {*} retailerCRN 
	 * @param {*} customerAadhar 
	 */
 
	async retailDrug (ctx,drugName, serialNo, retailerCRN, customerAadhar){
		this.isInitiatorValid(ctx, ["retailer.pharma-network.com"]);
	    let drugKey = drugName+'-'+serialNo
	    const getProductRequestKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.product.drugkey', [drugKey]);
	    let requestProductBuffer= await ctx.stub
						 .getState(getProductRequestKey)
						 .catch(err => console.log(err));
		
		//Check if retailercrn is same as owner , i.e the permission to sell is with whom , who has purchased the drug
		let drugCompositeObject = JSON.parse(requestProductBuffer.toString());
		if(retailerCRN != drugCompositeObject.m_owner){
			throw new Error("retailer crn "+retailerCRN+" , does not matches with buyercrn from drug object "+drugCompositeObject.m_owner);
		}
		drugCompositeObject.m_owner = customerAadhar;

		let drugObBuffer = Buffer.from(JSON.stringify(drugCompositeObject));
		 await ctx.stub.putState(getProductRequestKey, drugObBuffer);
		
		console.log("Modified drug object with new owner identity is :: ",drugCompositeObject)
		return drugCompositeObject;
    }
  
    /**
	 * 
	 * @param {*} drugName 
	 * @param {*} serialNo 
	 */

     async viewHistory (ctx,drugName, serialNo){
	     this.isInitiatorValid(ctx, ['retailer.pharma-network.com','transporter.pharma-network.com','distributor.pharma-network.com','manufacturer.pharma-network.com','consumer.pharma-network.com']);
	     let drugCompositeKey = drugName+'-'+serialNo;
	     const getProductRequestKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.product.drugkey', [drugCompositeKey]);
	   //const historyIter = ctx.stub.getHistoryForKey(getProductRequestKey);
	
	   //let resultsIterator = await ctx.stub.getHistoryForKey(getProductRequestKey);
       //let method = this['getAllResults'];
       //let results = await method(resultsIterator, true);
		
	     let iterator = await ctx.stub.getHistoryForKey(getProductRequestKey).catch(err => console.log(err));;
         let result = [];
         let res = await iterator.next();
         while (!res.done) {
           if (res.value) {
             console.info(`Found state update with value: ${res.value.value.toString('utf8')}`);
             const obj = JSON.parse(res.value.value.toString('utf8'));
             result.push(obj);
           }
           res = await iterator.next();
         }
       await iterator.close();
       return result;

    //    return Buffer.from(JSON.stringify(results))
	  
    }
	/**
	 * 
	 * @param {*} ctx 
	 * @param {*} drugName 
	 * @param {*} serialNo 
	 */
	async viewDrugCurrentState (ctx,drugName, serialNo){
	   this.isInitiatorValid(ctx, ['retailer.pharma-network.com','transporter.pharma-network.com','distributor.pharma-network.com','manufacturer.pharma-network.com','consumer.pharma-network.com']);
	   let drugKey = drugName+'-'+serialNo
	   const getProductRequestKey = ctx.stub.createCompositeKey('org.pharma.network.pharmanet.product.drugkey', [drugKey]);
	   let requestProductBuffer= await ctx.stub
						 .getState(getProductRequestKey)
						 .catch(err => console.log(err));

	   let drugObject = requestProductBuffer.toString();
	   console.log("Current state of drug with name - "+drugName +"and serial no. - "+serialNo +" is :: "+drugObject)
	   return drugObject;
   }
   
   //Helper Methods
    /**
	 * 
	 * @param {*} ctx 
	 * @param {*} initiator 
	 */
	isInitiatorValid(ctx, initiator) {
		let flag = 0;
		const initiatorID = ctx.clientIdentity.getX509Certificate();
		initiator.forEach(function(orgs){
			if(initiatorID.issuer.organizationName.trim() === orgs){
			  flag = 1; 
			  //break;
		    }
		});
		if(flag == 0 ){
                throw new Error(initiatorID.issuer.organizationName + '  is not authorized to initiate this transaction');
        }
        console.log("@123 initiatorID.issuer.organizationName.trim() is :: ",initiatorID.issuer.organizationName.trim())
	 }
	 
	 //This is not useful as per the use case now.
	//  async getAllResults(iterator, isHistory) {
	//    let allResults = [];
	//     while (true) {
	// 	 let res = await iterator.next();
	
	// 	 if (res.value && res.value.value.toString()) {
	// 		 let jsonRes = {};
	// 		 console.log(res.value.value.toString('utf8'));
	
	// 		if (isHistory && isHistory === true) {
	// 		  jsonRes.TxId = res.value.tx_id;
	// 		  jsonRes.Timestamp = res.value.timestamp;
	// 		  jsonRes.IsDelete = res.value.is_delete.toString();
	// 		  try {
	// 			jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
	// 		  } catch (err) {
	// 			console.log(err);
	// 			jsonRes.Value = res.value.value.toString('utf8');
	// 		  }
	// 		} else {
	// 		  jsonRes.Key = res.value.key;
	// 		  try {
	// 			jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
	// 		  } catch (err) {
	// 			console.log(err);
	// 			jsonRes.Record = res.value.value.toString('utf8');
	// 		  }
	// 		}
	// 		allResults.push(jsonRes);
	// 	  }
	// 	  if (res.done) {
	// 		console.log('end of data');
	// 		await iterator.close();
	// 		console.info(allResults);
	// 		return allResults;
	// 	  }
	// 	}
	//   }
}
module.exports = PharmaContract;