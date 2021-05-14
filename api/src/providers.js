const constants = require("./constants.js");
const mysql = require('mysql2/promise');
const axios = require('axios');
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

async function providers(request, response) {
	var params = url.parse(request.url,true).query; 

	var gender=params.gender;
	var lastname1=params.lastname1;
	var lastname2=params.lastname2;
	var lastname3=params.lastname3;
	var specialty=params.specialty;
	var distance=params.distance;
	var zipcode=params.zipcode;
 	
 	//check params
 	if(!zipcode && !lastname1 && !specialty)
		return ServerReply (204, {"error": 'not enought params!'});
	
 	var query = "SELECT NPI,Provider_Full_Name,Provider_Full_Street,Provider_Full_City FROM npidata2 WHERE (";
 	if(lastname1)
 		query += "((Provider_Last_Name_Legal_Name = '" + lastname1 + "')";
 	if(lastname2)
 		query += " OR (Provider_Last_Name_Legal_Name = '" + lastname2 + "')";
 	if(lastname3)
 		query += " OR (Provider_Last_Name_Legal_Name = '" + lastname3 + "')";
 	if(lastname1)
 		query += ")";
 	if(gender)
 		if(lastname1)
 			query += " AND (Provider_Gender_Code = '" + gender + "')";
 		else
 			query += "(Provider_Gender_Code = '" + gender + "')";
 	if(specialty)
 		if(lastname1 || gender)
 			query += " AND (Classification = '" + specialty + "')";
 		else
 			query += "(Classification = '" + specialty + "')";

 	//case 1: no need to calculate zip codes at a distance
 	if (!distance || !zipcode){
 		if(zipcode)
 			if(lastname1 || gender || specialty)
 				query += " AND (Provider_Short_Postal_Code = '"+ zipcode + "')";
 			else
 				query += "(Provider_Short_Postal_Code = '" + zipcode + "')";
		query += ") limit 50";
 		
		try {
			const [rows,fields] = await db.query(query);
			return ServerReply (200, rows);
		} catch(err) {
			return ServerReply (500, {"error": query + '#' + err});
		}
	}
	
 	//case 2:we need to find zipcodes at a distance

 	//lets get a few zipcodes
 	var queryapi = "http://" + constants.zipcodeapi + "/rest/" + constants.zipcodetoken 
		+ "/radius.json/" + zipcode + "/" + distance + "/mile";
	var zipcodes="";

	try {
		const response = await axios.get(queryapi);
		zipcodes=response.data;
	} catch (err) {
		return ServerReply (500, {"error": queryapi + ':' + err});
	}

	//no data
  	if (!zipcodes) return ServerReply (204, {"error": "no zipcodes!"});

	var length=zipcodes.zip_codes.length;

	//complete the query
 	if(lastname1 || gender || specialty)
 		query += " AND ((Provider_Short_Postal_Code = '"+zipcodes.zip_codes[0].zip_code+"')";
 	else
 		query += "((Provider_Short_Postal_Code = '"+zipcodes.zip_codes[0].zip_code+"')";
	for (var i=1; i<length;i++){
 		query += " OR (Provider_Short_Postal_Code = '"+ zipcodes.zip_codes[i].zip_code +"')";
	}
  	query += ")) limit 50";

	try {
		const [rows,fields] = await db.query(query);
		return ServerReply (200, rows);
	} catch(err) {
		return ServerReply (500, {"error": query + '#' + err});
	}
}; 

exports.providers=providers;
