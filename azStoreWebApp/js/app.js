window.addEventListener('load', init, false);

function init() {
    var authURL = "/.auth/me"
    delResource = null;
    today = new Date();
    tick = today.getTime();
    call_retries = 0;
    account = {
        name: 'azstore',
        sas: null,
        perm: null
    };
    uname = '';
    projectToken = null;
   
    blobUri = 'https://' + account.name + '.blob.core.usgovcloudapi.net';
    fileUri = 'https://' + account.name + '.file.core.usgovcloudapi.net';
    var fileShare = '';
    var currentPath = '';
    var currentPath = [];
    //**Test Modal Code */

    // Get the modal
    modal = document.getElementById('myModal');

    // Get the button that opens the modal
    //var btn = document.getElementById("myBtn");

    // Get the <span> element that closes the modal
    span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal 
    //btn.onclick = function () {
    //   modal.style.display = "block";
    //}
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    document.getElementById('files').addEventListener('change',displayFileCount,false);
    function displayFileCount(){
        var count = document.getElementById('files').files.length
        document.getElementById('numFilesSelected').innerText = count + " Selected";
    }

    // When the user clicks on <span> (x), close the modal
    document.getElementById('modalX').addEventListener('click',closeModal,false);
    function closeModal(){
        document.getElementById('myModal').style.display='none'
    }
    document.getElementById('toggle').addEventListener('click',toggleVisibility,false);
    function toggleVisibility() {
        var viewOptionHelp = document.getElementById("optionHelp");
       if(viewOptionHelp.style.display == 'block'){
          viewOptionHelp.style.display = 'none';
       }else{
          viewOptionHelp.style.display = 'block';
       }
       console.log("testfunc");
    }

    document.getElementById('finalDelete').addEventListener('click',performDelete,false);
    function performDelete() {
        if (delResourceType == 'dir') {
        deleteDirectory(delResource);
        }
        if (delResourceType == 'file'){
            deleteFile(delResource);
        }
        modal.style.display = "none";

    }
    

    //**End Modal Code */

    //**Setup select files button */
    document.getElementById('select-button').addEventListener('click',selectFiles,false);

    function selectFiles() {
        document.getElementById('select-button');
        var files = document.getElementById('files');
        files.click();
    }

    //**Set up cancel button on modal*/
    document.getElementById('modalCancel').addEventListener('click',closeModal,false);
    


    fetch(authURL)
        .then(function (response) {
            return response.json();
        })
        .then(function (myJson) {
            if (myJson.length == 0) {
                document.getElementById('sasStatus').textContent = "Authentication information incomplete, close browser and restart session."
                return;
            } else {
                var authDetails = myJson;
                uname = authDetails[0].user_id;
            }
            document.getElementById('username').innerHTML = 'Signed in as: <b>' + uname + '</b>';

            var authContext = new AuthenticationContext({
                clientId: 'f033d015-bb17-4287-91e3-afd493cf8594',
                instance: 'https://login.microsoftonline.us/',
                postLogoutRedirectUri: 'https://jaitestweb.azurewebsites.us/.auth/logout/complete',
                extraQueryParameter: 'login_hint=' + uname
            });
            if (authContext.isCallback(window.location.hash)) {
                // Handle redirect after token requests
                authContext.handleWindowCallback();
            }

            authContext.acquireToken(
                'https://jaitestfunc.azurewebsites.us',
                function (error, token) {

                    if (error || !token) {
                        // TODO: Handle error obtaining access token
                        document.getElementById('sasStatus').textContent =
                            'ERROR:\n\n' + error;
                        return;
                    }
                    projectToken = token;
                    // Use the access token
                    //getCurrentUser(projectToken);
                    getProjectList(projectToken);
                }
            );

        });
    //document.getElementById('username').textContent = 'Signed in as: ' + user.userName;

    //document.getElementById('username').textContent = 'Signed in as: ' + user.userName;
    //document.getElementById('sasStatus').textContent = 'Getting access token...';

}

