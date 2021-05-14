
// used to test the container with no dependencies

function ServerReply (response, code, results){
	response.writeHead(code, {"Content-Type": "application/json"}); 
	response.write(JSON.stringify(results));
	response.end();
}

async function test(request, response) {
	return ServerReply (response, 200, [{"Classification": "one"}, {"Classification": "two"},{"Classification": "three"}]);
};

exports.test=test;
