# MongoDB Migration Guide

Transfer all MongoDB collections from one system to another when merging the `merge` branch into `main`.

> **Safe by design:** This script is **additive only**. It will never drop, overwrite, or modify existing documents in the target database. Only new documents are inserted; duplicates (matching `_id`) are skipped. Any critical configurations already present in the recipient MongoDB are fully preserved.

---

## Prerequisites

- **Node.js** and **npm/pnpm** installed on both source and target systems
- **MongoDB** running on both systems (default: `localhost:27017`)
- Backend dependencies installed (`pnpm install` in the `backend/` directory)

---

## Collections

| Collection         | Model            | Description                  |
|--------------------|------------------|------------------------------|
| analysisresults    | AnalysisResult   | CSV/data analysis outputs    |
| deliverylogs       | DeliveryLog      | Email delivery tracking      |
| discoveredemails   | DiscoveredEmail  | Scraped email addresses      |
| recipientgroups    | RecipientGroup   | Recipient group definitions  |
| scheduledjobs      | ScheduledJob     | Scheduled workflow jobs      |

---

## Step-by-Step Migration

### Step 1 — Export Data (Source System)

```bash
cd ai-workflow-automation/backend
npx ts-node scripts/migrate-mongodb.ts export
```

This creates a `mongo-exports/` folder containing one JSON file per collection:

```
backend/
  mongo-exports/
    analysisresults.json
    deliverylogs.json
    discoveredemails.json
    recipientgroups.json
    scheduledjobs.json
```

> **Custom directory:** `npx ts-node scripts/migrate-mongodb.ts export --dir ./my-backup`

### Step 2 — Copy Export Files

Copy the entire `mongo-exports/` folder to the target system. Place it inside:

```
ai-workflow-automation/backend/mongo-exports/
```

You can transfer via USB, cloud storage, Git (not recommended for large data), or any file-sharing method.

### Step 3 — Merge the Branch

On the target system, merge the `merge` branch into `main`:

```bash
git checkout main
git pull origin main
git merge origin/merge
```

Resolve any merge conflicts if they arise, then:

```bash
git add .
git commit -m "Merged merge branch into main"
```

### Step 4 — Install Dependencies

```bash
cd ai-workflow-automation
pnpm install
```

### Step 5 — Import Data (Target System)

```bash
cd backend
npx ts-node scripts/migrate-mongodb.ts import
```

This reads the JSON files from `mongo-exports/` and **adds only new documents** into the target MongoDB. Documents that already exist (same `_id`) are silently skipped.

The script will show:
- Which collections already exist in the target DB and how many documents they have
- How many new documents were added per collection
- How many duplicates were skipped

> **Custom directory:** `npx ts-node scripts/migrate-mongodb.ts import --dir ./my-backup`

### Step 6 — Verify

Open MongoDB Compass on the target system and confirm:

1. Connect to `mongodb://localhost:27017`
2. Open the `workflow-automation` database
3. Check that all 5 collections exist and contain the expected documents

---

## Command Reference

| Command | Description |
|---------|-------------|
| `npx ts-node scripts/migrate-mongodb.ts export` | Export all collections to `mongo-exports/` |
| `npx ts-node scripts/migrate-mongodb.ts import` | Add new documents from `mongo-exports/` (existing data untouched) |
| `npx ts-node scripts/migrate-mongodb.ts export --dir <path>` | Export to a custom directory |
| `npx ts-node scripts/migrate-mongodb.ts import --dir <path>` | Import from a custom directory |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module 'mongoose'` | Run `pnpm install` in the `backend/` directory |
| `ECONNREFUSED` on connect | Ensure MongoDB is running on the target system |
| Duplicate key errors during import | Expected and safe — documents with the same `_id` already exist in the target DB and are skipped. No data is lost |
| `Import directory not found` | Ensure `mongo-exports/` is placed inside `backend/` |
