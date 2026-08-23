import json
import os
import re
import sys
import urllib.parse
import urllib.request
import urllib.error

BASE = "https://api.clickup.com/api"
OPENAPI_URL = "https://developer.clickup.com/openapi/clickup-api-v2-reference.json"
SERVER_VERSION = "0.3.0"
USER_AGENT = f"clickup-community/{SERVER_VERSION}"


def api_call(method, path, query=None, body=None):
    token = os.environ.get("CLICKUP_API_TOKEN")
    if not token:
        raise RuntimeError("Set CLICKUP_API_TOKEN before using clickup_community.")
    if not isinstance(path, str) or not path:
        raise ValueError("ClickUp API path must be a non-empty string.")
    if "://" in path or not path.startswith("/"):
        raise ValueError("ClickUp API path must be relative to /api/v2.")
    if not path.startswith("/v2/"):
        path = "/v2" + path
    url = BASE + path
    if query:
        url += "?" + urllib.parse.urlencode(query, doseq=True)
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method.upper())
    req.add_header("Authorization", token)
    req.add_header("User-Agent", USER_AGENT)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {"status": response.status}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(raw)
        except json.JSONDecodeError:
            detail = raw
        raise RuntimeError(f"ClickUp API {exc.code}: {detail}")


def workspace_id(value=None):
    value = value or os.environ.get("CLICKUP_WORKSPACE_ID")
    if value:
        return str(value)
    teams = api_call("GET", "/team").get("teams", [])
    if not teams:
        raise RuntimeError("No ClickUp Workspace is available for this token.")
    return str(teams[0]["id"])


def hierarchy(wid):
    spaces = api_call("GET", f"/team/{workspace_id(wid)}/space", {"archived": "false"}).get("spaces", [])
    root = {"id": workspace_id(wid), "name": "Workspace", "type": "workspace", "children": []}
    for space in spaces:
        node = {"id": space["id"], "name": space["name"], "type": "space", "children": []}
        folders = api_call("GET", f"/space/{space['id']}/folder", {"archived": "false"}).get("folders", [])
        for folder in folders:
            fnode = {"id": folder["id"], "name": folder["name"], "type": "folder", "children": []}
            lists = api_call("GET", f"/folder/{folder['id']}/list", {"archived": "false"}).get("lists", [])
            fnode["children"] = [{"id": x["id"], "name": x["name"], "type": "list", "children": []} for x in lists]
            node["children"].append(fnode)
        lists = api_call("GET", f"/space/{space['id']}/list", {"archived": "false"}).get("lists", [])
        node["children"].extend({"id": x["id"], "name": x["name"], "type": "list", "children": []} for x in lists)
        root["children"].append(node)
    return root


