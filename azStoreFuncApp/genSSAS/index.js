//Required packages 
// - 'azure-storage' is the node javascript module from Azure SDK for storage management
// - 'jsonwebtoken' is required to properly decode token
// NOTE:  Token validation is performed by platform (Azure AD) prior to function invocation
var azure = require('azure-storage');
var jwt = require('jsonwebtoken');

//Set up Azure File client
// - Ensure storage account connection string is defined in app settings, key value of azStore
// - Sets up fileService client for connection reuse scaling
var connString = process.env.azStore;
var fileService = azure.createFileService(connString);

module.exports = function (context, req) {
    if (typeof req.body != "undefined" && typeof req.body.container != "undefined") {

        //Pull Oauth token and decode
        var strBearer = req.headers.authorization;
        decoded = jwt.decode(strBearer.slice(7));

        //Set up global variables 
        rAssigned = new Array();
        shareName = req.body.container;
        permRead = "rl"; //Provides read & list permissions
        permWrite = "rwdl"; //Provides read, write, delete, list permissions

        //Set roles from decoded Oauth token
        rAssigned = decoded.roles;

        //Test if any roles are assigned to user, return 'Not Authorized' if no roles defined
        if (!rAssigned) {
            rAssigned = ["Not Authorized"];
            context.res = {
                status: 200,
                body: rAssigned
            };
            context.done();
        } else {
            //Set all roles to lowercase
            for (i = 0; i < rAssigned.length; i++) {
                rAssigned[i] = rAssigned[i].toLowerCase();
            };
            //Test if user is member of admin role, if so then grant access irrespective of share request
            if (rAssigned.indexOf("connect_full_access") != -1) {
                context.res.body = generateSasToken(shareName, permWrite);
                context.done();
            } else {
                //Test if the provided share name actually exists, return "Share does not exist" if share does not exist
                fileService.doesShareExist(shareName, function (error, result, response) {
                    if (!error && result.exists) {
                        //Determine if user 1) Has permission to share 2) If that permission is read or read/write
                        fileService.getShareMetadata(shareName, function (error, result, response) {
                            if (!error && result) {
                                //Has metadata been defined for the share
                                if (result.metadata.read && result.metadata.readwrite) {
                                    //Make sure assigned roles match read OR readwrite
                                    if (rAssigned.indexOf(result.metadata.readwrite.toLowerCase()) != -1 || rAssigned.indexOf(result.metadata.read.toLowerCase()) != -1) {
                                        if (rAssigned.indexOf(result.metadata.readwrite.toLowerCase()) != -1) {
                                            //If readwrite access is found, gen token and done
                                            context.res.body = generateSasToken(shareName, permWrite);
                                            context.done();
                                        } else {
                                            //If not readwrite, then assign read access, gen token, and done.
                                            context.res.body = generateSasToken(shareName, permRead);
                                            context.done();
                                        };
                                    } else {
                                        //Neither read or readwrite permissions have been assigned
                                        context.res = {
                                            status: 200,
                                            body: ["Access to this role has not been assigned"]
                                        };
                                        context.done();
                                    }

                                } else {
                                    context.res = {
                                        status: 200,
                                        body: ["Project share exists, but share metadata has not been updated."]
                                    };
                                    context.done();
                                };
                            };
                        });
                    } else {
                        var doesNotExist = ["Share does not exist"];;
                        context.res = {
                            body: doesNotExist
                        };
                        context.done();
                    }
                });
            }
        };
    } else {
        context.res = {
            status: 400,
            body: "Specify a value for 'container'"
        };
        context.done();
    }

    //***********Function List*******************

    function generateSasToken(container, permissions) {
        // Create a SAS token that expires in two hours
        // Set start time to five minutes ago to avoid clock skew.
        var startDate = new Date();
        startDate.setMinutes(startDate.getMinutes() - 5);
        var expiryDate = new Date(startDate);
        expiryDate.setMinutes(startDate.getMinutes() + 120);

        //Determine permission level for return to browser
        if (permissions == "rwdl") {
            var perm = "readwrite";
        } else {
            var perm = "read";
        };

        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: permissions,
                Start: startDate,
                Expiry: expiryDate
            }
        };
        //Necessary to ensure no issues with conditional headers in browser
        var headers = {
            cacheControl: "no-cache, no-store, must-revalidate"
        };

        var sasToken = fileService.generateSharedAccessSignature(container, "", "", sharedAccessPolicy, headers)

        return {
            token: sasToken,
            perm: perm
        };
    }
};