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

The bot will perform "actions" via the API. Some of those actions will require authentication. So lets take a look at how to authenticate as a client of the API.

## Authenticating 

Github exposes a [single method](https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps) to authenticate as an application. The process is straightforward enough: You create and sign a JWT that is sent in a request for an access token. The private key we downloaded above will be used for the signature. The maximum lifetime we can request for an access token is 10 minutes. If we wanted to do this in Go, it would look something like this using [jwt-go](github.com/dgrijalva/jwt-go):

```go
	claims := &jwt.StandardClaims{
		IssuedAt:  time.Now().Unix(),
		ExpiresAt: time.Now().Add(time.Minute).Unix(),
		Issuer:    strconv.FormatInt(t.appID, 10),
	}
	bearer := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)

	ss, err := bearer.SignedString(pem)
	if err != nil {
		return nil, fmt.Errorf("Signing error: %s", err)
	}
```

The last step to getting an access token is sending the JWT in the `Header` of an access token request: 

```
curl -i -X POST \
-H "Authorization: Bearer YOUR_JWT" \
-H "Accept: application/vnd.github.v3+json" \
https://api.github.com/app/installations/:installation_id/access_tokens
```

Notice the above request is to the `/app/installations` endpoint. This is important and required to perform actions in the API for your installation. 

### How to translate this to code...

Now, we could write our own methods to making the request to authenticate and manage access token expiration. However, there exists an elegant open-source solution that I want to highlight. 

Bradley Falzon's [ghinstallation](https://github.com/bradleyfalzon/ghinstallation) is an awesome solution to provide "authenication as an installation" for https://github.com/google/go-github. ghinstallation leverages the fact that the go-github library is built on the stdlib `http.Client`. It allows you to create a `http.Client` that handles authentication for you. This can then be passed to the go-github library for easy use. By Using these two libraries in tandem we get free authentication/refresh capability and methods for the majority of endpoints in Github's API. 

This works because ghinstallation provides an implementation of the [`http.RoundTripper`](https://golang.org/pkg/net/http/#Transport.RoundTrip) interface, called a `Transport`. Every request sent using the go-github library will use the `Transport` implementation. The `Transport` implements `RoundTrip` as follows, stamping an access token on each reqeust the go-github library uses:

```go
func (t *Transport) RoundTrip(req *http.Request) (*http.Response, error) {
	token, err := t.Token(req.Context())
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "token "+token)
	req.Header.Add("Accept", acceptHeader) // We add to "Accept" header to avoid overwriting existing req headers.
	resp, err := t.tr.RoundTrip(req)
	return resp, err
}
```

Now that we have some background on what we're doing, the go code to do it can be broken down into two steps:
1. Create a `Transport` (`ghinstallation.RoundTripper`) and a `http.Client` that uses that transport as it's `RoundTipper`
2. Create a go-github client

## Responding to webhook events

## Deploying and watching the automation :eyes: