import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

function getUploadDir() {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(getUploadDir(), { recursive: true });
}

/**
 * Saves a buffer to disk under a randomized filename (so two uploads of
 * "invoice.pdf" never collide) and returns that stored filename — this is
 * what gets saved as `storage_path` in file_attachments. The *original*
 * file name is kept separately in the DB row for display/download.
 */
export async function saveFile(originalFileName: string, buffer: Buffer): Promise<string> {
  await ensureUploadDir();
  const safeSuffix = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeSuffix}`;
  await fs.writeFile(path.join(getUploadDir(), storedName), buffer);
  return storedName;
}

export async function readFile(storedName: string): Promise<Buffer> {
  return fs.readFile(path.join(getUploadDir(), storedName));
}

export async function deleteFile(storedName: string): Promise<void> {
  try {
    await fs.unlink(path.join(getUploadDir(), storedName));
  } catch (err) {
    // Missing file shouldn't block deleting the DB row that pointed to it.
    console.error(`Couldn't remove uploaded file ${storedName}:`, err);
  }
}