function getTick() {
    today = new Date();
    tick = today.getTime();
    return tick;
}

function getCurrentUser(access_token) {
    document.getElementById('sasStatus').textContent = 'Calling API...';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://jaitestfunc.azurewebsites.us/api/genASAS', true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // Do something with the response
            account.sas = "?" + xhr.responseText;
            document.getElementById('sasStatus').textContent = "Token obtained, good to go";
        } else {
            // TODO: Do something with the error (or non-200 responses)
            //document.getElementById('sasStatus').textContent = 'ERROR:\n\n' + xhr.responseText;
        }
    };
    xhr.send();
}

function responseTimeout(xhr) {
    xhr.abort();
    if (call_retries < 10) {
        console.log("Retry: " + call_retries);
        var progress = "...";
        for (i=0;i <= call_retries;i++ ){
            progress = progress + "...";
        };
        document.getElementById('sasRetry').textContent = progress;
        getProjectList(projectToken);
        call_retries++;
    }
}

function getProjectList(access_token) {
    document.getElementById('sasStatus').textContent = 'Calling API...';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://jaitestfunc.azurewebsites.us/api/returnProjectList', true);
    xhr.timeout = 3000;
    xhr.onerror = () => setTimeout(function () {
        console.log(xhr);
    }, 5000);
    xhr.ontimeout = () => setTimeout(function () {
        responseTimeout(xhr);
    }, 2000);
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // Do something with the response

            var arrProjectList = JSON.parse(xhr.responseText);
            //console.log(arrProjectList);

            populateList(arrProjectList);
            if (arrProjectList.indexOf("Not Authorized") != -1) {
                document.getElementById('sasStatus').textContent = "User is not authorized for access";
            } else {
                document.getElementById('sasRetry').textContent = "";
                document.getElementById('sasStatus').textContent = "Ready. Select a project from the list";
                
            };

        } else {

            console.log(xhr.responseText);
            // TODO: Do something with the error (or non-200 responses)
            //document.getElementById('sasStatus').textContent = 'ERROR:\n\n' + xhr.responseText;
        }
    };
    xhr.send();
}

function getSSAS() {
    var projectList = document.getElementById('projectList');
    var selectedListValue = projectList.options[projectList.selectedIndex].value;
    var data = {
        container: selectedListValue
    };
    var dataStringified = JSON.stringify(data);
    var xhr = new XMLHttpRequest();

    xhr.open('POST', 'https://jaitestfunc.azurewebsites.us/api/genSSAS', true);
    xhr.timeout = 3000;
    xhr.onerror = () => setTimeout(function () {
        console.log(xhr);
    }, 5000);
    xhr.ontimeout = () => setTimeout(function () {
        responseTimeout(xhr);
    }, 2000);
    xhr.setRequestHeader('Authorization', 'Bearer ' + projectToken);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // Do something with the response

            //var arrProjectList = JSON.parse(xhr.responseText);
            //console.log(arrProjectList);
            //populateList(arrProjectList);
            var tempsas = JSON.parse(xhr.responseText);
            account.sas = "?" + tempsas.token;
            account.perm = tempsas.perm;
            viewFileShare()

            //document.getElementById('sasStatus').textContent = xhr.responseText;
        } else {

            console.log(xhr.responseText);
            // TODO: Do something with the error (or non-200 responses)
            //document.getElementById('sasStatus').textContent = 'ERROR:\n\n' + xhr.responseText;
        }
    };
    xhr.send(dataStringified);
}

function callLogout() {
    //Reset global variables in preparation for logout
    account = {
        name: null,
        sas: null
    };
    call_retries = 0;
    projectToken = null;
    blobUri = null;
    fileUri = null;
    var fileShare = '';
    var currentPath = '';
    var currentPath = [];
    var authContext = new AuthenticationContext({
        clientId: 'f033d015-bb17-4287-91e3-afd493cf8594',
        instance: 'https://login.microsoftonline.us/',
        postLogoutRedirectUri: 'https://jaitestweb.azurewebsites.us/.auth/logout/complete',
        extraQueryParameter: 'login_hint=' + uname
    });
    uname = '';
    authContext.clearCache();
    authContext.logOut();
    authContext = null;
}

