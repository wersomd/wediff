// Storage provider abstraction.
//
// The Files module (Phase 6) will implement this against Supabase Storage
// (S3-compatible). Defining the contract now lets every module depend on a
// stable interface, so swapping to Cloudflare R2 / MinIO later is a one-file
// change.

export interface StorageProvider {
  /** Upload bytes under `key`, returning the stored object key. */
  upload(key: string, data: ArrayBuffer | Uint8Array, contentType: string): Promise<string>;
  /** A (possibly signed) URL the client can use to fetch the object. */
  getUrl(key: string): Promise<string>;
  /** Remove the object at `key`. */
  remove(key: string): Promise<void>;
}

// Implemented in Phase 6.
export function getStorage(): StorageProvider {
  throw new Error("Storage provider not configured yet (wired up in Phase 6).");
}
