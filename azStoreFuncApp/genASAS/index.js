var azure = require('azure-storage');
var jwtdecode = require("jwt-decode");
module.exports = async function (context, req) {
    //context.log('JavaScript HTTP trigger function processed a request.');
    var headers = JSON.parse(JSON.stringify(req.headers));
    var strBearer = req.headers.authorization;
    //context.log('Request Headers = ', JSON.stringify(req.headers));
    var decoded = jwtdecode(strBearer.slice(7));
    
    const start = new Date(new Date().getTime() - (15 * 60 * 1000));
    const end = new Date(new Date().getTime() + (120 * 60 * 1000));
    const sharedAccessPolicy = {
	    AccessPolicy: {
		    Permissions: 'rwdlac',
		    Services: 'bf',
		    ResourceTypes: 'sco',
		    Start: start,
		    Expiry: end,
		    Protocols: 'https'
	    }
    };
    
    //const asas = azure.generateAccountSharedAccessSignature(process.env.AZURE_STORAGE_CONNECTION_STRING, process.env.AZURE_STORAGE_ACCESS_KEY, sharedAccessPolicy);
    const asas = azure.generateAccountSharedAccessSignature(process.env.AZURE_STORAGE_CONNECTION_STRING, null, sharedAccessPolicy);
    
    context.res = {
            // status: 200, /* Defaults to 200 */
            body: asas
        };
    context.log(process.env.AZURE_STORAGE_CONNECTION_STRING);
    context.log(process.env.AZURE_STORAGE_ACCESS_KEY);
    context.log(sharedAccessPolicy);
    context.log(asas);




    /*if (req.query.name || (req.body && req.body.name)) {
        context.res = {
            // status: 200, Defaults to 200 
            body: "Hello"
        };
    } else {
        context.res = {
            status: 200,
            body: "Hello"
        };
    }*/
};