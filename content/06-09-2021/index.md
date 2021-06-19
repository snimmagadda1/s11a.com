---
title: "Building a Github Bot with Go"
slug: creating-a-github-bot-with-go
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
    - Code
    - Backend
    - Cloud
date: "06/09/2021"
thumbnail: "../thumbnails/octocat.jpg"
tags:
    - go
    - automation
    - github
    - gitops
time: "20 min"
---

Recently I started digging around looking to automate some small tasks that were being repeated as part of a release management process. [The Github API](https://docs.github.com/en/rest) offers alot so I was hoping to use it build something to respond to events. The last couple months have been **packed** with scheduled deployments. When it comes time for a release, release-XXX branches are cut in each repository.  There are *a lot* of services hosted in their own repos. If a change gets pushed to a release branch, it needs to be merged down into master. Normally doing this locally looks something like this:

```bash
git pull
git checkout master
git merge release-XXXX
git push origin master
```

This is simple enough but becomes more of an issue when you have to do this across many services. It also skips some checks pipelines for  pull requests. You could write a bash script to do this for all the repos at once, but it would still require human intervention and is prone to merge conflicts. There are just too many repos to have to maintain. What would be better is if something could create PRs from release branches down to the master branch for us... so lets' build it from scratch with some quick Go code :).


## Goals
We will cover:

* How to setup a Github app
* How to authenticate and use the Github API 
* http.Transport basics
* How to create a 'bot' to respond to webhooks 
* How to package & deploy (on a kubernetes cluster)

The bot's full source can be [found here](https://github.com/snimmagadda1/github-PR-automation). Below we'll go over building pieces of the core functionality.

&nbsp;

#### A quick note about Github Actions
It's worth mentioning Github Actions also has some capabilities to create pull requests & commits between branches without needing to write code. we operate on an older Enterprise version of Github without actions available so an app was the only route available. You aren't responsible for hosting Github Actions so you save some $$ going that route. However, we already have a k8s cluster and this bot has very small footprint, so hosting this thing there is trivial. The app-based approach also has the ability to be installed at an organization level to monitor many repos, whereas Github Actions need to be configured at a repository level.


## Github App setup essentials
In order to automate, we'll need to build an application that can perform actions in response to something happening. The process of creating a Github app is relatively straightforward and outlined in depth [here](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app). 

Set the homepage & callback URL to anything (don't need them for our bot's purposes). However, make sure webhooks are set to active. For the webhook URL, I recommend heading over to [smee.io](https://smee.io) to generate a development webhook URL to start. Smee provides a handy node package we can run to receive forwarded events. During development, smee will act as the middleman to allow our localhost to receive Github event payloads. When the bot is ready to be deployed, we will change the webhook URL to our deployment's domain name.

On the permissions page request read/write access to Repository level *Contents* and *Pull requests*. Continue scrolling and subscribe to the Pull request and Push events:

![Github app subscription check boxes](../images/github_events_subscribe.png)

Go ahead and create the app. Make sure to generate and save a private key (.pem) since that will serve as the auth mechanism. That's it for registering the app!

The bot will perform "actions", some of which sit behind protections, via the API. So lets take a look at how to authenticate as a client of the API.

## Authenticating 


Github exposes a [single method](https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps) to authenticate as an application. The process is straightforward enough: You create and sign a JWT that is sent in a request for an access token. The private key we downloaded above will be used for the signature.

## Responding to webhook events

## Deploying and watching the automation :eyes: