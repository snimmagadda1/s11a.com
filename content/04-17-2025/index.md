---
title: "Testing Routes Secured with OAuth 2.0 and Passport.js"
slug: testing-routes-secured-with-oauth2-and-passportjs
cover: "../thumbnails/nodejs.png"
category: "test3"
categories:
  - Code
  - Backend
  - Cloud
date: "04/17/2025"
thumbnail: "../thumbnails/nodejs.png"
tags:
  - JavaScript
  - Node.js
  - API
  - Testing
time: "5 min"
type: "post"
---

I recently started poking at the developer experience of the Node.js world. As a Java dev by day, I wanted to learn the JS community patterns on a lower level. I went through the exercise of standing up an Express.js + Passport.js server for a project
and surprisingly didn't find a consensus pattern to test an app using Oauth 2.0 for authorization. Many docs were helpful, but dated.
Therefore, approach here outlines the path I took: a Passport.js strategy to functionally test protected routes without making HTTP requests to the authentication provider.

## Prerequisites

- Node.js/Express application
- Passport.js + an Oauth 2.0 authentication strategy (here we use Github)
- Bun (used here for ease of running & testing)

## The problem

I wrote a little app with an option to sign-up using Github, and wanted to write functional tests. Testing protected routes using a [delegated sign-in](https://web.archive.org/web/20160322014955/http://hueniverse.com/2009/04/16/introducing-sign-in-with-twitter-oauth-style-connect/) generally requires making HTTP requests to the authentication provider. If you recall, the OAuth 2.0 authorization code flow[^1]:

![Oauth 2.0 authorization code flow](../images/oauth2-authorization-code-flow.png)

If we have a route similar to this, how do we 'get past' the authentication in our functional tests to assert the business logic?:

```typescript
// Create a user
app.post(
  "/users",

  // Validate authentication state
  (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  },

  // Business logic
  (req: any, res: any) => {
    const { name, email } = req.body;
    const user = { id: Date.now().toString(), name, email };
    userService.save(user);
    res.status(201).json(user);
  }
);
```

## Recapping the Oauth2 setup

I'll skip the majority of the Express setup & configuration to focus on the testing approach.
For reference, the full application and quick start can be found [here](https://github.com/snimmagadda1/express-passport-github-oauth2-functional-testing).
The project delegates sign in via Github OAuth 2.0, specifically using session-based authentication with cookies. Notably, the app's strategy, `passport-github2`, is defined straight from the docs with `passport.use()`:

```typescript
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { userService } from "../services/userService"; // in-memory user store

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "http://localhost:3000/auth/github/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any
    ) => {
      try {
        // Find existing user or create a new one
        const user = userService.findOrCreate(profile);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
```

and on successful authentication it performs a standard redirect to the homepage:

```typescript
app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/")
);
```

This is good and simple. But, if we try to test the business logic behind a protected route such as POST /users, out of the box, the test will have to actually authenticate with Github's Authorization server, using real credentials. This is extraneous for functional testing (and a potential security risk!). There has to be a better way.

## Providing a mocked strategy

Strategies are classes that implement an authentication mechanism via the `authenticate` function. In this case, `passport-github2` implements the authorization code flow.
With respect to functional tests, we aren't interested in testing this behavior. We are primarily interested in testing the business logic. 

So, let's 'short-circuit' the authentication process by implementing a mocked strategy class for our test environment. Adhering to the contract of the `Strategy` class from `passport-strategy`[^2], the `MockGHStrategy` simply implements the `authenticate`
 function by calling the callback and returning a mocked profile (based on the response from the Github /user resource). It doesn't do anything else:

```typescript
export default class MockGHStrategy extends passport.Strategy {
  _cb: (
    accessToken: string,
    refreshToken: string,
    profile: GitHubProfile,
    done: (a: unknown, user: Express.User | false) => void
  ) => void;
  _user: GitHubProfile;

  constructor(name: string, cb: any) {
    super();

    this.name = name;
    this._cb = cb;
    this._user = githubUser;
  }

  /**
   * Authenticate a request.
   *
   * `this.success(user, info)`, `this.fail(challenge, status)`,
   * `this.redirect(url, status)`, `this.pass()`, or `this.error(err)`.
   * https://github.com/jaredhanson/passport-strategy#augmented-methods.
   *
   * @param {Object} _req - Request.
   * @param {Object} options - The options object passed to `passport.authenticate()`.
   * @return {void}
   */
  authenticate(_req: any, _options: any) {
    this._cb("N/A", "N/A", this._user, (err: any, user: any) => {
      this.success(user);
    });
  }
}

// The reply from github oauth2
const githubUser = {
  id: "19558427",
  nodeId: "11111",
  displayName: "Sai Nimmagadda",
  username: "snimmagadda1",
... // rest of the profile

```

## Configuring passport's strategy conditionally

The trick is to detect the environment (simply using an environment variable here) and provide the strategy to passport accordingly
 (full implementation [here](https://github.com/snimmagadda1/express-passport-github-oauth2-functional-testing/blob/main/loaders/passport-strategy.ts)):

```typescript
export default async function () {
  passport.use(environmentStrategy(userService));
}

// Inject store to environment strategy
const strategyCallback =
  (store: any) =>
  async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ) => {
    try {
      // Find existing user or create a new one
      const user = store.findOrCreate(profile);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  };

const environmentStrategy = (store: any): passport.Strategy => {
  switch (process.env.NODE_ENV) {
    case "test":
      return new MockGHStrategy("github", strategyCallback(store));
    default:
      return new GitHubStrategy(config, strategyCallback(store));
  }
};
```

That's really all there is to it. You can now write tests for your protected routes. Endpoints will be still be protected by the passport middleware, but the strategy will be mocked, making authenticating before each test case a simple procedure.
[For example, using the `supertest` library](https://github.com/snimmagadda1/express-passport-github-oauth2-functional-testing/blob/main/test/users.test.ts):

```typescript
const createAuthenticatedAgent = async (
  expressApp: Express
): Promise<Agent> => {
  const authAgent = request.agent(expressApp);
  console.info(`Before cookie jar ${authAgent}`);
  // Go directly to the callback URL since we're using a mock strategy
  const response: Response = await authAgent
    .get("/auth/github/callback")
    .expect(302);

  // Verify the header for debugging
  const cookieHeader = response.headers["set-cookie"];
  const sessionCookies = Array.isArray(cookieHeader)
    ? cookieHeader
    : [cookieHeader];
  if (!sessionCookies || sessionCookies.length === 0) {
    throw new Error("No session cookie set");
  }
  return authAgent;
};

beforeEach(async () => {
  await loadLoaders();
  app = await getExpressApp();
  authenticatedAgent = await createAuthenticatedAgent(app);
});
```

## Resources and further reading

- [Full GitHub repository](https://github.com/snimmagadda1/express-passport-github-oauth2-functional-testing)
- [Passport.js](https://www.passportjs.org)
- [supertest](https://github.com/ladjs/supertest)

[^1]: [DigitalOcean Intro to OAuth 2.0](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2)
[^2]: [passport-strategy](https://github.com/jaredhanson/passport-strategy?tab=readme-ov-file#implement-authentication)