CORE_TOOLS = [
    {"name": "clickup_request", "description": "Call any ClickUp Public API v2 endpoint. Use this for full control of ClickUp resources.", "inputSchema": {"type": "object", "properties": {"method": {"type": "string", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"]}, "path": {"type": "string", "description": "Path after /api/v2, e.g. /team/{workspace_id}/space"}, "query": {"type": "object"}, "body": {"type": "object"}}, "required": ["method", "path"]}},
    {"name": "clickup_get_workspace_hierarchy", "description": "Return every Space, Folder, and List in a ClickUp Workspace as a tree.", "inputSchema": {"type": "object", "properties": {"workspace_id": {"type": "string"}}}},
    {"name": "clickup_create_space", "description": "Create a Space in a Workspace.", "inputSchema": {"type": "object", "properties": {"workspace_id": {"type": "string"}, "name": {"type": "string"}, "private": {"type": "boolean"}}, "required": ["name"]}},
    {"name": "clickup_create_folder", "description": "Create a Folder in a Space.", "inputSchema": {"type": "object", "properties": {"space_id": {"type": "string"}, "name": {"type": "string"}}, "required": ["space_id", "name"]}},
    {"name": "clickup_create_list", "description": "Create a List in a Space or Folder.", "inputSchema": {"type": "object", "properties": {"space_id": {"type": "string"}, "folder_id": {"type": "string"}, "name": {"type": "string"}}, "required": ["name"]}},
    {"name": "clickup_create_task", "description": "Create a task in a List.", "inputSchema": {"type": "object", "properties": {"list_id": {"type": "string"}, "name": {"type": "string"}, "description": {"type": "string"}, "status": {"type": "string"}, "priority": {"type": "integer"}, "assignees": {"type": "array", "items": {"type": "integer"}}, "due_date": {"type": "integer"}, "parent": {"type": "string"}}, "required": ["list_id", "name"]}},
    {"name": "clickup_update_task", "description": "Update any supported task fields.", "inputSchema": {"type": "object", "properties": {"task_id": {"type": "string"}, "fields": {"type": "object"}}, "required": ["task_id", "fields"]}},
    {"name": "clickup_delete", "description": "Delete a Space, Folder, List, or Task by resource type and ID.", "inputSchema": {"type": "object", "properties": {"resource_type": {"type": "string", "enum": ["space", "folder", "list", "task"]}, "resource_id": {"type": "string"}}, "required": ["resource_type", "resource_id"]}},
]


def schema_type(schema):
    """Convert an OpenAPI schema into a compact MCP input schema."""
    if not isinstance(schema, dict):
        return {"type": "string"}
    typ = schema.get("type")
    if isinstance(typ, list):
        typ = next((x for x in typ if x != "null"), "string")
    if typ in {"object", "array", "string", "integer", "number", "boolean"}:
        result = {"type": typ}
        if typ == "array" and isinstance(schema.get("items"), dict):
            result["items"] = schema_type(schema["items"])
        if typ == "object" and isinstance(schema.get("properties"), dict):
            result["properties"] = {k: schema_type(v) for k, v in schema["properties"].items()}
        if "enum" in schema:
            result["enum"] = schema["enum"]
        return result
    return {"type": "object"}


def operation_tool_name(operation_id):
    snake = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", operation_id)
    snake = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", snake)
    return "clickup_" + re.sub(r"[^a-zA-Z0-9]+", "_", snake).strip("_").lower()


def load_openapi_tools():
    """Expose one explicit MCP tool for every operation in ClickUp's official spec."""
    try:
        request = urllib.request.Request(OPENAPI_URL, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=30) as response:
            spec = json.loads(response.read().decode("utf-8"))
    except Exception:
        return []
    tools = []
    used = set()
    for route, path_item in spec.get("paths", {}).items():
        for method, operation in path_item.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete"} or not isinstance(operation, dict):
                continue
            operation_id = operation.get("operationId") or f"{method}_{route}"
            name = operation_tool_name(operation_id)
            if name in used:
                name += "_" + method.lower()
            used.add(name)
            properties = {}
            required = []
            for parameter in operation.get("parameters", []):
                pname = parameter.get("name")
                if not pname:
                    continue
                if parameter.get("in") == "path":
                    properties[pname] = schema_type(parameter.get("schema"))
                    properties[pname]["description"] = parameter.get("description", "")
                    if parameter.get("required"):
                        required.append(pname)
            properties["query"] = {"type": "object", "description": "Query parameters for this ClickUp API operation."}
            request_body = operation.get("requestBody", {})
            if request_body:
                properties["body"] = {"type": "object", "description": request_body.get("description", "Request body. Use the schema shown in ClickUp's API documentation.")}
                if request_body.get("required"):
                    required.append("body")
            tools.append({"name": name, "description": operation.get("summary", operation_id) + ". " + operation.get("description", "").split("\n")[0], "inputSchema": {"type": "object", "properties": properties, "required": required}})
    return tools


def dynamic_operations():
    """Return the operation map from the same official spec used to build tools."""
    request = urllib.request.Request(OPENAPI_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        spec = json.loads(response.read().decode("utf-8"))
    operations = {}
    for route, path_item in spec.get("paths", {}).items():
        for method, operation in path_item.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete"} or not isinstance(operation, dict):
                continue
            operation_id = operation.get("operationId") or f"{method}_{route}"
            name = operation_tool_name(operation_id)
            operations.setdefault(name, (method.upper(), route, operation))
    return operations


CORE_NAMES = {tool["name"] for tool in CORE_TOOLS}
TOOLS = CORE_TOOLS + [tool for tool in load_openapi_tools() if tool["name"] not in CORE_NAMES]
OPENAPI_OPERATIONS = None


def call_tool(name, args):
    if name == "clickup_request":
        return api_call(args["method"], args["path"], args.get("query"), args.get("body"))
    if name == "clickup_get_workspace_hierarchy":
        return hierarchy(args.get("workspace_id"))
    if name == "clickup_create_space":
        return api_call("POST", f"/team/{workspace_id(args.get('workspace_id'))}/space", body={"name": args["name"], "private": args.get("private", False)})
    if name == "clickup_create_folder":
        return api_call("POST", f"/space/{args['space_id']}/folder", body={"name": args["name"]})
    if name == "clickup_create_list":
        parent = args.get("folder_id") or args.get("space_id")
        route = "folder" if args.get("folder_id") else "space"
        return api_call("POST", f"/{route}/{parent}/list", body={"name": args["name"]})
    if name == "clickup_create_task":
        body = {k: v for k, v in args.items() if k != "list_id" and v is not None}
        return api_call("POST", f"/list/{args['list_id']}/task", body=body)
    if name == "clickup_update_task":
        return api_call("PUT", f"/task/{args['task_id']}", body=args["fields"])
    if name == "clickup_delete":
        return api_call("DELETE", f"/{args['resource_type']}/{args['resource_id']}")
    global OPENAPI_OPERATIONS
    if OPENAPI_OPERATIONS is None:
        OPENAPI_OPERATIONS = dynamic_operations()
    if name in OPENAPI_OPERATIONS:
        method, route, _operation = OPENAPI_OPERATIONS[name]
        for key, value in args.items():
            if key not in {"query", "body"}:
                route = route.replace("{" + key + "}", urllib.parse.quote(str(value), safe=""))
        return api_call(method, route, args.get("query"), args.get("body"))
    raise RuntimeError(f"Unknown tool: {name}")


def reply(request_id, result=None, error=None):
    message = {"jsonrpc": "2.0", "id": request_id}
    message["error" if error else "result"] = error or result
    sys.stdout.write(json.dumps(message) + "\n")
    sys.stdout.flush()


def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        req = json.loads(line)
        method, params, request_id = req.get("method"), req.get("params", {}), req.get("id")
        if method == "initialize":
            reply(request_id, {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}}, "serverInfo": {"name": "clickup_community", "version": SERVER_VERSION}})
        elif method == "tools/list":
            reply(request_id, {"tools": TOOLS})
        elif method == "tools/call":
            try:
                value = call_tool(params["name"], params.get("arguments", {}))
                reply(request_id, {"content": [{"type": "text", "text": json.dumps(value, ensure_ascii=False)}], "structuredContent": value})
            except Exception as exc:
                reply(request_id, {"content": [{"type": "text", "text": str(exc)}], "isError": True})
        elif request_id is not None:
            reply(request_id, {})


if __name__ == "__main__":
    main()
