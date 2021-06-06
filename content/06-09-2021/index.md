---
title: "Creating a Github Bot with Go"
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
---

Recently I started digging around [the Github API](https://docs.github.com/en/rest) looking to automate some small releaes management tasks that were getting out of hand. The last couple months have been **packed** with scheduled deployments. When it comes time for a release, release-XXX branches are cut in each of the repositories and development resumes. The org I'm a part of has *a lot* of services hosted in their own repositories. Normally syncing the release branch to master locally looks something like this:
```bash
git pull
git checkout master
git merge release-XXXX
git push origin master
```

This is simple enough but becomes a pain in the ass when you have to do this across many services. It also skips some pre-commit checks we have in our pipelines. You could write a decent bash script to sync all the repos at once, but it would still require human intervention and is prone to merge conflicts. There are just too many repos to have to maintain. What would be better is if something could create PRs from release branches down to the master branch for us... so let's go over how I built it :)


## Goals
We will cover:

* How to setup a Github app
* How to authenticate and use the Github API 
* How to create a 'bot' to respond to webhooks 
* How to package & deploy (on a kubernetes cluster)

&nbsp;

#### A quick note about Github Actions
It's worth mentioning Github Actions also has some capabilities to create pull requests & commits between branches without needing to write code. we operate on an older Enterprise version of Github without actions available so an app was the only route available. You aren't responsible for hosting Github Actions so you save some $$ going that route. However, we already have a k8s cluster and this bot has very small footprint, so hosting this thing there is trivial. The app-based approach also has the ability to be installed at an organization level to monitor many repos, whereas Github Actions need to be configured at a repository level.


## Github App setup essentials

## Authenticating 

## Responding to webhook events

## Deploying and watching the automation :eyes: