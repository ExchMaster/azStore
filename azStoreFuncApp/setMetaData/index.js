//Load required modules
var azure = require('azure-storage');

var connString = process.env.azStore;
var fileService = azure.createFileService(connString);

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    if (myTimer.isPastDue) {
        context.log('JavaScript is running late!');
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);
    fileService.listSharesSegmented(null, function (error, result, response) {
        if (!error) {
            for (i = 0; i < result.entries.length; i++) {
                var shareName = result.entries[i].name;
                var metadata = {
                    'read': 'connect_' + shareName + '_read',
                    'readwrite': 'connect_' + shareName + '_readwrite',
                };
                fileService.setShareMetadata(shareName, metadata, function (error, result, response) {
                    if (!error) {
                        console.log("ShareMetadata set for: " + result.name + " at " + timeStamp);
                    } else {
                        console.log(error);
                    }
                });
            }
        }
    });
};