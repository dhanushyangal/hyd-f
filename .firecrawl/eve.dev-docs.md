Menu

# Getting Started

Copy pageCopy page

Create an eve project, configure model credentials, and run your first agent.

Copy for LLMMarkdownView MarkdownAsk AI about this page

## [Prerequisites](https://eve.dev/docs/getting-started\#prerequisites)

You need:

- Node.js 24 or newer
- npm, which Node.js includes
- A credential for the model your agent uses

Connect a ChatGPT subscription, a Vercel account, or an AI Gateway, OpenAI, or Anthropic API key in the terminal UI. You do not need a Vercel project to start chatting.

Choose a model, provider, and channel that meet your data-processing and compliance requirements.

## [Create a project](https://eve.dev/docs/getting-started\#create-a-project)

Start with one agent in `agent/`.

Run `eve init` with a project name:

```
npx eve@latest init my-agent
```

The command creates the project, installs dependencies, initializes Git, and opens the terminal UI. eve reuses an available model connection or opens `/login`. Once connected, type your first message. Channel and integration setup is optional; use `/add` when you need it.

In `/add`, search by name or capability, such as `iMessage` or `SMS`. The picker matches item names, addresses, titles, and descriptions. Select an item to install it and complete its required setup.

During startup, the status line shows what eve is waiting for. If you choose a Vercel account, finish signing in in your browser and select a team when prompted. eve checks that team's AI Gateway access and applies the connection before returning to the composer. Changing only the account, team, or key does not rebuild your agent. Once connected, you can send your first message while the agent information refreshes in the background; no restart is required.

To add eve to a project that already has a `package.json`, run this command from its root before you create any `agent/` files:

```
npx eve@latest init .
```

eve adds the missing `eve`, `ai`, and `zod` dependencies without changing files the project already owns.

### [Customize initialization](https://eve.dev/docs/getting-started\#customize-initialization)

To initialize the agent with a different AI Gateway model or reasoning effort, pass `--model` or `--reasoning`:

```
npx eve@latest init my-agent --model openai/gpt-5.6-terra --reasoning high
```

## [Run the agent](https://eve.dev/docs/getting-started\#run-the-agent)

The terminal UI opens after interactive initialization. To return later, enter the project and run:

```
cd my-agent
npm run dev
```

This starts an interactive session where you can send messages to your agent. Edit `agent/instructions.md` to change its behavior and `agent/agent.ts` to configure its model. eve reloads your changes as you work.

## [Organize your project](https://eve.dev/docs/getting-started\#organize-your-project)

See [Project Structure](https://eve.dev/docs/concepts/project-structure) when adding another root agent or deciding where a frontend belongs. The [Agent Files reference](https://eve.dev/docs/reference/agent-files) lists supported files and discovery rules.

## [Install manually](https://eve.dev/docs/getting-started\#install-manually)

If you do not want to use the scaffold, install the runtime dependencies:

```
npm install eve@latest ai zod
```

Declare Node.js 24 in `package.json`, then create `agent/instructions.md` and, when you need runtime configuration, `agent/agent.ts`.

## [Continue with the tutorial](https://eve.dev/docs/getting-started\#continue-with-the-tutorial)

The [Tutorial](https://eve.dev/docs/tutorial/first-agent) builds a data analytics agent step by step. It adds tools, state, sandboxed analysis, reusable skills, and human approval before deploying the result.

After the tutorial, continue with the task you need:

| Goal | Read |
| --- | --- |
| Give the model some code it can run | [Tools](https://eve.dev/docs/tools) |
| Connect the agent to an external MCP or OpenAPI service | [Connections](https://eve.dev/docs/connections) |
| Communicate with users through Slack, Discord, or another platform | [Channels](https://eve.dev/docs/channels/overview) |
| Build a browser interface | [Frontend Frameworks](https://eve.dev/docs/guides/frontend/overview) |
| Test agent behavior | [Evals](https://eve.dev/docs/evals/overview) |
| Secure and deploy the agent | [Authentication](https://eve.dev/docs/guides/auth-and-route-protection), then [Deployment](https://eve.dev/docs/guides/deployment/overview) |

Read [Execution Model and Durability](https://eve.dev/docs/concepts/execution-model-and-durability) for the mental model behind sessions, turns, durable steps, and parked work.

[NextProject Structure](https://eve.dev/docs/concepts/project-structure)