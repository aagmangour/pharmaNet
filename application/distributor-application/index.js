const express = require('express');
const app = express();
const cors = require('cors');
const port = 4000;

// Import all function modules

const addToWallet = require('./1_addToWallet');
const registerCompany = require('./2_registerCompany');
const viewHistory = require('./8_viewHistory');
const viewDrugCurrentState = require('./9_viewDrugCurrentState');
const createPO = require('./4_createPO');
const createShipment = require('./5_createShipment');

// Define Express app settings
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set('title', 'Pharma network App');

app.get('/', (req, res) => res.send('Hello Distributor'));

app.post('/addToWallet/distributor', (req, res) => {
    addToWallet.execute(req.body.certificatePath, req.body.privateKeyPath).then (() => {
        console.log('User Credentials added to wallet');
        const result = {
            status: 'success',
            message: 'User credentials added to wallet'
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.post('/viewHistory', (req, res) => {
    viewHistory.execute(req.body.drugName, req.body.serialNo).then ((object) => {
        console.log('viewHistory request submitted on the Network');
        const result = {
            status: 'success',
            message: 'viewHistory request submitted on the Network',
            returnObject: object
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Failed',
            error: e
        };
        res.status(500).send(result);
    });
});

app.post('/viewDrugCurrentState', (req, res) => {
    viewDrugCurrentState.execute(req.body.drugName, req.body.serialNo).then ((object) => {
        console.log('viewDrugCurrentState request submitted on the Network');
        const result = {
            status: 'success',
            message: 'viewDrugCurrentStater request submitted on the Network',
            returnObject: object
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Failed',
            error: e
        };
        res.status(500).send(result);
    });
});
//companyCRN, companyName, Location, organisationRole
app.post('/registerCompany', (req, res) => {
    registerCompany.execute(req.body.companyCRN, req.body.companyName,req.body.Location,req.body.organisationRole).then ((object) => {
        console.log('registerCompany request submitted on the Network');
        const result = {
            status: 'success',
            message: 'registerCompany request submitted on the Network',
            returnObject: object
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Failed',
            error: e
        };
        res.status(500).send(result);
    });
});
//createPO (ctx,buyerCRN, sellerCRN, drugName, quantity)
app.post('/createPO', (req, res) => {
    createPO.execute(req.body.buyerCRN, req.body.sellerCRN,req.body.drugName,req.body.quantity).then ((object) => {
        console.log('PO request submitted on the Network');
        const result = {
            status: 'success',
            message: 'PO request submitted on the Network',
            returnObject: object
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Failed',
            error: e
        };
        res.status(500).send(result);
    });
});
//
app.post('/createShipment', (req, res) => {
    createShipment.execute(req.body.buyerCRN, req.body.drugName,req.body.listOfAssets,req.body.transporterCRN).then ((object) => {
        console.log('CREATE SHIPMENT request submitted on the Network');
        const result = {
            status: 'success',
            message: 'CREATE SHIPMENT request submitted on the Network',
            returnObject: object
        };
        res.json(result);
    })
    .catch((e) => {
        const result = {
            status: 'error',
            message: 'Failed',
            error: e
        };
        res.status(500).send(result);
    });
});
app.listen(port, () => console.log(`Pharma Net App listening on port ${port}!`));
