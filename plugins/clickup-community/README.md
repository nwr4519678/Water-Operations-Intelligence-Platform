# ClickUp Community

An open-source Codex MCP plugin for ClickUp Public API v2.

## What it does

- Reads a complete Workspace hierarchy.
- Creates Spaces, Folders, Lists, and Tasks.
- Updates Tasks and deletes supported resources.
- Exposes explicit tools generated from ClickUp's official OpenAPI description.
- Provides clickup_request for any supported API operation.

## Authentication

Create a ClickUp personal API token, then configure it in the environment used by Codex:

~~~powershell
$env:CLICKUP_API_TOKEN = "<your-token>"
$env:CLICKUP_WORKSPACE_ID = "<optional-workspace-id>"
~~~

The token is sent only as the Authorization header to https://api.clickup.com/api/v2.
Never commit it, place it in plugin files, or paste it into task descriptions.

## Install from this repository

From the repository root:

~~~powershell
codex plugin marketplace add .
codex plugin add clickup-community@clickup-community
~~~

Start a new Codex task after installation so the MCP server is loaded.

## Release checklist

1. Run the plugin validator against plugins/clickup-community from the plugin-creator skill directory.
2. Run Python compile checks against plugins/clickup-community/clickup_community_server.py.
3. Confirm no credentials are present with git grep.
4. Tag a semantic version and publish the repository.

## License

MIT.
