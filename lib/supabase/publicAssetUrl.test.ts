import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { toAppDomainStorageUrl } from "./publicAssetUrl";

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("toAppDomainStorageUrl", () => {
  it("rewrites a raw Supabase storage URL onto NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://walletos.online";
    const raw =
      "https://abcxyz.supabase.co/storage/v1/object/public/card-backgrounds/user-1/123.png";
    expect(toAppDomainStorageUrl(raw)).toBe(
      "https://walletos.online/storage/v1/object/public/card-backgrounds/user-1/123.png"
    );
  });

  it("falls back to localhost when NEXT_PUBLIC_APP_URL is unset (dev default)", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const raw = "https://abcxyz.supabase.co/storage/v1/object/public/card-backgrounds/x.png";
    expect(toAppDomainStorageUrl(raw)).toBe(
      "http://localhost:3000/storage/v1/object/public/card-backgrounds/x.png"
    );
  });

  it("leaves an unrecognized URL shape untouched instead of mangling it", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://walletos.online";
    const weird = "https://example.com/not-a-storage-path/logo.png";
    expect(toAppDomainStorageUrl(weird)).toBe(weird);
  });
});
