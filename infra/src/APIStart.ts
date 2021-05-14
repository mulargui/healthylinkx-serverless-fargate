const constants = require('./envparams.ts');

const exec = require('await-exec');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ====== stop api container =====
async function APIStart() {

	try {
		//start the api
		result = await exec(`kubectl create -f ${constants.ROOT}/api/k8s/api-deployment.yaml`);
		console.log("Stdout: " + result.stdout);
		console.log("Stderr: " + result.stderr);
		result = await exec(`kubectl create -f ${constants.ROOT}/api/k8s/api-service.yaml`);
		console.log("Stdout: " + result.stdout);
		console.log("Stderr: " + result.stderr);
		result = await exec(`kubectl apply -f ${constants.ROOT}/api/k8s/api-ingress.yaml`);
		console.log("Stdout: " + result.stdout);
		console.log("Stderr: " + result.stderr);
		console.log("Success. Started the api service.");
		
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APIStart;
