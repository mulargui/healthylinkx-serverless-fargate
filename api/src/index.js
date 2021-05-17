
var http = require("http"); 
var url = require("url");
var wait = require('wait.for');

var taxonomy = require("./taxonomy"); 
var providers = require("./providers"); 
var shortlist = require("./shortlist"); 
var transaction = require("./transaction"); 
var test = require("./test"); 
var testsql = require("./testsql"); 

var handle = {}
handle["/taxonomy"] = taxonomy.taxonomy;
handle["/providers"] = providers.providers;
handle["/shortlist"] = shortlist.shortlist;
handle["/transaction"] = transaction.transaction;
handle["/test"] = test.test;
handle["/testsql"] = testsql.testsql;

http.createServer(function (request, response) {
	console.log(request.url);	
	//only GET queries
	if (request.method != 'GET'){
		response.writeHead(406, {"Content-Type": "text/plain"});
		response.write("406 Not Acceptable");
		response.end();
		console.log("406");
		return;
	}

	var pathname = url.parse(request.url).pathname; 
	if (typeof handle[pathname] === 'function') {
		
		//allow cross domain requests
		response.setHeader("Access-Control-Allow-Origin", "*");
		
		//adding support for sync calls
		wait.launchFiber(handle[pathname],request,response);
		//await handle[pathname](request, response); 
	} else {
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.write("404 Not found");
		response.end();
	} 
}).listen(80);




