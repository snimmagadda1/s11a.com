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

Recently I started digging around [the Github API](https://docs.github.com/en/rest) looking to automate some trivial releaes management tasks. The last couple months have been **packed** with scheduled deployments. When it comes time for a release, release-XXX branches are cut in each of the repositories and development resumes. The org I'm a part of has a lot of services hosted in their own repositories. Normally syncing the release branch to master locally looks something like this:
```bash
git pull
git checkout master
git merge release-XXXX
git push origin master
```

This is simple enough but becomes very tedious when having to do this across 20 services. It also skips some pre-commit checks we have in our pipelines. There are just too many repos to have to maintain. What would be better is if something could create PRs from release branches down to the master branch for us... so let's go over how I built it :)

## Goals
We will cover:

* How to authenticate and use the Github API 
* How to set up a new Github app
* How to create a 'bot' to respond to webhooks 
* How to package & deploy (on a kubernetes cluster)