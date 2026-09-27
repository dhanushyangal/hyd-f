[Skip to content](https://vercel.com/kb/guide/ship-a-express-app-on-vercel#geist-skip-nav)

[Vercel](https://vercel.com/home)

Copy WordmarkCopy Logo

Download Brand AssetsBrand Guidelines

[Docs](https://vercel.com/docs)

Build

Build with AI

- [AI Gateway](https://vercel.com/docs/ai-gateway)
- [AI SDK](https://vercel.com/docs/ai-sdk)
- [Sandbox](https://vercel.com/docs/sandbox)
- [Container Registry](https://vercel.com/docs/container-registry)
- [Workflow](https://vercel.com/docs/workflows)
- [Vercel Agent](https://vercel.com/docs/agent)
- [v0↗](https://v0.app/)
- [Vercel MCP](https://vercel.com/docs/mcp)
- [AI Integrations](https://vercel.com/docs/agent-resources/integrations-for-models)

Deploy & scale

- [Deployments](https://vercel.com/docs/deployments)
- [CLI](https://vercel.com/docs/cli)
- [Functions](https://vercel.com/docs/functions)
- [Delivery Network](https://vercel.com/docs/cdn)
- [Storage](https://vercel.com/docs/storage)
- [Integrations](https://vercel.com/docs/integrations)
- [Microfrontends](https://vercel.com/docs/microfrontends)
- [Domains](https://vercel.com/docs/domains)

Operate & protect

- [Firewall](https://vercel.com/docs/vercel-firewall)
- [Observability](https://vercel.com/docs/observability)
- [Feature Flags](https://vercel.com/docs/flags)
- [Toolbar](https://vercel.com/docs/vercel-toolbar)
- [Bot Management](https://vercel.com/docs/bot-management)
- [BotID](https://vercel.com/docs/botid)
- [Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Compliance](https://vercel.com/docs/security/compliance)

Learn

Resources

- [Changelog↗](https://vercel.com/changelog)
- [Blog↗](https://vercel.com/blog)
- [Community↗](https://community.vercel.com/)
- [Knowledge Base](https://vercel.com/kb)
- [APIs & SDKs](https://vercel.com/docs/rest-api)
- [Templates](https://vercel.com/templates)

[Getting Started](https://vercel.com/docs/getting-started-with-vercel)

Ask AI

[Log In](https://vercel.com/login) [Sign Up](https://vercel.com/signup)

* * *

Build

Build with AI

- [AI Gateway](https://vercel.com/docs/ai-gateway)
- [AI SDK](https://vercel.com/docs/ai-sdk)
- [Sandbox](https://vercel.com/docs/sandbox)
- [Container Registry](https://vercel.com/docs/container-registry)
- [Workflow](https://vercel.com/docs/workflows)
- [Vercel Agent](https://vercel.com/docs/agent)
- [v0↗](https://v0.app/)
- [Vercel MCP](https://vercel.com/docs/mcp)
- [AI Integrations](https://vercel.com/docs/agent-resources/integrations-for-models)

Deploy & scale

- [Deployments](https://vercel.com/docs/deployments)
- [CLI](https://vercel.com/docs/cli)
- [Functions](https://vercel.com/docs/functions)
- [Delivery Network](https://vercel.com/docs/cdn)
- [Storage](https://vercel.com/docs/storage)
- [Integrations](https://vercel.com/docs/integrations)
- [Microfrontends](https://vercel.com/docs/microfrontends)
- [Domains](https://vercel.com/docs/domains)

Operate & protect

- [Firewall](https://vercel.com/docs/vercel-firewall)
- [Observability](https://vercel.com/docs/observability)
- [Feature Flags](https://vercel.com/docs/flags)
- [Toolbar](https://vercel.com/docs/vercel-toolbar)
- [Bot Management](https://vercel.com/docs/bot-management)
- [BotID](https://vercel.com/docs/botid)
- [Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Compliance](https://vercel.com/docs/security/compliance)

Learn

Resources

- [Changelog↗](https://vercel.com/changelog)
- [Blog↗](https://vercel.com/blog)
- [Community↗](https://community.vercel.com/)
- [Knowledge Base](https://vercel.com/kb)
- [APIs & SDKs](https://vercel.com/docs/rest-api)
- [Templates](https://vercel.com/templates)

[Getting Started](https://vercel.com/docs/getting-started-with-vercel)

Ask AI

[Sign Up](https://vercel.com/signup) [Log In](https://vercel.com/login)

# How to ship an Express app on Vercel

Deploy an Express app to Vercel with zero configuration. Configure response streaming, middleware, cron jobs, the Bun runtime, and observability.

![](https://images.ctfassets.net/hjgychtc108g/vjxPLRmH6TxBcTNI0x3sg/af2d6cae1a5ea540f8f151d901dbb92b/ben-sabic-headshot.jpeg)

[Ben Sabic](https://bensabic.ca/) Content Engineer

[Knowledge Base](https://vercel.com/kb) [Express](https://vercel.com/kb/express)

15 Jun 2026

8 min read

Copy

[![](https://vercel.com/vc-ap-vercel-docs/_next/static/immutable/media/logo-google-color-light.2x6g4y99zlarz.svg)![](https://vercel.com/vc-ap-vercel-docs/_next/static/immutable/media/logo-google-color-dark.3nr_e0zdganvm.svg)Add as preferred](https://www.google.com/preferences/source?q=vercel.com)

[![](https://vercel.com/vc-ap-vercel-docs/_next/static/immutable/media/logo-google-color-light.2x6g4y99zlarz.svg)![](https://vercel.com/vc-ap-vercel-docs/_next/static/immutable/media/logo-google-color-dark.3nr_e0zdganvm.svg)Add as preferred](https://www.google.com/preferences/source?q=vercel.com)

[Express](https://expressjs.com/) is a fast, unopinionated, minimalist web framework for Node.js. It gives you a thin layer over Node's HTTP server, a familiar middleware model, straightforward routing, and a large ecosystem of community middleware for tasks like authentication, body parsing, and logging.

On Vercel, you can deploy an Express app with zero configuration: your app runs as a single [Vercel Function](https://vercel.com/docs/functions) on [Fluid compute](https://vercel.com/fluid), and you get response streaming, preview deployments, and observability without extra setup.

This guide walks you through deploying an Express app to Vercel from a template, the [Vercel CLI](https://vercel.com/docs/cli), or a Git repository, then configuring features such as streaming, middleware, cron jobs, the Bun runtime, and observability.

## [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#prerequisites) Prerequisites

Before you begin, make sure you have:

- A [Vercel account](https://vercel.com/signup)
- Node.js 20+ and a package manager (e.g., npm)
- An existing Express project, or a new one created from an [Express template](https://vercel.com/templates/express)
- A Git repository on GitHub, GitLab, or Bitbucket (if you want Git-based deployments)
- Vercel CLI installed (`npm i -g vercel`)

## [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#how-it-works) How it works

When you deploy an Express app, Vercel detects the framework and builds it for the Vercel runtime. Your Express app handles requests through a single [Vercel Function](https://vercel.com/docs/functions), which runs on Fluid compute by default. Your app scales up and down with traffic, and you pay only for the compute it uses, not for idle time.

Because Vercel ships zero-configuration detection for Express, you don't set a build command or output directory. Vercel reads your project, finds the file that exports your Express app (or starts it with a port listener), and applies the correct build settings.

## [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#deploy-your-express-app) Deploy your Express app

You can ship an Express app to Vercel in three ways. Choose the one that fits where your code lives today.

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#option-1:-deploy-from-a-template) Option 1: Deploy from a template

The fastest way to ship an Express app is to start from a template. Browse the [Express templates gallery](https://vercel.com/templates/express), pick a starter, and deploy it. Vercel clones the template to your Git provider, creates a project, and deploys it with zero configuration.

Templates to start from include:

- [Express on Bun](https://vercel.com/templates/express/express-on-bun): An Express backend that runs on the Bun runtime, ready to deploy and to develop locally with Bun.
- [SaaS Microservices](https://vercel.com/templates/next.js/saas-microservices): A Next.js dashboard paired with an Express API service, running under one domain with [Vercel Microfrontends](https://vercel.com/docs/microfrontends).

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#option-2:-start-a-new-project-with-the-vercel-cli) Option 2: Start a new project with the Vercel CLI

To scaffold a new Express project locally, use the [Vercel CLI init command](https://vercel.com/docs/cli/init). It clones Vercel's Express example into a folder named `express`.

1. Create the project:










Terminal





















```bash
vercel init express
```

2. Install dependencies:










Terminal





















```bash
cd express

npm install
```

3. Develop locally at `http://localhost:3000`. Run it with the Vercel CLI so your app behaves the same way it does in production:










Terminal





















```bash
vercel dev
```

4. Create a [preview deployment](https://vercel.com/docs/deployments/environments#preview-environment-pre-production). The first run links the project:










Terminal





















```bash
vercel
```

5. Promote your deployment to production:










Terminal





















```bash
vercel --prod
```


### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#option-3:-deploy-an-existing-express-app) Option 3: Deploy an existing Express app

If you already have an Express app, deploy it from Git or from the command line.

From Git: Push your project to GitHub, GitLab, or Bitbucket, then import it at [vercel.com/new](https://vercel.com/new). Vercel detects Express automatically and deploys it with zero configuration.

From the CLI: From your project's root directory, run `vercel` to create a preview deployment, then `vercel --prod` to go live. To pull project settings and environment variables for local development, run:

Terminal

```bash
vercel link

vercel env pull
```

For Vercel to detect your app, export your Express instance as the default export from one of the recognized entry files, such as `app.ts`, `index.ts`, or `server.ts` at your project root or under `src/`:

src/index.ts

```typescript
import express from 'express';

const app = express();

app.get('/', (req, res) => {

  res.json({ message: 'Hello from Express on Vercel' });

});

export default app;
```

If your `package.json` uses `"type": "commonjs"`, export the app with `module.exports = app` instead. You can also start the app with a port listener (`app.listen`) rather than a default export, and Vercel detects either pattern.

## [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#use-vercel-features-with-express) Use Vercel features with Express

After your app is deployed, you can layer Vercel features onto it. Some work automatically, and others take a few lines of configuration in `vercel.json`.

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#your-app-runs-as-a-single-vercel-function) Your app runs as a single Vercel Function

Vercel bundles your entire Express app into a single [Vercel Function](https://vercel.com/docs/functions). Every incoming request goes to that function, and Express's router matches the path to your route handlers, middleware, and error handling.

This function uses Fluid compute by default, which runs multiple requests concurrently within a single instance to reduce cold starts and the cost of I/O-bound work such as API calls and database queries. You don't configure anything to get this behavior.

Because your entire app ships as a single bundle, it must fit within the 250 MB limit for Vercel Functions. Vercel removes unneeded files from the bundle to keep it small, but it doesn't bundle your application code with a tool like Webpack or Rollup.

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#stream-responses) Stream responses

Vercel Functions stream responses by default on Node.js, so you can send data to the client as you produce it instead of waiting for the full response. Express builds on Node's response object, so you stream by writing chunks with `res.write()` and finishing with `res.end()`:

src/index.ts

```typescript
import express from 'express';

const app = express();

app.get('/stream', async (req, res) => {

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  req.on('close', () => {

    console.log('Client disconnected');

  });

  for (const chunk of ['Hello', ' ', 'from', ' ', 'Express']) {

    res.write(chunk);

    await new Promise((resolve) => setTimeout(resolve, 200));

  }

  res.end();

});

export default app;
```

Streaming pairs well with Fluid compute: while your function waits between chunks, the same instance can serve other requests. To stream AI model output, [AI SDK](https://ai-sdk.dev/docs/foundations/streaming) handles the response formatting for you.

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#combine-express-middleware-with-vercel-routing-middleware) Combine Express middleware with Vercel Routing Middleware

Express and Vercel each have a middleware layer, and they solve different problems. Express middleware runs inside your app's router, after the request reaches your function. Use it for app-level concerns such as body parsing, logging, CORS, and authentication:

src/index.ts

```typescript
import express from 'express';

import cors from 'cors';

const app = express();

app.use(express.json());

app.use((req, res, next) => {

  console.log(`${req.method} ${req.path}`);

  next();

});

app.use('/posts', cors());

app.post('/posts', (req, res) => {

  res.json({ ok: true });

});

export default app;
```

Here, `express.json()` is built in, while `cors` comes from the `cors` package you install separately. [Vercel Routing Middleware](https://vercel.com/docs/routing-middleware) runs at the edge, before the request reaches your Express app. Use it for rewrites, redirects, and header changes that should happen before any function runs. The two layers work together, with Routing Middleware shaping the request at the edge and Express middleware handling it inside your app.

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#serve-static-assets-from-the-cdn) Serve static assets from the CDN

To serve static files such as images, fonts, or a favicon, place them in the `public/**` directory. Vercel serves them through its [CDN](https://vercel.com/docs/cdn) using default [headers](https://vercel.com/docs/headers), which you can override in `vercel.json`. Express's own `express.static()` helper is ignored on Vercel, so rely on the `public` directory instead.

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#run-scheduled-tasks-with-cron-jobs) Run scheduled tasks with cron jobs

Vercel [Cron Jobs](https://vercel.com/docs/cron-jobs) trigger a route on a schedule by sending an HTTP GET request to it. Define a route in your Express app for the task, then register the schedule in `vercel.json`.

Define the route:

src/index.ts

```typescript
import express from 'express';

const app = express();

app.get('/api/cron/cleanup', (req, res) => {

  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {

    return res.status(401).send('Unauthorized');

  }

  // Run your scheduled work here

  res.json({ ok: true });

});

export default app;
```

Register the schedule:

vercel.json

```json
{

  "$schema": "https://openapi.vercel.sh/vercel.json",

  "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 0 * * *" }]

}
```

Vercel runs cron jobs only on production deployments. To stop anyone else from calling the route, set a `CRON_SECRET` environment variable in your project settings. Vercel sends it as a `Bearer` token in the `Authorization` header on every cron invocation, and your handler compares it before running the task.

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#use-the-bun-runtime) Use the Bun runtime

Express runs your function on Node.js by default. To run it on [Bun](https://vercel.com/docs/functions/runtimes/bun) instead, set `bunVersion` in `vercel.json`:

vercel.json

```json
{

  "$schema": "https://openapi.vercel.sh/vercel.json",

  "bunVersion": "1.x"

}
```

Vercel detects the setting, runs your app on Bun in both `vercel dev` and production, and keeps it on Fluid compute. The Bun runtime is in public beta and supports most Node.js APIs. Set the major version only, and Vercel manages the minor and patch versions. For a ready-made starting point, deploy the [Express on Bun](https://vercel.com/templates/express/express-on-bun) template.

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#monitor-performance-with-observability) Monitor performance with Observability

[Vercel Observability](https://vercel.com/products/observability) tracks your deployed function automatically, with no setup. Open the Observability page in your project to see invocation counts, error rates, and duration for your Express app, along with the requests your function makes to external APIs. On [Observability Plus](https://vercel.com/docs/observability/observability-plus), you also get longer retention and a latency breakdown by path.

## [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#best-practices) Best practices

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#export-your-app-from-a-recognized-entry-point) Export your app from a recognized entry point

Vercel finds your Express app by looking for a file at a fixed set of locations: `app`, `index`, or `server` (with a `.js`, `.ts`, or related extension) at your project root or under `src/`. The file must export your app as a default export or start it with a port listener. Put your app at one of these paths so Vercel detects and deploys it correctly:

src/index.ts

```typescript
import express from 'express';

const app = express();

// Add your routes here

export default app;
```

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#handle-errors-explicitly) Handle errors explicitly

Add an error-handling middleware so a thrown error doesn't leave your function in an undefined state. Express catches errors and renders its own 500 response, which can stop Vercel from recycling the function and resetting it for the next request. An error handler at the end of your middleware chain keeps this predictable:

src/index.ts

```typescript
import express from 'express';

const app = express();

// Routes here

app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({ error: 'Internal server error' });

});

export default app;
```

### [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#develop-with-the-vercel-cli) Develop with the Vercel CLI

Run `vercel dev` for local development instead of a standalone server. It serves your app the way production does, so the behavior you test locally matches what you deploy. This also lets you exercise features such as cron routes and the Bun runtime before shipping.

## [Copy link to heading](https://vercel.com/kb/guide/ship-a-express-app-on-vercel\#resources-and-next-steps) Resources and next steps

- Read the full [Express on Vercel documentation](https://vercel.com/docs/frameworks/backend/express)
- Browse [Express templates](https://vercel.com/templates/express) you can deploy in one step
- Learn how [Vercel Functions](https://vercel.com/docs/functions) run your server code
- Understand pricing and scaling with [Fluid compute](https://vercel.com/docs/fluid-compute)
- Run code before requests with [Routing Middleware](https://vercel.com/docs/routing-middleware)
- Review the [Vercel Functions limits](https://vercel.com/docs/functions/limitations) that apply to your app
- Defer background work from your routes with [Vercel Queues](https://vercel.com/docs/queues), or orchestrate multi-step tasks with [Vercel Workflows](https://vercel.com/docs/workflows)
- Read the [Express documentation](https://expressjs.com/) for framework details

### Related documentation

- [Fluid compute](https://vercel.com/docs/fluid-compute)
- [Vercel Functions](https://vercel.com/docs/functions)

## More Fluid compute guides

- [**Product** \\
\\
  - TanStack\\
  - Comparisons\\
\\
**TanStack Start on Vercel vs Cloudflare** \\
\\
Compare running TanStack Start on Vercel Functions with Fluid compute against Cloudflare Workers. Learn how the runtimes, storage, background jobs, pricing, and developer experience differ so you can choose the right platform.](https://vercel.com/kb/guide/tanstack-start-on-vercel-vs-cloudflare)
- [**Product** \\
\\
  - TanStack\\
  - Nitro\\
  - Comparisons\\
\\
**TanStack Start on Vercel vs Netlify** \\
\\
Compare running TanStack Start on Vercel Functions with Fluid compute against Netlify Functions. Learn how the compute models, storage, background jobs, pricing, and developer experience differ so you can choose the right platform.](https://vercel.com/kb/guide/tanstack-start-on-vercel-vs-netlify)
- [**Product** \\
\\
  - TanStack\\
  - Nitro\\
\\
**How to Deploy a TanStack Start app to Vercel** \\
\\
Deploy a TanStack Start app to Vercel with the Nitro Vite plugin. Covers Git and CLI deployment, Fluid compute defaults, and framework detection fixes.](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel)

* * *

## Ready to deploy?

[Start deploying](https://vercel.com/new) [Talk to an expert](https://vercel.com/contact/sales)

## Agent Stack

- [AI SDK](https://vercel.com/ai-sdk)
- [AI Gateway](https://vercel.com/ai-gateway)
- [Sandbox](https://vercel.com/sandbox)
- [Workflows](https://vercel.com/workflows)
- [ConnectNew](https://vercel.com/connect)
- [PassportNew](https://vercel.com/passport)
- [eveNew](https://vercel.com/eve)

## Core Platform

- [CI/CD](https://vercel.com/products/previews)
- [Content Delivery](https://vercel.com/cdn)
- [Fluid Compute](https://vercel.com/fluid)
- [Observability](https://vercel.com/products/observability)

## Security

- [Platform Security](https://vercel.com/security)
- [WAF](https://vercel.com/security/web-application-firewall)
- [Bot Management](https://vercel.com/security/bot-management)
- [BotID](https://vercel.com/botid)

## Tools

- [Vercel DropNew](https://vercel.com/drop)
- [Vercel Agent](https://vercel.com/agent)
- [Vercel PluginNew](https://vercel.com/plugin)
- [Agent Skills](https://skills.sh/)
- [Domains](https://vercel.com/domains)
- [v0](https://v0.app/)

## Frameworks

- [eveNew](https://eve.dev/)
- [Next.js](https://vercel.com/frameworks/nextjs)
- [Nuxt](https://vercel.com/docs/frameworks/full-stack/nuxt)
- [SvelteKit](https://vercel.com/docs/frameworks/full-stack/sveltekit)
- [Nitro](https://vercel.com/docs/frameworks/backend/nitro)
- [Turborepo](https://vercel.com/solutions/turborepo)
- [Tanstack Start](https://vercel.com/docs/frameworks/full-stack/tanstack-start)
- [FastAPI](https://vercel.com/docs/frameworks/backend/fastapi)
- [All frameworks](https://vercel.com/docs/frameworks)

## SDKs

- [Vercel SDK](https://vercel.com/docs/rest-api/sdk)
- [Workflow SDKNew](https://vercel.com/workflows)
- [Flags SDK](https://vercel.com/docs/flags/flags-sdk-reference)
- [Chat SDKNew](https://vercel.com/chat)
- [Queues SDKNew](https://vercel.com/docs/queues/sdk)
- [Streamdown](https://streamdown.ai/)

## Build

- [AI Apps](https://vercel.com/solutions/ai-apps)
- [Web Apps](https://vercel.com/for/web-apps)
- [Marketing Sites](https://vercel.com/solutions/marketing-sites)
- [Platforms](https://vercel.com/solutions/multi-tenant-saas)
- [Commerce](https://vercel.com/solutions/composable-commerce)
- [Platform Engineers](https://vercel.com/solutions/platform-engineering)
- [Design Engineers](https://vercel.com/solutions/design-engineering)

## Learn

- [Docs](https://vercel.com/docs)
- [Blog](https://vercel.com/blog)
- [Changelog](https://vercel.com/changelog)
- [Knowledge Base](https://vercel.com/kb)
- [Academy](https://vercel.com/academy)
- [Articles](https://vercel.com/i)
- [Community](https://community.vercel.com/)
- [Is Agentic](https://is-agentic.com/)

## Explore

- [Customers](https://vercel.com/customers)
- [Marketplace](https://vercel.com/marketplace)
- [Templates](https://vercel.com/templates)
- [Partner Finder](https://vercel.com/partners/solution-partners)
- [Vercel + AWS](https://vercel.com/partners/aws)

## Company

- [About](https://vercel.com/about)
- [Careers](https://vercel.com/careers)
- [Press](https://vercel.com/press)
- [Events](https://vercel.com/events)
- [Startups](https://vercel.com/startups)
- [Shipped on Vercel](https://vercel.com/shipped)
- [Open Source Program](https://vercel.com/open-source-program)
- [Enterprise](https://vercel.com/enterprise)
- [Pricing](https://vercel.com/pricing)
- [Help](https://vercel.com/help)

## Legal & Trust

- [Privacy Policy](https://vercel.com/legal/privacy-policy)
- [Terms of Service](https://vercel.com/legal/terms)
- [Cookie Policy](https://vercel.com/legal/cookie-policy)
- [DPA](https://vercel.com/legal/dpa)
- [Acceptable Use Policy](https://vercel.com/legal/acceptable-use-policy)
- [Legal (all documents)](https://vercel.com/legal)
- [Trust Center](https://security.vercel.com/)
- [Status](https://www.vercel-status.com/)
- Cookie Preferences

## Social

- [GitHub](https://github.com/vercel)
- [X](https://x.com/vercel)
- [LinkedIn](https://linkedin.com/company/vercel)
- [YouTube](https://youtube.com/@VercelHQ)
- [Instagram](https://www.instagram.com/vercel/)

- [![Vercel](https://vercel.com/vc-ap-vercel-docs/_next/static/immutable/media/vercel-light.3_gxxexgi1nmy.svg)![Vercel](https://vercel.com/vc-ap-vercel-docs/_next/static/immutable/media/vercel-dark.1f3cgy23m5_jy.svg)](https://vercel.com/home)

[All systems normal.](https://www.vercel-status.com/)

Select a display theme:systemlightdark