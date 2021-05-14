const constants = require('./envparams.ts');

const {
    ECRClient,
    GetAuthorizationTokenCommand,
	CreateRepositoryCommand
} = require("@aws-sdk/client-ecr");

const fs = require('fs');
const exec = require('await-exec');
const replace = require('replace-in-file');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ====== create api container =====
async function APIImage() {

	try {
		// address of the datastore, local for now
		const endpoint = '127.0.0.1';

		// create contants.js with env values
		fs.copyFileSync(constants.ROOT+'/api/src/constants.template.js', constants.ROOT+'/api/src/constants.js');
		const options = {
			files: constants.ROOT+'/api/src/constants.js',
			from: ['ENDPOINT', 'DBUSER', 'DBPWD', 'ZIPCODEAPI', 'ZIPCODETOKEN'],
			to: [endpoint, constants.DBUSER, constants.DBPWD, constants.ZIPCODEAPI, constants.ZIPCODETOKEN]
		};
		await replace(options);
		console.log("Success. Constants updated.");
		
		//create docker image of the api
		await exec(`sudo docker build ${constants.ROOT}/api/src --rm=true -t healthylinkx-api -f ${constants.ROOT}/api/docker/dockerfile`);
		console.log("Success. docker image updated.");
	
		//export image to aws-ecr
		const ecrclient = new ECRClient(config);
		
		//get an ecr token and login in docker
		const data = await ecrclient.send(new GetAuthorizationTokenCommand({registryIds:[constants.AWS_ACCOUNT_ID]}));
		token = Buffer.from(data.authorizationData[0].authorizationToken, 'base64').toString('ascii').slice(4);
		await exec(`echo ${token} | sudo docker login -u AWS --password-stdin ${constants.AWS_ACCOUNT_ID}.dkr.ecr.${constants.AWS_REGION}.amazonaws.com`);
		console.log("Success. login into docker.");

		//push the image to ecr
		await exec(`sudo docker tag healthylinkx-api:latest ${constants.AWS_ACCOUNT_ID}.dkr.ecr.${constants.AWS_REGION}.amazonaws.com/healthylinkx-api:latest`);
		await exec(`sudo docker push ${constants.AWS_ACCOUNT_ID}.dkr.ecr.${constants.AWS_REGION}.amazonaws.com/healthylinkx-api:latest`);
		console.log("Success. Image pushed to ECR.");
		
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APIImage;