function populateList(arrProjectList) {
    arrProjectList.sort();
    var listOptions = document.getElementById("projectList");
    listOptions.options[0] = new Option('--Select Project--', '');
    for (i = 0; i < arrProjectList.length; i++) {
        listOptions.options[i + 1] = new Option(arrProjectList[i], arrProjectList[i]);
    };

}

function checkParameters() {


    if (account.name == null || account.name.length < 1) {
        alert('Please enter a valid storage account name!');
        return false;
    }
    if (account.sas == null || account.sas.length < 1) {
        alert('Please enter a valid SAS Token!');
        return false;
    }

    return true;
}

function getFileService() {
    if (!checkParameters()) {
        return null;
    };
    var fileService = AzureStorage.File.createFileServiceWithSas(fileUri, account.sas).withFilter(new AzureStorage.File.ExponentialRetryPolicyFilter());
    return fileService;
}

function refreshFileShareList() {
    var fileService = getFileService();
    if (!fileService)
        return;

    document.getElementById('result').innerHTML = 'Loading...';
    fileService.listSharesSegmented(null, function (error, results) {
        if (error) {
            alert('List file share error, please open browser console to view detailed error');
            console.log(error);
        } else {
            var output = [];
            output.push('<tr>',
                '<th>Project Name</th>',
                '<th>ShareETag</th>',
                '<th>ShareQuota</th>',
                '<th>LastModified</th>',
                '<th>Operations</th>',
                '</tr>');
            if (results.entries.length < 1) {
                output.push('<tr><td>Empty results...</td></tr>');
            }
            for (var i = 0, share; share = results.entries[i]; i++) {
                output.push('<tr>',
                    '<td>', share.name, '</td>',
                    '<td>', share.etag, '</td>',
                    '<td>', share.quota, '</td>',
                    '<td>', share.lastModified, '</td>',
                    '<td>', '<button class="w3-button w3-round-xlarge w3-highway-red genBtn" onclick="deleteFileShare(\'', share.name, '\')">Delete</button> ',
                    '<button class="w3-button w3-round-xlarge w3-highway-green genBtn" onclick="viewFileShare(\'', share.name, '\')">Select</button>', '</td>',
                    '</tr>');
            }
            document.getElementById('result').innerHTML = '<table class="w3-table-all">' + output.join('') + '</table>';
        }
    });
}

function deleteFileShare(name) {
    var fileService = getFileService();
    if (!fileService)
        return;

    fileService.deleteShareIfExists(name, function (error, result) {
        if (error) {
            alert('Delete file share failed, open browser console for more detailed info.');
            console.log(error);
        } else {
            //alert('Delete ' + name + ' successfully!');
            refreshFileShareList();
        }
    });
}

function createFileShare() {
    var fileService = getFileService();
    if (!fileService)
        return;

    var share = document.getElementById('newfileshare').value.trim().toLowerCase();
    share = share.replace(/\s/g, '');
    if (!AzureStorage.File.Validate.shareNameIsValid(share, function (err, res) {})) {
        alert('Invalid share name!');
        return;
    }

    fileService.createShareIfNotExists(share, function (error, result) {
        if (error) {
            alert('Create file share failed, open browser console for more detailed info.');
            console.log(error);
        } else {
            //alert('Create ' + share + ' successfully!');
            //refreshFileShareList();
            getProjectList(projectToken);
        }
    });
}

