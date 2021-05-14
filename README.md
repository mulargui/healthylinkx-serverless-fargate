# healthylinkx-serverless-fargate
Healthylinkx is a 3 tiers app: ux, api and datastore. Implementation of Healthylinkx using AWS serverless resources (S3, EKS Fargate, RDS MySQL)

Based on https://github.com/mulargui/healthylinkx-serverless-node
This is a reimplementation using AWS EKS Fargate instead of Lambdas and an API Gateway for the healthylinkx api tier

For the healthylinkx-cli app to work you need to have installed locally
* docker
* nodejs
* npm
* kubectl
* AWS eksctl
* AWS CLI
* helm
All of them are well-known tools. No reference on how to install them here as it changes over time

Directories and files
healthylinkx-cli - this is the command line interface
/infra/src - healthylinkx-cli app source code to install, uninstall and update the whole app
/infra/src/envparams-template.js - All the parameters of the app, like AWS secrets...
Fill in your data and save it as envparams.js

The API is implemented as a container written in nodejs and hosted in fargate
/api/src - source code of the api (node js) - one file per endpoint  
/api/docker - dockerfile
/api/k8s - kubernetes yaml files

The datastore is a RDS MySql instance  
/datastore/src - dump of the healthylinkx database (schema and data)

The ux is a single page web app (html+jquery+bootstrap+javascript) hosted in a S3 bucket  
/ux/src - the source code of the ux app 

Note: I discovered that the aws sdk for javascript requires to have 2 env variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY despite they can be defined in the sdk credentials :( 