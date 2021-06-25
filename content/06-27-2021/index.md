---
title: "Building a Github Bot with Go"
slug: creating-a-github-bot-with-go
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
  - Code
  - Backend
  - Cloud
date: "06/27/2021"
thumbnail: "../thumbnails/octocat.jpg"
tags:
  - go
  - automation
  - github
  - gitops
time: "20 min"
---

Recently I started digging around looking to automate some simple tasks that were being repeated as part of a release management process for a bunch of microservices. [The Github API](https://docs.github.com/en/rest) offers alot so I was hoping to use it build something to respond to events. The last couple months have been **packed** with scheduled deployments. When it comes time for a release, release-XXX branches are cut in each repository. There are _a lot_ of services hosted in their own repos. If a change gets pushed to a release branch, it needs to be merged down into master. Normally doing this locally looks something like this:

```bash
git pull
git checkout master
git merge release-XXXX
git push origin master
```

This is simple enough but becomes more of an issue when you have to do this for many services. It also skips some checks pipelines for pull requests. You could write a bash script to do this for all the repos at once, but it would still require human intervention and is prone to merge conflicts. There are just too many repos to have to maintain. What would be better is if something could create PRs from release branches down to the master branch for us... so let's build it from scratch with some quick Go code :).

## Goals

We will cover:

- How to setup a Github app
- How to authenticate and use the Github API
- http.Transport basics
- How to create a 'bot' to respond to webhooks
- How to package & deploy (on a kubernetes cluster)

The bot's full source can be [found here](https://github.com/snimmagadda1/github-PR-automation). In this article we'll go over the background and construction of the core functionality.

&nbsp;

#### A quick note about Github Actions

It's worth mentioning Github Actions also has some capabilities to create pull requests & commits between branches without needing to write code. We operate on an older enterprise version of Github without actions available so an app was the way to automate things in this case. You aren't responsible for hosting Github Actions so you save some \$\$ going that route. However, we already have a k8s cluster and this bot has very small footprint, so hosting this thing there is trivial. The app-based approach also has the ability to be installed at an organization level to monitor many repos, whereas Github Actions need to be configured at a repository level.

## Github App setup essentials

In order to automate, we'll need to build an application that can perform actions in response to something happening. Github publishes some handy [events](https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types) that can be subscribed to. At it's core, the bot we're going to build is a web server that will interpret and respond to these events to do something useful. The process of creating a Github app is relatively straightforward and outlined in depth [here](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app).

Set the homepage & callback URL to anything (don't need them for our bot's purposes). However, make sure webhooks are set to active. For the webhook URL, I recommend heading over to [smee.io](https://smee.io) to generate a development webhook URL to start. Smee provides a handy node package we can run to receive forwarded events. During development, smee will act as the middleman to allow our localhost to receive Github event payloads. When the bot is ready to be deployed, we will change the webhook URL to our deployment's domain name.

On the permissions page request read/write access to Repository level _Contents_ and _Pull requests_. Continue scrolling and subscribe to the Pull request and Push events:

![Github app subscription check boxes](../images/github_events_subscribe.png)

Go ahead and create the app. Make sure to generate and save a private key (.pem) since that will serve as the auth mechanism. That's it for registering the app!

The bot will perform its "actions" via the API. Some of those actions will require authentication. So lets take a look at how to authenticate as a client of Github's services.

## Authenticating

Github exposes a [single method](https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps) to authenticate as an application. The process is straightforward enough: You create and sign a JWT then send it off in a request for an access token. The private key we downloaded above will be used for the signature piece. The maximum lifetime we can request for an access token is 10 minutes. If we wanted to do this in Go, it would look something like this using [jwt-go](github.com/dgrijalva/jwt-go):

```go
	iss := time.Now()
	exp := iss.Add(10 * time.Minute)
	claims := &jwt.StandardClaims{
		IssuedAt:  jwt.At(iss),
		ExpiresAt: jwt.At(exp),
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

Now, we could write our own methods to send the request for an access token and manage expiration. But why reinvent the wheel? There's an elegant open-source solution that I want to highlight. It's makes calling the API with some Go code too easy.

Bradley Falzon's [ghinstallation](https://github.com/bradleyfalzon/ghinstallation) is an awesome example of providing "authentication as an installation" for https://github.com/google/go-github. ghinstallation leverages the fact that the go-github library's backbone is built with the stdlib `http.Client`. That means if we have a `http.Client` that handles authentication internally, it can then be passed to the go-github library for easy use. Using these two libraries in tandem we get free authentication/refresh capability and methods for the majority of endpoints in Github's API.

**This is cool!** Internally ghinstallation provides an implementation of the [`http.RoundTripper`](https://golang.org/pkg/net/http/#Transport.RoundTrip) interface, named a `Transport`. I like to think of a `http.RoundTripper` as Go's somewhat equivalent of middleware for the `http.Client`. The `RoundTripper` runs the HTTP transaction and returns the response, meaning we can put logic in the `RoundTrip(*Request)` function and it wil execute before a response is obtained. Every request sent using the go-github library will use this `Transport` from ghinstallation. The `Transport` implements `RoundTrip` by stamping an access token on each request:

```go
type Transport struct {
	BaseURL                  string
	Client                   Client
	tr                       http.RoundTripper
	appID                    int64
	installationID           int64
	InstallationTokenOptions *github.InstallationTokenOptions
	appsTransport            *AppsTransport

	mu    *sync.Mutex  // mu protects token
	token *accessToken // token is the installation's access token
}

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

ghinstallation also takes care of refreshing behind the scenes (the method `t.Token()` checks if the cached access token is expired)! If you're interested in the finer details of how this works, [go check out the full library](https://github.com/bradleyfalzon/ghinstallation/blob/master/transport.go)! It's a pretty slim module.

Now that we have some background on the "how" of authentication with some Go code, the go code to do it can be broken down into two steps:

1. Create a `Transport` (`ghinstallation.RoundTripper`) and a `http.Client` that uses that transport as it's `RoundTipper`
2. Create a go-github client

Creating an authenticated github client with these two libraries looks something like this (shown for enterprise clients, see the full source for the slight variation to create a github.com client):

```go
	// Create an app transport (semi-authenticated)
	atr, err := ghinstallation.NewAppsTransportKeyFromFile(http.DefaultTransport, APP_ID, PRIVATE_KEY_PATH)
	if err != nil {
		log.Fatal("error creating GitHub app client", err)
	}

	client, err := v3.NewEnterpriseClient(s.client.GitHubURL, s.client.GithubUploadURL, &http.Client{Transport: s.atr})
	if err != nil {
		log.Fatal("failed to init enterprise client", err)
	}

```

That's it! No fiddling with claims, reading files manually, parsing private keys, etc. By firing off methods on the `client` object, we can begin to write some automation.

## Responding to webhook events

At it's core our 'bot' is going to be a simple server that can respond to a HTTP request payload. To run a quick web server with Go you can just register a handler function on the default mux: 

```go
http.HandleFunc("/", Handle)
log.Print("Ready to handle github events")
err = http.ListenAndServe("0.0.0.0:3000", nil)
if err != nil && err != http.ErrServerClosed {
	log.Fatal(err)
}
```

That's half the battle. Really. We just need to make sure the function `Handle` can interpret the event payloads and respond. The function should do a few things to make life a bit easier. In this scenario, whenever a commit is made to the release branch we'll want to create a PR from that branch to master. Additionally, we should assign reviewers based on the recent committers to the branch. I'm going to take an extra step and actually branch off the release branch before creating the PR. This will make sure we don't acidentally merge master into release (sometimes Github's UI presents a "This branch is out of date..." message). All of this can be done via Github's API.

For each action, here are the corresponding endpoint(s) needed:

- **Creat**
## Deploying and watching the automation 👀
