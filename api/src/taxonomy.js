var constants = require("./constants.js");
const mysql = require('mysql2/promise');

function ServerReply (response, code, results){
	response.writeHead(code, {"Content-Type": "application/json"}); 
	response.write(JSON.stringify(results));
	response.end();
}

var db = mysql.createPool({
	host:constants.host,
	user:constants.user,
	password:constants.password,
	database:constants.database
});

async function taxonomy(request, response) {
	var query = "SELECT * FROM taxonomy";
	try {
		const [rows,fields] = await db.query(query);
		return ServerReply (response, 200, rows);
	} catch(err) {
		return ServerReply (response, 500, {"error": query + '#' + err});
	}
};

exports.taxonomy=taxonomy;
