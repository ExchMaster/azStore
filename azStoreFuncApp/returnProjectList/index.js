//Load required modules
var azure = require('azure-storage');
var jwt = require("jsonwebtoken");

var connString = process.env.azStore;
var fileService = azure.createFileService(connString);

module.exports = function (context, req) {

    //Aquire Oauth token to enable making role determinations
    var strBearer = req.headers.authorization;
    decoded = jwt.decode(strBearer.slice(7));

    //Set up global variables 
    retVal = new Array();
    listShares = new Array();
    sharePerms = new Array();
    rAssigned = new Array();
    fullAccess = new Array();
    isFinished = new Boolean;
    numOfShares = 0;

    //Set roles from decoded Oauth token
    rAssigned = decoded.roles;

    //Call function to test if any roles are assigned, return 'No Access..' if no roles defined
    noRolesDefined();

    //Call function to test if the role defined is 'full access'.  Return all shares if found
    fullAccessDefined();

    //Call function to enumerate list of shares the specified user has any level of access to.
    enumAccessRoles();

    /********** Function List **********/

    function dedupeArray(arrShareList) {
        return arrShareList.filter(function (el, i, arr) {
            return arr.indexOf(el) === i;
        });
    }

    function noRolesDefined() {
        if (!rAssigned) {
            rAssigned = ["Not Authorized"];
            context.res = {
                body: rAssigned
            }
            context.done();
        };
    }

    function fullAccessDefined() {
        if (rAssigned.indexOf("connect_full_access") != -1) {
            //var connString = process.env.azStore;
            //var fileService = azure.createFileService(connString);
            fileService.listSharesSegmented(null, function (error, result, response) {
                if (!error) {
                    for (i = 0; i < result.entries.length; i++) {
                        fullAccess.push(result.entries[i].name);
                    }
                    fullAccess = dedupeArray(fullAccess);
                    context.res = {
                        body: fullAccess
                    };
                    context.done();
                } else {
                    context.res = {
                        body: error
                    };
                    context.done();
                }
            });
        };
    }

    function enumAccessRoles() {
        //var connString = process.env.azStore;
        //var fileService = azure.createFileService(connString);
        fileService.listSharesSegmented(null, function (error, result, response) {
            if (!error) {
                this.numOfShares = result.entries.length;
                for (i = 0; i < result.entries.length; i++) {
                    listShares.push(result.entries[i]);
                }
                for (i = 0; i < result.entries.length; i++) {
                    //context.log(JSON.stringify(listShares[i].name));
                    fileService.getShareMetadata(listShares[i].name, function (error, result, response) {
                        if (!error) {
                            //context.log(JSON.stringify(result))
                            this.sharePerms.push(JSON.stringify(result));
                            //context.log(JSON.stringify(sharePerms));
                            if (this.sharePerms.length == this.listShares.length) {
                                for (i = 0; i < this.rAssigned.length; i++) {
                                    rSearch = this.rAssigned[i];
                                    for (x = 0; x < this.sharePerms.length; x++) {
                                        var searchMetadata = JSON.parse(this.sharePerms[x]);
                                        var arrMetadata = Object.values(searchMetadata.metadata);
                                        if (arrMetadata.indexOf(rSearch) != -1) {
                                            this.retVal.push(searchMetadata.name);
                                        };
                                    };
                                };
                                this.retVal = dedupeArray(this.retVal);
                                context.res = {
                                    body: this.retVal
                                };
                                context.done();
                            };
                        };
                        //TODO: Error handling
                    });

                }
                //TODO: Error handling
            } else {
                //TODO: Error handling
            }
        });
    }
};