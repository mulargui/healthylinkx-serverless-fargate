const constants = require('./envparams.ts');
const {
	RDSClient,
	DeleteDBInstanceCommand,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const {
	EC2Client,
	DescribeSecurityGroupsCommand,
	DeleteSecurityGroupCommand,
	DescribeSubnetsCommand,
	DeleteSubnetCommand
} = require("@aws-sdk/client-ec2");

const exec = require('await-exec');

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

// ====== create MySQL database and add data =====
async function DSDelete() {

	try {
		// Delete the RDS instance
		const rdsclient = new RDSClient(config);
		const rdsparams = {
			DBInstanceIdentifier: 'healthylinkx-db',
			SkipFinalSnapshot: true,
			DeleteAutomatedBackups: true
		};
		await rdsclient.send(new DeleteDBInstanceCommand(rdsparams));
		console.log("Success. healthylinkx-db deletion requested.");

		//wait till the instance is deleted
		while(true) {
			try {
				await sleep(30);
				const data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
				console.log("Waiting. healthylinkx-db " + data.DBInstances[0].DBInstanceStatus);
			} catch (err) {
				break;
			}
		}
		console.log("Success. healthylinkx-db deleted.");
	
		const ec2client = new EC2Client(config);
		
		//delete the security group
		data = await ec2client.send(new DescribeSecurityGroupsCommand({Filters: [{Name: 'group-name', Values:['DBSecGroup']}]}));
		await ec2client.send(new DeleteSecurityGroupCommand({GroupId: data.SecurityGroups[0].GroupId }));
		console.log("Success. " + data.SecurityGroups[0].GroupId + " deleted.");		

		// vpcid of k8s fargate instance
		vpcid = await exec(`aws cloudformation describe-stacks --stack-name eksctl-my-ekscluster-cluster --region ${constants.AWS_REGION} --query "Stacks[0].Outputs[?OutputKey=='VPC'].OutputValue" --output text`);
		vpcid=vpcid.stdout.trim();
		
		//delete the subnets
		data = await ec2client.send(new DescribeSubnetsCommand({Filters: [
			{Name: 'vpc-id', Values:[vpcid]}, 
			{Name: 'availabilityZone', Values:[constants.AWS_REGION + 'a']},
			{Name: 'cidrBlock', Values:['192.168.255.0/28']}
		]}));
		await ec2client.send(new DeleteSubnetCommand({SubnetId: data.Subnets[0].SubnetId }));
		console.log("Success. " + data.Subnets[0].SubnetId + " deleted.");		

		data = await ec2client.send(new DescribeSubnetsCommand({Filters: [
			{Name: 'vpc-id', Values:[vpcid]}, 
			{Name: 'availabilityZone', Values:[constants.AWS_REGION + 'b']},
			{Name: 'cidrBlock', Values:['192.168.255.16/28']}
		]}));
		await ec2client.send(new DeleteSubnetCommand({SubnetId: data.Subnets[0].SubnetId }));
		console.log("Success. " + data.Subnets[0].SubnetId + " deleted.");		

	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = DSDelete;