function viewFileShare() {
    var projectList = document.getElementById('projectList');
    var selectedListValue = projectList.options[projectList.selectedIndex].value;
    fileShare = selectedListValue;
    if (account.perm == "read") {
        var newDirbtn = document.getElementById('newDirectory');
        var upFilesbtn = document.getElementById('upload-button');
        newDirbtn.disabled = true;
        upFilesbtn.disabled = true;
    };
    if (account.perm == "readwrite") {
        var newDirbtn = document.getElementById('newDirectory');
        var upFilesbtn = document.getElementById('upload-button');
        newDirbtn.disabled = false;
        upFilesbtn.disabled = false;
    };

    //document.getElementById('container').value = fileShare
    //alert('Selected ' + fileShare + ' !');
    currentPath = [];
    refreshDirectoryFileList();
}

function backDirectory() {
    var fileService = getFileService();
    if (!fileService)
        return;

    if (fileShare.length < 1) {
        alert('Please select one file share!');
        return;
    }

    if (currentPath.length > 0)
        currentPath.pop();

    refreshDirectoryFileList();
}

function operationsPermitted() {
    if (account.perm == "read") {
        var ops = "Permission - Read-Only";
        return ops;
    };
    if (account.perm == "readwrite") {
        var ops = "Permission - Read + Write"
        return ops;
    };
}

function convertToMB(conLength) {
    //Convert to KiloBytes and then to MegaBytes
    conLength = ((conLength / 1024)) / 1024;
    //Converts number to string, ensures only two decimal places deep 
    conLength = conLength.toFixed(2);
    return conLength;
}

function refreshDirectoryFileList(directory) {
    document.getElementById('userComms').innerHTML = "";
    var fileService = getFileService();
    if (!fileService)
        return;

    if (fileShare.length < 1) {
        alert('Please select one file share!');
        return;
    }

    if (typeof directory === 'undefined')
        var directory = '';
    if (directory.length > 0)
        currentPath.push(directory);
    directory = currentPath.join('\\\\');

    document.getElementById('directoryFiles').innerHTML = 'Loading...';
    fileService.listFilesAndDirectoriesSegmented(fileShare, directory, null, function (error, results) {
        if (error) {
            alert('List directories and files error, please open browser console to view detailed error');
            console.log(error);
        } else {
            if (directory.length < 1) {
                document.getElementById('path').innerHTML = "Root of project tree";
            } else {
                document.getElementById('path').innerHTML = directory;
            }


            var outputDirectory = [];
            outputDirectory.push('<tr>',
                '<th>Type</th>',
                '<th>Name</th>',
                '<th>Size (MB)</th>',
                '<th>', operationsPermitted(), '</th>',
                '</tr>');
            if (results.entries.directories.length < 1 && results.entries.files.length < 1) {
                outputDirectory.push('<tr><td>Empty results...</td></tr>');
            }
            for (var i = 0, dir; dir = results.entries.directories[i]; i++) {
                outputDirectory.push('<tr>',
                    '<td>', 'DIR', '</td>',
                    '<td>', dir.name, '</td>',
                    '<td>', dir.contentLength, '</td>',
                    '<td>', '<button class="w3-button w3-round-xlarge w3-highway-red genBtn isDeletable" onclick="confirmDelete(\'', dir.name, '\', \'dir\')" disabled>Delete</button> ',
                    '<button class="w3-button w3-round-xlarge w3-highway-green genBtn" onclick="refreshDirectoryFileList(\'', dir.name, '\')">View</button>', '</td>',
                    '</tr>');
            };
            var outputFiles = [];
            var currentDir = currentPath.join('\\');
            if (currentPath.length > 0)
                currentDir += '/';

            for (var i = 0, file; file = results.entries.files[i]; i++) {
                outputFiles.push('<tr>',
                    '<td>', 'FILE', '</td>',
                    '<td>', file.name, '</td>',
                    '<td>', convertToMB(file.contentLength), '</td>',
                    '<td>', '<button class="w3-button w3-round-xlarge w3-highway-red genBtn isDeletable" onclick="confirmDelete(\'', file.name, '\', \'file\')" disabled>Delete</button> ',
                    '<a class="w3-button w3-round-xlarge w3-highway-green genBtn" target="_blank" href="', fileUri + '/' + fileShare + '/' + currentDir + file.name + account.sas, '" download>Download</a>', '</td>',
                    '</tr>');
            }
            document.getElementById('directoryFiles').innerHTML = '<table class="w3-table-all">' + outputDirectory.join('') + outputFiles.join('') + '</table>';
        }
        if (account.perm == "readwrite") {
            var delButtons = document.getElementsByClassName('isDeletable');
            if (delButtons) {
                for (i = 0; i < delButtons.length; i++) {
                    delButtons[i].disabled = false;
                };
            };


        };

    });
}

