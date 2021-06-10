---
title: "Persistent volumes on Openshift"
slug: persistent-volumes-on-openshift
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
  - Cloud
  - Code
date: "03/17/2019"
thumbnail: '../thumbnails/openshift.png'
tags:
    - kubernetes
    - nginx
    - openshift
time: "15 min"

---
# Serving static content simplified

There have been a number of instances where a project or demo I’ve been a part of has the need to serve and retrieve static content (i.e files like .pdf, .png, .js, .css, etc), and I can’t count the number of times I’ve had to recreate a solution… So I’ve decided to write one out!

In today’s day and age there are countless ways to deploy and serve files on the web, but here I will be focusing on the classic model of serving static media via a NGINX web server within an OSE cluster. The architecture is simple. We have: 

* A NGINX static file server 
* A persistent volume and persistent volume claim for storing and accessing our data 
* An OSE service and route to reach the NGINX server

## The Tools
#### Openshift

The tutorial here assumes you have an instance of Openshift deployed and a project running on your infrastructure of choice. If you don’t currently have a running cluster, I would recommend checking out Redhat’s developer preview [here](https://try.openshift.com/) which can be easily set up on AWS or setting up a [minishift cluster](https://github.com/minishift/minishift). At the time of writing this images were deployed on an instance of Openshift running openshift v3.9.

#### NGINX

If you’re not familiar with NGINX, I would recommend checking out their [docs](https://www.nginx.com/resources/glossary/nginx/). They’re rich in examples and documentation for each of the use cases. At a high level, NGINX is an open source software that can be used for a number of capabilities including proxies, web servers, load balancers, and many more. In this example we’ll be using NGINX to serve static content. More background about this use case can be found [here](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/).

#### Kubernetes

Within the Kubernetes architecture, we’ll be working with a number of objects including persistent volumes (PV), persistent volume claims (PVCs), pods, and services.

## Creating the server image

All of the “heavy lifting” for how our files are served is handled by NGINX. We simply have to provide the container some configuration context and instructions for how to serve our files we’d like deployed. Full code for the following tutorials can be found [here](https://github.com/snimmagadda1/nginx-openshift-pvc). First we’ll construct a `Dockerfile` as follows:

```dockerfile
FROM nginx:mainline
 
ADD nginx.conf /etc/nginx/
ADD mime.types /etc/nginx/
ADD index.html /var/www/static/index.html
 
 
WORKDIR /usr/src
 
# support running as arbitrary user which belogs to the root group
RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html /var/www/static
 
# users are not allowed to listen on priviliged ports
RUN sed -i.bak 's/listen\(.*\)80;/listen 8081;/' /etc/nginx/conf.d/default.conf
EXPOSE 8081
 
# comment user directive as master process is run as user in OpenShift anyhow
RUN sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf
 
 
# Prepare for Entrypoint
COPY entrypoint.sh /usr/src/entrypoint.sh
RUN chmod g+rwx /usr/src/entrypoint.sh
 
RUN addgroup nginx root
USER nginx
 
ENTRYPOINT "/usr/src/entrypoint.sh"
```

The steps are relatively straightforward. We initially transfer some configuration files to the `/etc/nginx/` directory. The file mime.types is used to ensure the correct MIME is sent with the content the NGINX image will be responsible for serving. The file nginx.conf is a required file that details the behavior of our NGINX instance. Digging into this file we can see we have a single server block that details the heart of the nginx container:

```bash
server {
    root /var/www/static;
    index index.html;
    server_name localhost;
    listen 8081;
    location / {
      add_header X-Content-Type-Options nosniff;
      add_header X-Frame-Options DENY;
      add_header x-xss-protection "1; mode=block" always;
    }   
}
```

Interpreting this block, we’ve set the root of our NGINX instance to `/var/www/static` and added some optional headers. We’ve also configured our web server to listen on port 8081. Referencing the Dockerfile we can see we’ve added the file index.html to the `/var/www/static` directory. As a result, when we make a request to the root of our deployed NGINX server, we should be presented with the contents of `index.html`.

The final portion of the `Dockerfile` is largely configuration: we are modifying permissions on folders the container will be interacting with, change the user to a user named nginx, and lastly copying over a script `entrypoint.sh`. This is done because depending on cluster permissions within your Openshift instance, the container may not be able to run with root access. The script `entrypoint.sh` simply starts our server:

```bash
nginx -g "daemon off;"
```

At this point we can build and test our NGINX implementation locally. For example, to build and run the image with a name `snimmagadda/nginx-pvc-example` within the directory we can run

```docker
docker build . -t snimmagadda/nginx-pvc-example
docker run -p 8081:8081 snimmagadda/nginx-pvc-example
```

and making a GET request to `http://localhost:8081/` should result in the contents of our `index.html` being served. Once that’s verified working, we’ll go ahead and push up the docker image to a given repository (in this example we’re using docker hub). You’ll notice at this step we haven’t mentioned any of the content we’ll be serving nor added the content to the container itself. This is **intentional** and an advantage of this implementation, which decouples the container serving the static files from the data itself. The files to be served will be stored and managed within a persistent volume. As a result, we can easily deploy a number of NGINX containers all pointing to the same data for high-load use cases or delete a container without worrying about the loss of data.

## Deploying and adding a volume

A `PersistentVolume` is a term for a storage resource on an OSE (really a k8s) cluster. The explicit resource itself varies based on the cloud provider and is created from items such as a GCE Persistent Disk or AWS Elastic Block Store. There are a number of use cases for volumes including:

* A shared file system for storing large media and files for download via a web server
* A shared file system for the upload directory of a web application to process or share files
* Persistent storage for working with files in isolated environments
* Housing database files when running a relational database such as PostgreSQL or MySQL

Persistent volumes are made available to you as a developer and applications by making claims to the resource, known as a `PersistentVolumeClaim`. A PVC, in a nutshell, is a request for storage resources within a cluster. From the Openshift documentation we can see the relationship between the two:

>A PersistentVolume is a specific resource. A PersistentVolumeClaim is a request for a resource with specific attributes, such as storage size. In between the two is a process that matches a claim to an available volume and binds them together. This allows the claim to be used as a volume in a pod. OpenShift Enterprise finds the volume backing the claim and mounts it into the pod.

There are also a number of ways a volume can be added to a project within Openshift. Perhaps the simplest is the oc volume command; however, in the spirit of defining everything as code, we’re going the .yml route and we’ll define our objects via a [deployment](https://github.com/snimmagadda1/nginx-openshift-pvc/blob/master/deployment.yml). The first block of the deployment defines the persistent volume claim that will be used by our deployed NGINX image. Here we make a request for a PVC named nginx-pvc with the given access mode and a storage size of 512 Megabytes:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nginx-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 512M
```

We then reference the PVC in our pod deployment, where we define a single pod with the above claim being used as a volume within the container:

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx-static
spec:
  template:
    metadata:
      labels:
        app: nginx-static
    spec:
      volumes:
        - name: nginx-static-storage
          persistentVolumeClaim:
            claimName: nginx-pvc
      containers:
        - image: docker.io/snimmagadda/nginx-pvc-example:latest
          name: nginx-pvc-example
          ports:
            - containerPort: 8081
              name: serve
          volumeMounts:
            - name:  nginx-static-storage
              mountPath: /var/www/static
```

Notably the volume `nginx-static-storage` is created from the PVC we defined in the first block, and then is mounted to the `/var/www/static` directory within the NGINX container. This effectively means that data at this location within the container will be managed by our newly created PV. If we go ahead and execute the deployment `oc create -f deployment.yml` we will receive output that the PVC, deployment, and associated service have been created.
Note: Running oc get pvc will also verify that the volume has been successfully created.


## Uploading and accessing static content
At this point we have a running NGINX web server attached to a persistent volume and its time to finally add the content we would like to serve. To do this we are going to use the oc rsh command combined with tar. First we get the name of the pod mounted to the volume using the oc get pods command. In this example our pod is named `nginx-static-5c89688f44-nkrxj` so we’ll package the contents of the pdf directory and copy the files to the volume using the command

```
tar cf - . | oc rsh nginx-static-5c89688f44-nkrxj tar xofC - /var/www/static --no-overwrite-dir
```

With files now copied into the volume, we can test it by exposing our service (creating a route) and making a `GET` request to `<base-url>/my_file.pdf`. If you’ve been using the code [here](https://github.com/snimmagadda1/nginx-openshift-pvc) making a request to:


```http
http://<base-url>/ipsum.pdf
```

should result in being served the static pdf document!

Now you could delete the pod, scale down/up, add more content, etc and your data will remain in the PV for access via pods that mount the volume. 

As a review, we’ve successfully:

* Defined and configured an NGINX static web server
* “Dockerized”, created, and deployed a PV, PVC, and pod with a custom NGINX image
* Uploaded documents to the created PV
* Served the documents over the web via the custom NGINX image

I encourage you to use this walk through as a starter for implementing something similar within your own use case. What I’ve touched on here barely scratches the surface of what is possible with NGINX.
























