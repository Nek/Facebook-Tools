var https = require('https');
var http = require('http');
var fs = require('fs');
var Futures = require('futures');
	
var app_id = '103011506473978';
var app_secret = '8b4a1b33c70ca91d8ad2b3dea81703e0';
var access_token = "";
var group_id = "180638415285895";

var all = "";

var stream;


var access_key_request_options = {
  	host: 'graph.facebook.com',
  	path: '/oauth/access_token?type=client_cred&client_id='+app_id+'&client_secret='+app_secret
};



var post_docs_request_options = {
  host: 'localhost',
  port: 5984,
  path: '/quelle/_bulk_docs',
  method: 'POST',
  headers: {'Content-Type': 'application/json'}
};

var logError = function(e) {
    console.log("Got error: " + e.message);
}

var setupResponseLogging = function(res) {
						  console.log('Status: ' + res.statusCode);
						  console.log('Headers: ' + JSON.stringify(res.headers));
						  res.setEncoding('utf8');
						  res.on('data', function (chunk) {
						    console.log('Body: ' + chunk);
						  });
						};
var data;

function processData(all) {
    console.log(all);
     var data = JSON.parse(all).data;
        for (var i = 0; i < data.length; i++) {
            data[i]._id = data[i].id;
            console.log(data[i]._id);
        }
        return JSON.stringify({docs:data});
}

var addChunkToData = function(d) {
			  			all += d;
			  		};

function writeToFile(data) {
    stream.write(data);
    stream.end();
}

var writeToCouchDB = function(data) {
    var req = http.request(post_docs_request_options, setupResponseLogging);

    req.on('error', logError);

    // write data to request body
    req.write(data);
    req.end();
}
var storeData = function() {
			  			data = processData(all);

                        writeToFile(data);
                        writeToCouchDB(data);
			  		}

var setupDataStorage = function(res) {
			  		console.log("Got group info: " + res.statusCode);
			  		res.on('data', addChunkToData);
			  		res.on('end', storeData);
		    };

var getGroupFeed = function(fd) {

            var get_group_object_request_options = {
			    	host: 'graph.facebook.com',
		  			path: '/'+group_id+'/feed?'+access_token
			    };
            https.get( get_group_object_request_options, setupDataStorage);
		};

var openFile = function(d)
  	{
          console.log(access_token);
    stream = fs.createWriteStream("feed.json");
	stream.once('open', getGroupFeed);
  }

function addChunkToToken(d) {
        access_token += d;
    }

var setupDataHandling = function(res)
{
  console.log("Got access token: " + res.statusCode);


    res.on('data', addChunkToToken);
    res.on('end', openFile);
};

var getAccessKey = function() {
    https.get( access_key_request_options, setupDataHandling ).on('error', logError);
};

getAccessKey();

// getAccessKey
// openFile, log error
// getGroupFeed, log error
// writeDataToFile, log error
// storeDataToCouchDb, log error

//$token = file_get_contents('https://graph.facebook.com/oauth/access_token?type=client_cred&client_id=<app_id>&client_secret=<app secret>');