function confirmDelete(name,resType){
    delResource = name;
    delResourceType = resType;
    var prompt = "Are you sure you want to delete '" + name + "'?"
    document.getElementById('delSpecContent').innerHTML = prompt;
    modal.style.display = "block";
}

function deleteDirectory(name) {
    var fileService = getFileService();
    if (!fileService)
        return;
    if (fileShare.length < 1) {
        alert('Please select a file share!');
        return;
    }

    fileService.deleteDirectoryIfExists(fileShare, currentPath.join('\\\\') + '\\' + name, function (error, results) {
        if (error) {
            if (error.statusCode == 409 && error.code == "DirectoryNotEmpty") {
                document.getElementById('userComms').innerHTML = "<b>Error: The specified directory is not empty<b>";
            }
            //alert('Delete directory failed, open browser console for more detailed info.');
            console.log(error);
        } else {
            document.getElementById('userComms').innerHTML = "";
            //alert('Delete ' + name + ' successfully!');
            refreshDirectoryFileList();
        }
    });
    delResource = null;
    delResourceType = null;
}

function deleteFile(file) {
    var fileService = getFileService();
    if (!fileService)
        return;

    fileService.deleteFileIfExists(fileShare, currentPath.join('\\\\'), file, function (error, results) {
        if (error) {
            alert('Delete file failed, open browser console for more detailed info.');
            console.log(error);
        } else {
            document.getElementById('userComms').innerHTML = "";
            //alert('Delete ' + file + ' successfully!');
            refreshDirectoryFileList();
        }
    });
    delResource = null;
    delResourceType = null;
}

function createDirectory() {
    var fileService = getFileService();
    if (!fileService)
        return;

    var directoryName = document.getElementById('newDirName').value;
    fileService.createDirectoryIfNotExists(fileShare, currentPath.join('\\\\') + '\\' + directoryName, function (error, results) {
        if (error) {
            alert('Create directory failed, open browser console for more detailed info.');
            console.log(error);
        } else {
            //alert('Create ' + directoryName + ' successfully!');
            refreshDirectoryFileList();
        }
    });
}

function displayProcess(process) {
    document.getElementById('progress').style.width = process + '%';
    document.getElementById('progress').innerHTML = process + '%';
}

function createFileFromStream(checkMD5) {
    var files = document.getElementById('files').files;
    
    if (!files.length) {
        alert('Please select a file!');
        return;
    }
    for (i = 0; i < files.length; i++) {
        var file = files[i];

        var fileService = getFileService();
        if (!fileService)
            return;

        var btn = document.getElementById("upload-button");
        btn.disabled = true;
        btn.innerHTML = "Uploading";
        var finishedOrError = false;
        var options = {
            contentSettings: {
                contentType: file.type
            },
            storeFileContentMD5: checkMD5
        };

        var speedSummary = fileService.createFileFromBrowserFile(fileShare, currentPath.join('\\\\'), file.name, file, options, function (error, result, response) {
            finishedOrError = true;
            btn.disabled = false;
            btn.innerHTML = "Upload";
            if (error) {
                alert("Upload failed, open browser console for more detailed info.");
                console.log(error);
                displayProcess(0);
            } else {
                displayProcess(100);
                setTimeout(function () { // Prevent alert from stopping UI progress update
                    //alert('Upload successfully!');
                }, 1000);
                refreshDirectoryFileList();
            }
        });

        speedSummary.on('progress', function () {
            var process = speedSummary.getCompletePercent();
            displayProcess(process);
        });
    }
}