// Storage provider abstraction, implemented against Supabase Storage
// (S3-compatible). Defining the contract behind an interface keeps every module
// depending on a stable surface, so swapping to Cloudflare R2 / MinIO later is a
// one-file change.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface StorageProvider {
  /** Upload bytes under `key`, returning the stored object key. */
  upload(
    key: string,
    data: ArrayBuffer | Uint8Array,
    contentType: string,
  ): Promise<string>;
  /** A (possibly signed) URL the client can use to fetch the object. */
  getUrl(key: string): Promise<string>;
  /** Remove the object at `key`. */
  remove(key: string): Promise<void>;
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "files";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

let cached: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Storage не настроен: задайте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env",
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

class SupabaseStorage implements StorageProvider {
  async upload(
    key: string,
    data: ArrayBuffer | Uint8Array,
    contentType: string,
  ): Promise<string> {
    const { error } = await client()
      .storage.from(BUCKET)
      .upload(key, data, { contentType, upsert: true });
    if (error) throw new Error(`Загрузка не удалась: ${error.message}`);
    return key;
  }

  async getUrl(key: string): Promise<string> {
    const { data, error } = await client()
      .storage.from(BUCKET)
      .createSignedUrl(key, SIGNED_URL_TTL);
    if (error || !data) {
      throw new Error(`Не удалось получить ссылку: ${error?.message ?? "unknown"}`);
    }
    return data.signedUrl;
  }

  async remove(key: string): Promise<void> {
    const { error } = await client().storage.from(BUCKET).remove([key]);
    if (error) throw new Error(`Удаление не удалось: ${error.message}`);
  }
}

export function getStorage(): StorageProvider {
  return new SupabaseStorage();
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
