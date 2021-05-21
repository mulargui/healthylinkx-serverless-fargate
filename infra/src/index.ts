const UXCreate = require('./UXCreate.ts');
const UXDelete = require('./UXDelete.ts');
const UXUpdate = require('./UXUpdate.ts');
const DSCreate = require('./DSCreate.ts');
const DSLoadData = require('./DSLoadData.ts');
const DSDelete = require('./DSDelete.ts');
const APICreate = require('./APICreate.ts');
const APIDelete = require('./APIDelete.ts');
const APIStart = require('./APIStart.ts');
const APIUpdate = require('./APIUpdate.ts');
const APIStop = require('./APIStop.ts');

function usage(){
	console.log('Usage: healthylinkx-cli ds|api|ux|all delete|d|create|c|update|u');
}

async function main () {
	//command line arguments analysis
	var myArgs = process.argv.slice(2);

	switch (myArgs[0]) {
	case 'ds':
		switch (myArgs[1]) {
		case 'create':
		case 'c':
			await DSCreate();
			await DSLoadData();
			break;
		case 'delete':
		case 'd':
			await DSDelete();
			break;
		case 'update':
		case 'u':
			console.log('Not Implemented');
			usage();
			break;
		default:
			usage();
		}
		break;
	case 'api':
		switch (myArgs[1]) {
		case 'create':
		case 'c':
			await APICreate();
			break;
		case 'delete':
		case 'd':
			await APIDelete();
			break;
		case 'start':
		case 's':
			await APIStart();
			break;
		case 'update':
		case 'u':
			await APIUpdate();
			break;
		case 'stop':
		case 'st':
			await APIStop();
			break;
		default:
			usage();
		}
		break;
	case 'ux':
		switch (myArgs[1]) {
		case 'create':
		case 'c':
			await UXCreate();
			break;
		case 'delete':
		case 'd':
			await UXDelete();
			break;
		case 'update':
		case 'u':
			await UXUpdate();
			break;
		default:
			usage();
		}
		break;
	case 'all':
		switch (myArgs[1]) {
		case 'create':
		case 'c':
			await APICreate();
			await DSCreate();
			await DSLoadData();
			await APIStart();
			await UXCreate();
			break;
		case 'delete':
		case 'd':
			await UXDelete();
			await APIStop();
			await DSDelete();
			await APIDelete();
			break;
		case 'update':
		case 'u':
			await APIUpdate();
			await UXUpdate();
			break;
		default:
			usage();
		}
		break;
	case 'test':
		break;
	default:
		usage();
	}
	return 1;
}

main();
