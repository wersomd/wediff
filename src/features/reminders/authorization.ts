import { timingSafeEqual } from "node:crypto";
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
 if (!secret?.trim() || !header) return false;
 const expected = Buffer.from(`Bearer ${secret}`);
 const supplied = Buffer.from(header);
 return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
