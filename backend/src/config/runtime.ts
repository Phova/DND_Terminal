import path from 'path';
import fs from 'fs';

// Runtime configuration — uses environment variables with defaults.
// In development the data directory is relative to the workspace root.

const WORKSPACE_ROOT = path.resolve(__dirname, '../..');

export function getDataDir(): string {
  return process.env.DRAGONTAIL_DATA_DIR || path.join(WORKSPACE_ROOT, 'data');
}

export function getDatabasePath(): string {
  return path.join(getDataDir(), 'dragontail.db');
}
