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

// check that we have connectivity to the database from the api
async function testsql(request, response) {
	try {
		const connection = await db.getConnection();
		connection.release();
		return ServerReply (response, 200, {"success": "connecting to the database"});
	} catch(err) {
		return ServerReply (response, 500, {"error": "connecting to the database"});
	}
};

exports.testsql=testsql;
