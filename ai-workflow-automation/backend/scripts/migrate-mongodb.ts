/**
 * MongoDB Migration Script (Additive Only)
 * ==========================================
 * Export/Import collections from the workflow-automation database.
 * Use this to transfer data between systems (e.g., when merging branches).
 *
 * IMPORTANT: This script is ADDITIVE ONLY.
 *   - It will NEVER drop, overwrite, or modify existing documents.
 *   - New documents are inserted; documents with matching _id are skipped.
 *   - Existing configurations in the target DB are fully preserved.
 *
 * Usage:
 *   npx ts-node scripts/migrate-mongodb.ts export           # Export all collections to JSON files
 *   npx ts-node scripts/migrate-mongodb.ts import            # Import (add-only) from JSON files
 *   npx ts-node scripts/migrate-mongodb.ts export --dir ./my-backup  # Custom output directory
 *   npx ts-node scripts/migrate-mongodb.ts import --dir ./my-backup  # Import from custom directory
 *
 * The exported JSON files are portable — copy them with your project and
 * run the import command on the target system.
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-automation';
const DEFAULT_EXPORT_DIR = path.join(__dirname, '..', 'mongo-exports');

const COLLECTIONS = [
  'analysisresults',
  'deliverylogs',
  'discoveredemails',
  'recipientgroups',
  'scheduledjobs',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0]; // 'export' or 'import'

  let dir = DEFAULT_EXPORT_DIR;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      dir = path.resolve(args[i + 1]);
      i++;
    }
  }

  return { command, dir };
}

async function connectDB(): Promise<mongoose.Connection> {
  console.log(`\n🔗 Connecting to MongoDB: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected successfully.\n');
  return mongoose.connection;
}

// ─── Export ──────────────────────────────────────────────────────────────────
async function exportCollections(exportDir: string) {
  const conn = await connectDB();
  const db = conn.db!;

  // Create export directory
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log(`📦 Exporting collections to: ${exportDir}\n`);

  let totalDocs = 0;

  for (const collName of COLLECTIONS) {
    try {
      const collection = db.collection(collName);
      const docs = await collection.find({}).toArray();
      const filePath = path.join(exportDir, `${collName}.json`);

      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      console.log(`  ✅ ${collName}: ${docs.length} documents → ${collName}.json`);
      totalDocs += docs.length;
    } catch (err: any) {
      // Collection may not exist yet — that's fine
      if (err.codeName === 'NamespaceNotFound' || err.code === 26) {
        console.log(`  ⚠️  ${collName}: Collection not found (skipped)`);
      } else {
        console.error(`  ❌ ${collName}: Error — ${err.message}`);
      }
    }
  }

  // Also export any extra collections not in the predefined list
  const allCollections = await db.listCollections().toArray();
  const extraCollections = allCollections
    .map((c) => c.name)
    .filter((name) => !COLLECTIONS.includes(name) && !name.startsWith('system.'));

  if (extraCollections.length > 0) {
    console.log(`\n📋 Found ${extraCollections.length} additional collection(s):\n`);
    for (const collName of extraCollections) {
      try {
        const collection = db.collection(collName);
        const docs = await collection.find({}).toArray();
        const filePath = path.join(exportDir, `${collName}.json`);

        fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
        console.log(`  ✅ ${collName}: ${docs.length} documents → ${collName}.json`);
        totalDocs += docs.length;
      } catch (err: any) {
        console.error(`  ❌ ${collName}: Error — ${err.message}`);
      }
    }
  }

  console.log(`\n🎉 Export complete! ${totalDocs} total documents exported.`);
  console.log(`📁 Files saved to: ${exportDir}`);
  console.log(`\nTo import on another system:`);
  console.log(`  1. Copy the "${path.basename(exportDir)}/" folder to the target project`);
  console.log(`  2. Run: npx ts-node scripts/migrate-mongodb.ts import --dir ${path.basename(exportDir)}`);
}

// ─── Import (Additive Only) ──────────────────────────────────────────────────
async function importCollections(importDir: string) {
  const conn = await connectDB();
  const db = conn.db!;

  if (!fs.existsSync(importDir)) {
    console.error(`❌ Import directory not found: ${importDir}`);
    console.error(`   Make sure you've copied the export folder to this project.`);
    process.exit(1);
  }

  console.log(`📥 Importing collections from: ${importDir}`);
  console.log(`🛡️  ADDITIVE MODE: Existing data will NOT be modified or deleted.`);
  console.log(`   Only new documents will be added. Duplicates are skipped.\n`);

  // Show what already exists in the target DB
  const existingCollections = await db.listCollections().toArray();
  const existingNames = existingCollections.map((c) => c.name).filter((n) => !n.startsWith('system.'));
  if (existingNames.length > 0) {
    console.log(`📋 Existing collections in target DB: ${existingNames.join(', ')}`);
    for (const name of existingNames) {
      const count = await db.collection(name).countDocuments();
      console.log(`   • ${name}: ${count} existing documents (will be preserved)`);
    }
    console.log();
  }

  const jsonFiles = fs.readdirSync(importDir).filter((f) => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.error(`❌ No .json files found in ${importDir}`);
    process.exit(1);
  }

  let totalNew = 0;
  let totalSkipped = 0;

  for (const file of jsonFiles) {
    const collName = path.basename(file, '.json');
    const filePath = path.join(importDir, file);

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const docs = JSON.parse(raw);

      if (!Array.isArray(docs)) {
        console.warn(`  ⚠️  ${file}: Not a valid array, skipping.`);
        continue;
      }

      if (docs.length === 0) {
        console.log(`  ⏭️  ${collName}: 0 documents in file (skipped)`);
        continue;
      }

      const collection = db.collection(collName);
      const existingCount = await collection.countDocuments();

      // Convert _id strings back to ObjectId where applicable
      const processedDocs = docs.map((doc: any) => {
        if (doc._id && typeof doc._id === 'string' && /^[a-f\d]{24}$/i.test(doc._id)) {
          doc._id = new mongoose.Types.ObjectId(doc._id);
        } else if (doc._id && doc._id.$oid) {
          doc._id = new mongoose.Types.ObjectId(doc._id.$oid);
        }
        return doc;
      });

      // Use insertMany with ordered: false — duplicates are silently skipped
      try {
        const result = await collection.insertMany(processedDocs, { ordered: false });
        const newCount = result.insertedCount;
        const skipped = docs.length - newCount;
        console.log(
          `  ✅ ${collName}: ${newCount} new documents added` +
          (skipped > 0 ? `, ${skipped} skipped (already exist)` : '') +
          ` | ${existingCount} existing preserved`
        );
        totalNew += newCount;
        totalSkipped += skipped;
      } catch (bulkErr: any) {
        // BulkWriteError — some docs inserted, some are duplicates
        if (bulkErr.code === 11000 || bulkErr.name === 'MongoBulkWriteError') {
          const inserted = bulkErr.result?.insertedCount || 0;
          const skipped = docs.length - inserted;
          console.log(
            `  ✅ ${collName}: ${inserted} new documents added, ${skipped} skipped (already exist)` +
            ` | ${existingCount} existing preserved`
          );
          totalNew += inserted;
          totalSkipped += skipped;
        } else {
          throw bulkErr;
        }
      }
    } catch (err: any) {
      console.error(`  ❌ ${collName}: Error — ${err.message}`);
    }
  }

  console.log(`\n🎉 Import complete!`);
  console.log(`   ${totalNew} new documents added`);
  console.log(`   ${totalSkipped} duplicates skipped (existing data untouched)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const { command, dir } = parseArgs();

  if (!command || !['export', 'import'].includes(command)) {
    console.log(`
MongoDB Migration Script (Additive Only)
=========================================

Safely adds exported collections to a target MongoDB.
Existing data is NEVER dropped, overwritten, or modified.

Usage:
  npx ts-node scripts/migrate-mongodb.ts export [--dir <path>]
  npx ts-node scripts/migrate-mongodb.ts import [--dir <path>]

Commands:
  export   Export all collections to JSON files
  import   Add documents from JSON files into MongoDB (skip duplicates)

Options:
  --dir    Custom directory for export/import (default: mongo-exports/)

Collections: ${COLLECTIONS.join(', ')}
    `);
    process.exit(0);
  }

  try {
    if (command === 'export') {
      await exportCollections(dir);
    } else if (command === 'import') {
      await importCollections(dir);
    }
  } catch (err: any) {
    console.error(`\n❌ Fatal error: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
}

main();
