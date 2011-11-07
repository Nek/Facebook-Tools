var https = require('https');
var http = require('http');
var fs = require('fs');
var app_id = '103011506473978';
var app_secret = '8b4a1b33c70ca91d8ad2b3dea81703e0';
var access_token;
var group_id = 180638415285895;
var flow = require('flow');

https.get(
{
  	host: 'graph.facebook.com',
  	path: '/oauth/access_token?type=client_cred&client_id='+app_id+'&client_secret='+app_secret
}, 
function(res) {
  console.log("Got access token: " + res.statusCode);
  res.on('data', function(d) {
    access_token = d;
    var stream = fs.createWriteStream("feed.json");
	    stream.once('open', function(fd) {
	    	var all = "";
	  		 https.get(
			    {
			    	host: 'graph.facebook.com',
		  			path: '/'+group_id+'/feed?'+access_token
			    }
			    , 
			    function(res) {
			  		console.log("Got group info: " + res.statusCode);
			  		res.on('data', function(d) {
			  			all += d;	
			  		});
			  		res.on('end', function() {
			  			var data = JSON.parse(all).data;
			  			for (var i = 0; i < data.length; i++) {
			  				data[i]._id = data[i].id;
			  				console.log(data[i]._id);
			  			}
			  			stream.write(JSON.stringify({docs:data}));
			  			stream.end();	

			  			var options = {
						  host: 'localhost',
						  port: 5984,
						  path: '/quelle/_bulk_docs',
						  method: 'POST',
						  headers: {'Content-Type': 'application/json'}
						};

						var req = http.request(options, function(res) {
						  console.log('STATUS: ' + res.statusCode);
						  console.log('HEADERS: ' + JSON.stringify(res.headers));
						  res.setEncoding('utf8');
						  res.on('data', function (chunk) {
						    console.log('BODY: ' + chunk);
						  });
						});

						req.on('error', function(e) {
						  console.log('problem with request: ' + e.message);
						});

						// write data to request body
						req.write(JSON.stringify({docs:data}));
						req.end();

			  			//http://127.0.0.1:5984/quelle/_bulk_docs
			  		});
		    });
		});
    
  });
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});

//$token = file_get_contents('https://graph.facebook.com/oauth/access_token?type=client_cred&client_id=<app_id>&client_secret=<app secret>');
