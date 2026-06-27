import { authenticator } from "otplib";
import QRCode from "qrcode";
import { siteConfig } from "@/config/site";

// Allow one 30s step of clock drift either way.
authenticator.options = { window: 1 };

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(accountName: string, secret: string): string {
  return authenticator.keyuri(accountName, siteConfig.name, secret);
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

export function totpQrDataUrl(keyUri: string): Promise<string> {
  return QRCode.toDataURL(keyUri);
}
