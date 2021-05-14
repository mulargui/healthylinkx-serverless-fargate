# run an interactive pod to run tests inside k8s
# busybox doesn't have curl use wget -O- http://other-service
# or use an alpine box and add curl
# kubectl exec -it alpine -- apk --update add curl

# other useful commands
# kubectl logs -f pod
# kubectl attach -i container 
# kubectl exec container -- ls /
# kubectl exec -i --tty container -- /bin/bash

kubectl run -i --tty busybox --image=busybox --restart=Never -- sh
kubectl delete pod busybox --now