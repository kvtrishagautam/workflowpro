# Slack Multi-Node Example

This guide shows exactly which nodes to add in the Editor, how to configure them, how to wire them, and how to test the workflow using curl.

## Goal
Send an initial Slack notification when a webhook is received, evaluate the payload with an IF node, then send either a success Slack message or a failure Slack message.

## Prerequisites
- Backend running at `http://localhost:4000` (restart after code changes).
- If you want real Slack messages, set `SLACK_BOT_TOKEN` in `backend/.env` and restart the backend.

## Nodes to Add (order not important)
- `Webhook` (type: `webhook`) — trigger
- `Slack` (type: `slack`) — initial notification
- `Conditional` (type: `conditional`) — evaluate payload
- `Slack` (type: `slack`) — success branch
- `Slack` (type: `slack`) — failure branch

## Node configurations (copy/paste into each node's config UI)

1) Webhook node
- `path`: `/slack-test`
- `method` / `httpMethod`: `POST`
- `authentication`: `none`
- `responseMode`: `immediately`
- Example POST payload you will send when testing:
```json
{
  "user": "alice",
  "status": "ok",
  "amount": 100,
  "message": "hello"
}
```

2) Slack — `Slack (Initial)`
- `Operation`: Send Message
- `Channel`: `#general` (or channel ID)
- `Message` (use double-curly template placeholders):
```
New run from {{user}} — status={{status}} — amount={{amount}} — message={{message}}
```
- (Optional) `Username`: `Workflow Bot`
- (Optional) `Icon Emoji`: `:robot_face:`

3) Conditional / IF node
- `Condition Type`: `Simple`
- `Field`: `status`  (dot-path into payload)
- `Operator`: `equals`
- `Value`: `ok`

Behavior: when incoming payload's `status` equals `ok`, condition evaluates to `true`.

4) Slack — `Slack (Success)`
- `Operation`: Send Message
- `Channel`: `#general`
- `Message`:
```
✅ Success: {{user}} — status={{status}} — amount={{amount}}
```

5) Slack — `Slack (Failure)`
- `Operation`: Send Message
- `Channel`: `#alerts` (or any channel)
- `Message`:
```
❌ Failure: {{user}} — status={{status}} — check logs
```

## Wiring (edges)
- `Webhook` -> `Slack (Initial)`
- `Slack (Initial)` -> `Conditional`
- `Conditional` true -> `Slack (Success)` (edge `sourceHandle` = `true`)
- `Conditional` false -> `Slack (Failure)` (edge `sourceHandle` = `false`)

Note: The Editor shows true/false handles on the conditional node—connect accordingly.

## Save and Test
1. Save the workflow in the Editor.
2. Restart backend (if you changed `.env`) and ensure it logs `Webhook Backend Server Started`.

Restart commands (from repo root):
```bash
cd backend
pnpm install
pnpm dev
```

3. Trigger via curl (replace path if you used a different webhook `path`):
```bash
curl -X POST http://localhost:4000/webhook/slack-test \
  -H "Content-Type: application/json" \
  -d '{"user":"alice","status":"ok","amount":100,"message":"hello"}'
```

4. Verify
- If backend is configured with `SLACK_BOT_TOKEN`, check the Slack channel for messages.
- Open the Editor's Run History to inspect node logs and confirm the conditional evaluated correctly.

## Troubleshooting
- If saving fails with an ObjectId / `_id` cast error: restart backend after pulling the latest changes, and ensure the backend logs show `Workflow saved successfully` when saving.
- If Slack messages don't appear: verify `SLACK_BOT_TOKEN` in `backend/.env` and that the bot has permission to post to the configured channel.
- If conditional doesn't route: ensure the Conditional node has edges with `sourceHandle` set to `true` and `false`.

## Example workflow JSON (for advanced use)
You can create the workflow via the backend script or API using a JSON payload similar to the example in `backend/scripts/create_example_workflow.js`.

---

If you want, I can also add a ready-to-post workflow JSON snippet (with nodes and edges) you can POST to `http://localhost:4000/workflows` to create the workflow automatically. Do you want that?