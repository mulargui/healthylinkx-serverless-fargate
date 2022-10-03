# healthylinkx-serverless-fargate

Healthylinkx helps you find doctors with the help of your social network. Think of Healthylinkx as a combination of Yelp, Linkedin and Facebook. 

This is an early prototype that combines open data of doctors and specialists from the US Department of Health. It allows you to search for doctors based on location, specialization, genre or name. You can choose up to three doctors in the result list and Healthylinkx (theoretically) will book appointments for you.

Healthylinx is a classic three tiers app: front-end (ux), service API and data store. It also integrates with a third-party API from RedLine13 (https://www.redline13.com) to find zip codes in an area. Healthylinkx creates and runs a container for each tier.

This architecture makes it very adequate to test different technologies and I use it for getting my hands dirty on new stuff. You might need to combine what is in this repo with other repos if you want to build the app end to end. It is like a lego where you can pick and choose different technologies as you see fit. Enjoy!

This repo implements Healthylinkx using AWS serverless resources (S3, EKS Fargate, RDS MySQL)

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

The datastore is a RDS MySql instance. The data and schema is loaded using a pod in the k8s cluster  
/datastore/data - dump of the healthylinkx database (schema and data) and shellscript to upload it  
/datastore/docker - dockerfile  
/datastore/k8s - kubernetes yaml file

The ux is a single page web app (html+jquery+bootstrap+javascript) hosted in a S3 bucket  
/ux/src - the source code of the ux app 

Note: I discovered that the aws sdk for javascript requires to have 2 env variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY despite they can be defined in the sdk credentials :( 
