var https = require('https');
var http = require('http');
var fs = require('fs');
var Futures = require('futures');

var sequence = Futures.sequence();

function getGroupFeed(group_id) {
    var err;
    sequence
    .then(function(n) {
        var app_id = '103011506473978';
        var app_secret = '8b4a1b33c70ca91d8ad2b3dea81703e0';
        var access_key_request_options = {
            host: 'graph.facebook.com',
            path: '/oauth/access_token?type=client_cred&client_id='+app_id+'&client_secret='+app_secret
        };
        https.get( access_key_request_options, function(res){n(err, res)}).on('error', function(err){n(err)});
    })
    .then(function(n,err,res){
         if (err) throw err;
         console.log("Got access token: " + res.statusCode);
         var access_token = "";
         res.on('data', function(nd) {
            access_token += nd;
         });
         res.on('end', function(){n(undefined, access_token)});
    })
    .then(function(n, err, access_token){
        if (err) throw err;
        console.log(access_token);
        var stream = fs.createWriteStream("feed.json");
	    stream.once('open', function(){n(undefined, access_token, stream)});
    })
    .then(function(n, err, access_token, stream) {
        if (err) throw err;
        var get_group_object_request_options = {
            host: 'graph.facebook.com',
            path: '/'+group_id+'/feed?'+access_token
	    };
        https.get( get_group_object_request_options, function(res){n(undefined, res, stream)}).on('error', function(err){n(err)});
    })
    .then(function(n, err, res, stream){
        if (err) throw err;
        var all = "";
        console.log("Got group info: " + res.statusCode);
		res.on('data', function(d) {
            all += d;
        });
	    res.on('end', function(){n(undefined, all, stream)});
    })
    .then(function(n, err, all, stream){
        if (err) throw err;
        console.log(all);
        var data = JSON.parse(all).data;
        for (var i = 0; i < data.length; i++) {
            data[i]._id = data[i].id;
            console.log(data[i]._id);
        }
        data =  JSON.stringify({docs:data});
        stream.write(data);
        stream.end();

        var post_docs_request_options = {
          host: 'localhost',
          port: 5984,
          path: '/quelle/_bulk_docs',
          method: 'POST',
          headers: {'Content-Type': 'application/json'}
        };
        var req = http.request(post_docs_request_options, function(res) {n(undefined, res)});
        req.on('error', function(err){n(err)});
        req.write(data);
        req.end();
    })
    .then(function(n, err, res){
          if (err) throw err;
          console.log('Status: ' + res.statusCode);
          console.log('Headers: ' + JSON.stringify(res.headers));
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            console.log('Body: ' + chunk);
          });
    });
};

getGroupFeed("180638415285895");