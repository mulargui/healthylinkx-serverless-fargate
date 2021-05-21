const constants = require('./envparams.ts');

const {
	RDSClient,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const {
    ECRClient,
    GetAuthorizationTokenCommand
} = require("@aws-sdk/client-ecr");

const fs = require('fs');
const replace = require('replace-in-file');
const exec = require('await-exec');
const extract = require('extract-zip');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ======== helper function ============
function sleep(secs) {
	return new Promise(resolve => setTimeout(resolve, secs * 1000));
}

// ====== Load the data to the MySQL database =====
async function DSLoadData() {

	try {
		// Create an RDS client service object
		const rdsclient = new RDSClient(config);

		//URL of the DB instance
		data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		const endpoint = data.DBInstances[0].Endpoint.Address;

		//unzip the file to dump on the database
		await extract(constants.ROOT + '/datastore/data/healthylinkxdump.sql.zip', 
			{ dir: constants.ROOT + '/datastore/data' });

		// create contants.js with env values
		fs.copyFileSync(constants.ROOT+'/datastore/data/loaddata.template.sh', constants.ROOT+'/datastore/data/loaddata.sh');
		const options = {
			files: constants.ROOT+'/datastore/data/loaddata.sh',
			from: ['ONE', 'TWO', 'THREE'],
			to: [endpoint, constants.DBUSER, constants.DBPWD]
		};
		await replace(options);
		console.log("Success. Loaddata constants updated.");

		//create docker image to load the data
		await exec(`sudo docker build ${constants.ROOT}/datastore/data --rm=true -t loaddata -f ${constants.ROOT}/datastore/docker/dockerfile`);
		console.log("Success. Loaddata image created.");
		
		//cleanup. delete the unzipped file
		await fs.unlinkSync(constants.ROOT + '/datastore/data/healthylinkxdump.sql');

		//export image to aws-ecr
		const ecrclient = new ECRClient(config);
		
		//get an ecr token and login in docker
		data = await ecrclient.send(new GetAuthorizationTokenCommand({registryIds:[constants.AWS_ACCOUNT_ID]}));
		token = Buffer.from(data.authorizationData[0].authorizationToken, 'base64').toString('ascii').slice(4);
		await exec(`echo ${token} | sudo docker login -u AWS --password-stdin ${constants.AWS_ACCOUNT_ID}.dkr.ecr.${constants.AWS_REGION}.amazonaws.com`);
		console.log("Success. login into docker.");

		//push the image to ecr
		await exec(`sudo docker tag loaddata:latest ${constants.AWS_ACCOUNT_ID}.dkr.ecr.${constants.AWS_REGION}.amazonaws.com/loaddata:latest`);
		await exec(`sudo docker push ${constants.AWS_ACCOUNT_ID}.dkr.ecr.${constants.AWS_REGION}.amazonaws.com/loaddata:latest`);
		console.log("Success. Loaddata image pushed to ECR.");
						
		//run the pod in k8s
		console.log("Starting a container to load the data in the datastore...");
		await exec(`kubectl create -f ${constants.ROOT}/datastore/k8s/loaddata-pod.yaml`);
		console.log("Success. To check the status of the pod: kubectl get pods loaddata-pod");
		
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = DSLoadData;