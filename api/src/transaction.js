var constants = require("./constants.js");
const mysql = require('mysql2/promise');
var url = require("url");

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

async function transaction(request, response) {
	var params = url.parse(request.url,true).query; 
	var id=params.id;
 
 	//check params
 	if(!id)
		return ServerReply (204, {"error": "no transaction id"});

 	//check params
 	if(!id) return ServerReply (204, {"error": "no transaction id"});
	
	//retrieve the providers
	var query = "SELECT * FROM transactions WHERE (id = '"+id+"')";
	try {
		[rows,fields] = await db.query(query);

		if (rows.length <= 0) return ServerReply (204, {"error": query});

		//get the providers
		var npi1 = rows[0].NPI1;
		var npi2 = rows[0].NPI2;
		var npi3 = rows[0].NPI3;
	
		//get the details of the providers
		query = "SELECT NPI,Provider_Full_Name,Provider_Full_Street, Provider_Full_City, Provider_Business_Practice_Location_Address_Telephone_Number FROM npidata2 WHERE ((NPI = '"+npi1+"')";
		if(npi2) query += "OR (NPI = '"+npi2+"')";
		if(npi3) query += "OR (NPI = '"+npi3+"')";
		query += ")";

		[rows,fields] = await db.query(query);
		
		return ServerReply(200, rows);
	} catch(err) {
		return ServerReply (500, {"error": query + '#' + err});
	}
}; 

exports.transaction=transaction;
