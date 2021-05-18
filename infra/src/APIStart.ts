const constants = require('./envparams.ts');
const APIImage = require('./APIImage.ts');

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
		//create a new image
		await APIImage();
				
		//start the api
		console.log("Starting the api service...");
		result = await exec(`kubectl create -f ${constants.ROOT}/api/k8s/api-deployment.yaml`);
		result = await exec(`kubectl create -f ${constants.ROOT}/api/k8s/api-service.yaml`);
		result = await exec(`kubectl apply -f ${constants.ROOT}/api/k8s/api-ingress.yaml`);
		console.log("Success. Started the api service.");
		
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APIStart;
