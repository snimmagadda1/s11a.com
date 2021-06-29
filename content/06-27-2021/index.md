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
time: "15 min"
---

Recently I started digging around looking to automate some simple tasks that were being repeated as part of a release management process for a bunch of microservices. [The Github API](https://docs.github.com/en/rest) offers a lot so I was hoping to use it build something to respond to events. The last couple months have been **packed** with scheduled deployments. When it comes time for a release, release-XXX branches are cut in each repository. There are _a lot_ of services hosted in their own repos. If a change gets pushed to a release branch, it needs to be merged down into master. Normally doing this locally looks something like this:

```bash
git pull
git checkout master
git merge release-XXXX
git push origin master
```

This is simple enough but becomes more of an issue when you have to do this for many services. It also skips some checks pipelines for pull requests. You could write a bash script to do this for all the repos at once, but it would still require human intervention and is prone to merge conflicts. There are just too many repos to have to maintain. What would be better is if something could create PRs from release branches down to the master branch for us...

## Goals

We will cover:

- How to setup a Github app
- How to authenticate and use the Github API
- The basics of `http.Transport`
- How to create a bot to respond to Github webhooks
- How to package & deploy (on a kubernetes cluster)

The bot's full source can be [found here](https://github.com/snimmagadda1/github-PR-automation). The scope of this post will go over some background and construction of the core functionality.

&nbsp;

#### A quick note about Github Actions

It's worth mentioning Github Actions also has some capabilities to create pull requests and commits between branches without needing to write code. We operate on an older enterprise version of Github without actions available so an app was the way to automate things in this case. As a  you responsible for hosting Github Actions so you save some *\$\$\$* going that route. However, this bot has very small footprint and we already had a k8s cluster so hosting this thing there was logical. The app-based approach also has the ability to be installed at an organization level to monitor many repos, whereas Github Actions need to be configured at a repository level.

## Github App setup essentials

In order to automate, we'll need to build an application that can perform actions in response to something happening. Github publishes some handy [events](https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types) that apps can subscribe to. At it's core, the bot we're going to build is a web server that will interpret and respond to these events to do something useful. The process of creating a Github app is relatively straightforward and outlined in depth [here](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app).

Set the homepage & callback URL to anything (don't need them for our bot's purposes). However, make sure webhooks are set to active. For the webhook URL, I recommend heading over to [smee.io](https://smee.io) to generate a development webhook URL to start. Smee provides a handy node package we can run to receive forwarded events. During development, smee will act as the middleman to allow our localhost to receive Github event payloads. When the bot is ready to be deployed, we will change the webhook URL to our deployment's domain name. When it comes time to develop, a more detailed description to run your bot locally can be found [here](https://github.com/snimmagadda1/github-PR-automation#usage).

On the permissions page request read/write access to Repository level _Contents_ and _Pull requests_. Continue scrolling and subscribe to the Pull request and Push events:

![Github app subscription check boxes](../images/github_events_subscribe.png)

Go ahead and create the app. Make sure to generate and save a private key (.pem) since that will serve as the auth mechanism. With the app ID and private key in hand, that's it for registering the app!

The bot will perform its "actions" via the API. Some of those actions will require authentication. So lets take a look at how to authenticate as a client of Github's services.

## Authenticating

Github exposes a [single method](https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps) to authenticate as an application. The process is straightforward enough: You create and sign a JWT then send it off in a request for an access token. The private key we downloaded above will be used for signature generation. The maximum lifetime we can request for an access token is 10 minutes. If we wanted to do this in Go, creating the JWT would look something like this using [jwt-go](github.com/dgrijalva/jwt-go):

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

Now, we could write our own methods to send the request for an access token and manage expiration. But why reinvent the wheel? There's an elegant open-source solution that I want to highlight. It's makes calling the API with minimal Go code simple and satisfying.

Bradley Falzon's [ghinstallation](https://github.com/bradleyfalzon/ghinstallation) is an awesome example of how powerful a robust `stdlib` can be. The package provides "authentication as an installation" for https://github.com/google/go-github. ghinstallation leverages the fact that the go-github library's backbone is built using the `http.Client`. That means we can give the `go-github` library a custom `http.Client`, say one that handle's authentication internally, and not have to worry about authenticating. This is exactly what ghinstallation gives us. Using these two libraries in tandem we get free authentication/refresh capability and methods for the majority of endpoints in Github's API.

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

That's half the battle to build our bot. Really. We just need to make sure the function `Handle` can interpret the event payloads Github sends and respond if the payload meets certain criteria. We want a function to interpret the event payload, and if it meets our criteria, submit the payload for processing. It could look something like this using go-github for event types:

```go
func Handle(response http.ResponseWriter, request *http.Request) {
	hook, err := ghwebhooks.New(ghwebhooks.Options.Secret(webhookSecret))
	if err != nil {
		return
	}

	payload, err := hook.Parse(request, []ghwebhooks.Event{ghwebhooks.PushEvent}...)
	if err != nil {
		if err == ghwebhooks.ErrEventNotFound {
			log.Printf("received unregistered GitHub event: %v\n", err)
			response.WriteHeader(http.StatusOK)
		} else {
			log.Printf("received malformed GitHub event: %v\n", err)
			response.WriteHeader(http.StatusInternalServerError)
		}
		return
	}

	switch payload := payload.(type) {
	case ghwebhooks.PushPayload:
		// TODO: More robust comparison logic here
		isRelease := strings.Contains(strings.ToLower(payload.Ref), strings.ToLower(releaseBranch)) && !strings.Contains(payload.Ref, "merge")
		if !isRelease {
			break
		}
		log.Printf("received push event to release branch on repo %s", payload.Ref)
		// handle async b/c github wants speedy replies
		go processEvent(&payload)
	default:
		log.Println("missing handler")
		log.Printf("receieved release payload of type %v", payload)
	}

	response.WriteHeader(http.StatusOK)
}
```

Notice how we are firing each `processEvent` in a new goroutine. It is up to you to create your own secret with the RSA key contents.

To make our release management easier, the `processEvent` function we write should do a few things:
- Whenever a commit is made to the release branch we'll want to create a PR from that branch to master. 
- We should assign reviewers based on the recent committers to the branch. 
- I'm going to take an extra (optional) step and actually create a branhc of the release branch before creating the PR. This will make sure we don't acidentally merge master into release (sometimes Github's UI presents a "This branch is out of date..." message). All of this can be done via Github's API.

For each action, here are the corresponding endpoint(s) needed:

- **Create a pull request: [Create PR](https://docs.github.com/en/rest/reference/pulls#create-a-pull-request)**
- **Assign reviewers:** I' chose to do this by getting authors who contributed to the branch with **[list commits](https://docs.github.com/en/rest/reference/repos#list-commits)** and followed by **[request reviewers](https://docs.github.com/en/rest/reference/pulls#review-requests)**
- **Checkout a branch: [Create a reference](https://docs.github.com/en/rest/reference/git#create-a-reference)**

Using libraries the actions above translate to writing minimal code. The `processEvent` method to run whenever a commit is made to the release is below with [full source here](https://github.com/snimmagadda1/github-PR-automation/tree/master/pkg/client):


```go
func processEvent(p *ghwebhooks.PushPayload) {
	if repo := p.Repository.Name; utils.Contains(repos, repo) {
		// Check out new branch of main
		mergeBranch := "merge-" + releaseBranch

		// 's' is a custom service obj containing helper methods
		ref, err := s.GetRef(p.Installation.ID, repo, releaseBranch, mergeBranch)
		if err != nil {
			log.Fatalf("Unable to get/create the commit reference: %s\n", err)
		}

		if ref == nil {
			log.Fatalf("No error where returned but the reference is nil")
		}

		// Create PR on new branch
		pr, _, err := s.GetV3Client(p.Installation.ID).PullRequests.Create(context.TODO(), owner, repo, &v3.NewPullRequest{
			Title:               v3.String("Merge " + releaseBranch),
			Head:                v3.String(strings.ToLower(mergeBranch)),
			Base:                v3.String(masterBranch),
			Body:                v3.String("This is an automatically created PR 🚀"),
			MaintainerCanModify: v3.Bool(true),
		})
		if err != nil {
			log.Printf("Unable to create pull request. Reason: %v", err)
			return
		} else {
			log.Printf("created pull request: %s", pr.GetURL())
		}

		// Assign reviewers on newly created PR
		err = s.AssignRevs(p.Installation.ID, repo, pr)
		if err != nil {
			log.Printf("Unable to add reviewers to PR: %d %s. Reason: %v", pr.Number, *pr.Title, err)
		} else {
			log.Printf("Successfully assigned reviewers to PR %d %s", pr.Number, *pr.Title)
		}
	} else {
		log.Printf("parsed push - unmonitored repo: %s", repo)
	}
}
```

The last steps to create a running app is to start a HTTP server using the `Handle` function above.'


## Deploying and watching the automation 👀
Docker and kubernetes makes deploying an app like this quick. The Dockerfile definition is below. Pretty standard:

```Docker
FROM golang
ENV GO111MODULE=on

ENV APP_NAME github-pr-bot
ENV PORT 3000

# App specific vars
ENV APP_ID 111
ENV OWNER test
# ENV GITHUB_ENTERPRISE_URL
# ENV GITHUB_ENTERPRISE_UPLOAD_URL
ENV CERT_PATH testpath
ENV RELEASE_BRANCH releasetest
ENV MASTER_BRANCH master
ENV REPOS test

RUN set -x && go version
RUN mkdir /app
ADD . /app
WORKDIR /app
RUN mkdir keys
RUN go build -o main cmd/main.go
CMD ["/app/main"]
```
For the deployment manifest, we'll keep it relatively straightforward. The bot will need some environment variables set specific to where it is being run (Organization name, repos, keys, etc). If you want to view the full definition, you can do so [here](https://github.com/snimmagadda1/github-PR-automation/blob/master/deploy/k8s.yaml). Notably we chose to mount the app's private key as a secret named `github-rsa-keypair` and the mountPath `/app/keys`.

```k8s
.
.
.
        volumeMounts:
        - name: github-rsa-keypair
          mountPath: /app/keys
      volumes:
      - name: github-rsa-keypair
        secret:
          secretName: github-rsa-keypair
          items:
            - key: private-key
              path: github-private-key.pem
```

Executing the yaml will create a deployment and a service. Don't forget to create a secret with the RSA key!


## Summary
To keep this post digestable I've left out a decent bit of implementation. Hopefully it gives folks some direction on building similar apps. If you're looking for more detail around the implementation I encounrage you to check out the [full source](https://github.com/snimmagadda1/github-PR-automation) or reach out of you have any questions.