const constants = require('./envparams.ts');
const APIStart = require('./APIStart.ts');

const {
    ECRClient,
    GetAuthorizationTokenCommand,
	CreateRepositoryCommand
} = require("@aws-sdk/client-ecr");
const { 
	EKSClient, 
	CreateAddonCommand
} = require("@aws-sdk/client-eks");

const exec = require('await-exec');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ====== create api container =====
async function APICreate() {

	try {		
		// create the fargate cluster
		console.log("Starting to create the fargate cluster, it can easily take 20 mins.");
		await exec(`eksctl create cluster --name my-ekscluster --region ${constants.AWS_REGION} --zones=us-east-1a,us-east-1b,us-east-1c,us-east-1d,us-east-1f --fargate`);
		await exec(`aws eks --region ${constants.AWS_REGION} update-kubeconfig --name my-ekscluster`);
		console.log("Success. Created the fargate cluster.");

		//Set up the OIDC provider with the cluster and create the IAM policy used by the ALB Ingress Controller
		await exec(`eksctl utils associate-iam-oidc-provider --cluster my-ekscluster --region ${constants.AWS_REGION} --approve`);
		//await exec(`aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.1.2/docs/install/iam_policy.json`);
		await exec(`aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document file://${constants.ROOT}/infra/src/iam_policy.json`);
		await exec(`eksctl create iamserviceaccount --region ${constants.AWS_REGION} --name aws-load-balancer-controller --namespace kube-system --cluster my-ekscluster --attach-policy-arn arn:aws:iam::${constants.AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy --override-existing-serviceaccounts --approve`);

		// install a ALB using helm https://aws.github.io/eks-charts/tree/master/stable/aws-load-balancer-controller
		// https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/deploy/installation/
		
		// we need the vpcid to install correctly the ALB
		vpcid = await exec(`aws cloudformation describe-stacks --stack-name eksctl-my-ekscluster-cluster --region ${constants.AWS_REGION} --query "Stacks[0].Outputs[?OutputKey=='VPC'].OutputValue" --output text`);
		vpcid=vpcid.stdout.trim();
		
		await exec(`helm repo add eks https://aws.github.io/eks-charts`);
		await exec(`kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"`);
		await exec(`helm upgrade -i aws-load-balancer-controller eks/aws-load-balancer-controller --set region=${constants.AWS_REGION} --set clusterName=my-ekscluster --set vpcId=${vpcid} -n kube-system --set serviceAccount.create=false --set serviceAccount.name=aws-load-balancer-controller`);
		console.log("Success. Created the ALB.");

		// create a container image repository
		const ecrclient = new ECRClient(config);
		await ecrclient.send(new CreateRepositoryCommand({repositoryName: 'healthylinkx-api'}));
		console.log("Success. healthylinkx-api repo created.");
		
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APICreate;
