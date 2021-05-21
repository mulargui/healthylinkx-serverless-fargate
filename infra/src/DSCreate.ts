const constants = require('./envparams.ts');

const {
	RDSClient,
	CreateDBInstanceCommand,
	DescribeDBInstancesCommand,
	CreateDBSubnetGroupCommand
} = require("@aws-sdk/client-rds");
const {
	EC2Client,
	CreateSecurityGroupCommand,
	AuthorizeSecurityGroupIngressCommand,
	CreateSubnetCommand
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

// ====== create MySQL database =====
async function DSCreate() {

	try {

		// vpcid of k8s fargate instance
		vpcid = await exec(`aws cloudformation describe-stacks --stack-name eksctl-my-ekscluster-cluster --region ${constants.AWS_REGION} --query "Stacks[0].Outputs[?OutputKey=='VPC'].OutputValue" --output text`);
		vpcid=vpcid.stdout.trim();

		const ec2client = new EC2Client(config);

		//create two subnets to host the RDS instance
		var data = await ec2client.send(new CreateSubnetCommand({ AvailabilityZone: constants.AWS_REGION + 'a', CidrBlock: '192.168.255.0/28', VpcId: vpcid }));
		const subnet1 = data.Subnet.SubnetId;
		console.log("Success. " + subnet1 + " created.");
		
		data = await ec2client.send(new CreateSubnetCommand({ AvailabilityZone: constants.AWS_REGION + 'b', CidrBlock: '192.168.255.16/28', VpcId: vpcid }));
		const subnet2 = data.Subnet.SubnetId;
		console.log("Success. " + subnet2 + " created.");
		
		//In order to have access to the DB we need to create a security group (aka firewall) with an inbound rule 
		//protocol:TCP, Port:3306, Source: Anywhere (0.0.0.0/0)
		data = await ec2client.send(new CreateSecurityGroupCommand({ Description: 'MySQL Sec Group', GroupName: 'DBSecGroup', VpcId: vpcid }));
		const vpcSecurityGroupId = data.GroupId;
		console.log("Success. " + vpcSecurityGroupId + " created.");

		const paramsIngress = {
			GroupId: data.GroupId,
			IpPermissions: [{
				IpProtocol: "tcp",
				FromPort: 3306,
				ToPort: 3306,
				IpRanges: [{ CidrIp: "0.0.0.0/0" }],
			}],
		};
		await ec2client.send( new AuthorizeSecurityGroupIngressCommand(paramsIngress));
		console.log("Success. " + vpcSecurityGroupId + " authorized.");

		// Create an RDS client service object
		const rdsclient = new RDSClient(config);
		
		//Create a DBSubnet group to host the RDS instance
		await rdsclient.send(new CreateDBSubnetGroupCommand({DBSubnetGroupName: 'HealthylinkxDBSubnetGroup', DBSubnetGroupDescription: 'HealthylinkxDBSubnetGroup', SubnetIds: [subnet1, subnet2]}));

		// Create the RDS instance
		var rdsparams = {
			AllocatedStorage: 20, 
			BackupRetentionPeriod: 0,
			DBInstanceClass: 'db.t2.micro',
			DBInstanceIdentifier: 'healthylinkx-db',
			DBName: 'healthylinkx',
			Engine: 'mysql',
			MasterUsername: constants.DBUSER,
			MasterUserPassword: constants.DBPWD,
			PubliclyAccessible: false,
			AvailabilityZone: constants.AWS_REGION + 'a',
			VpcSecurityGroupIds: [vpcSecurityGroupId],
			DBSubnetGroupName: 'HealthylinkxDBSubnetGroup'
		};
		await rdsclient.send(new CreateDBInstanceCommand(rdsparams));
		console.log("Success. healthylinkx-db requested.");

		//wait till the instance is created
		while(true) {
			data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
			if (data.DBInstances[0].DBInstanceStatus  === 'available') break;
			console.log("Waiting. healthylinkx-db " + data.DBInstances[0].DBInstanceStatus);
			await sleep(30);
		}
		console.log("Success. healthylinkx-db provisioned.");
	
		//URL of the instance
		data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		const endpoint = data.DBInstances[0].Endpoint.Address;
		console.log("DB endpoint: " + endpoint);

	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = DSCreate;

