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

async function shortlist(request, response) {
	var params = url.parse(request.url,true).query; 

	var npi1 = params.NPI1;
	var npi2 = params.NPI2;
	var npi3 = params.NPI3;

 	//check params
 	if(!npi1)
		return ServerReply (response, 204, {"error": "no NPI requested"});

	//save the selection
	var query = "INSERT INTO transactions VALUES (DEFAULT,DEFAULT,'"+ npi1 +"','"+ npi2 +"','"+npi3 +"')";
	try {
		[rows,fields] = await db.query(query);
		
		//keep the transaction number
		var transactionid= rows.insertId;
			
		//return detailed data of the selected providers
		query = "SELECT NPI,Provider_Full_Name,Provider_Full_Street, Provider_Full_City, Provider_Business_Practice_Location_Address_Telephone_Number FROM npidata2 WHERE ((NPI = '"+npi1+"')";
		if(npi2) query += "OR (NPI = '"+npi2+"')";
		if(npi3) query += "OR (NPI = '"+npi3+"')";
		query += ")";
		
		[rows,fields] = await db.query(query);
		
		return ServerReply (response, 200, {"providers": rows, "Transaction": transactionid});
	} catch(err) {
		return ServerReply (response, 500, {"error": query + '#' + err});
	}
};

exports.shortlist=shortlist;
