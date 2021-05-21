const constants = require('./envparams.ts');
const APIStop = require('./APIStop.ts');

const {
    ECRClient,
	DeleteRepositoryCommand
} = require("@aws-sdk/client-ecr");

const exec = require('await-exec');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ====== create lambdas and API gateway =====
async function APIDelete() {

	try {
		//stop the api in k8s
		await APIStop();

		// delete the fargate cluster
		console.log("Starting to delete the fargate cluster, it can easily take 5 mins.");
		await exec(`eksctl delete cluster --name my-ekscluster --region ${constants.AWS_REGION} --wait`);
		console.log("Success. eks fargate cluster deleted.");

		// delete the ECR repositories
		const ecrclient = new ECRClient(config);
		await ecrclient.send(new DeleteRepositoryCommand({repositoryName: 'healthylinkx-api', force: true}));
		console.log("Success. healthylinkx-api repo deleted.");
		await ecrclient.send(new DeleteRepositoryCommand({repositoryName: 'loaddata', force: true}));
		console.log("Success. loaddata repo deleted.");
		
		//delete ALBIngressControllerIAMPolicy policy
		await exec(`aws iam delete-policy --policy-arn arn:aws:iam::${constants.AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy`);
		console.log("Success. healthylinkx-api policy deleted.");
				
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APIDelete;
