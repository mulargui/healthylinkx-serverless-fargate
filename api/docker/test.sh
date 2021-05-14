#!/usr/bin/env bash

#
# NOTE: used to test the nodejs code with no container
# NOTE: used to test the container outside k8s
#

set +x
export DEBIAN_FRONTEND=noninteractive
# Absolute path to this repo
SCRIPT=$(readlink -f "$0")
export REPOPATH=$(dirname "$SCRIPT")

# what you can do
CLEAR=N
CLEANUP=N
BUILD=N
RUN=N
INTERACTIVE=N
NATIVE=N

# you can also set the flags using the command line
for var in "$@"
do
	if [ "CLEAR" == "$var" ]; then CLEAR=Y 
	fi
	if [ "CLEANUP" == "$var" ]; then CLEANUP=Y 
	fi
	if [ "BUILD" == "$var" ]; then BUILD=Y 
	fi
	if [ "RUN" == "$var" ]; then RUN=Y 
	fi
	if [ "INTERACTIVE" == "$var" ]; then INTERACTIVE=Y 
	fi
	if [ "NATIVE" == "$var" ]; then NATIVE=Y 
	fi
done

# clean up all containers
if [ "${CLEAR}" == "Y" ]; then
	sudo docker stop HEALTHYLINKX-API
	sudo docker kill HEALTHYLINKX-API
	sudo docker rm -f HEALTHYLINKX-API
fi

# clean up all images
if [ "${CLEANUP}" == "Y" ]; then
	$0 CLEAR
	sudo docker rmi -f healthylinkx-api
fi

# create image
if [ "${BUILD}" == "Y" ]; then
	$0 CLEAR
	$0 CLEANUP
	sudo docker build $REPOPATH/../src --rm=true -t healthylinkx-api -f $REPOPATH/dockerfile
fi

# run the container in the background
if [ "${RUN}" == "Y" ]; then
	sudo docker run -d --name HEALTHYLINKX-API -p 80:80 healthylinkx-api
fi

# run the container in the console
if [ "${INTERACTIVE}" == "Y" ]; then
	sudo docker run -ti --name HEALTHYLINKX-API -p 80:80 healthylinkx-api /bin/ash
fi

# run the code with no container
if [ "${NATIVE}" == "Y" ]; then
	#due my dev environment I need to do this, not needed otherwise
	cp -r $REPOPATH/../src $HOME
	(cd $HOME/src; npm install; node index.js)
fi
