#!/bin/sh

SQLURL=ONE
USER=TWO
PASSWORD=THREE

#wait till the server is ready
for i in {1..6}; do # timeout in 30 seconds
	if mysqladmin ping -h $SQLURL --silent; then
		echo ...ready
		break
	fi
	echo ...waiting
	sleep 5
done

mysql -h $SQLURL -u $USER -p$PASSWORD healthylinkx < /healthylinkxdump.sql
echo done!

exit 0