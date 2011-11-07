var https = require('https');
var http = require('http');
var fs = require('fs');
var app_id = '103011506473978';
var app_secret = '8b4a1b33c70ca91d8ad2b3dea81703e0';
var access_token;
var group_id = 180638415285895;


function unescapeFromUtf16(str) {
  var utf16_codes = convertEscapedUtf16CodesToUtf16Codes(str);
  return convertUtf16CodesToString(utf16_codes);
}

function convertUtf16CodesToString(utf16_codes) {
  var unescaped = '';
  for (var i = 0; i < utf16_codes.length; ++i) {
    unescaped += String.fromCharCode(utf16_codes[i]);
  }
  return unescaped;
}

function convertEscapedUtf16CodesToUtf16Codes(str) {
  return convertEscapedCodesToCodes(str, "\\u", 16, 16);
}

function convertEscapedCodesToCodes(str, prefix, base, num_bits) {
  var parts = str.split(prefix);
  parts.shift();  // Trim the first element.
  var codes = [];
  var max = Math.pow(2, num_bits);
  for (var i = 0; i < parts.length; ++i) {
    var code = parseInt(parts[i], base);
    if (code >= 0 && code < max) {
      codes.push(code);
    } else {
      // Malformed code ignored.
    }
  }
  return codes;
}

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
