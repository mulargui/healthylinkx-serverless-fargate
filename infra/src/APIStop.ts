const constants = require('./envparams.ts');

const exec = require('await-exec');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ====== stop api container =====
async function APIStop() {

	try {
		//stop the api in k8s
		await exec(`kubectl delete ingress healthylinkx-api-ingress`);
		await exec(`kubectl delete services healthylinkx-api-service`);
		await exec(`kubectl delete deployments healthylinkx-api-deployment`);
		console.log("Success. Stopped the api service.");
		
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APIStop;
