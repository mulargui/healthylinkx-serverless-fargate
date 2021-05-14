const constants = require('./envparams.ts');
const APIStop = require('./APIStop.ts');
const APIStart = require('./APIStart.ts');
const APIImage = require('./APIImage.ts');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ====== create api container =====
async function APIUpdate() {

	try {
		//stop the api in k8s
		await APIStop();
		
		//create a new image
		await APIImage();
				
		//restart the api
		await APIStart();

	} catch (err) {
		console.log("APIUpdate error. ", err);
	}
}

module.exports = APIUpdate;
