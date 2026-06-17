function base32ToBytes(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/=+$/, "");
  const length = cleaned.length;
  const bytes = new Uint8Array(Math.floor((length * 5) / 8));

  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error("Invalid character in Base32 string");
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return bytes;
}

async function hmacSha1(
  keyBytes: Uint8Array,
  messageBytes: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes as any,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"],
  );
  const signature = await window.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageBytes as any,
  );
  return new Uint8Array(signature);
}

export async function generateTOTP(
  secretBase32: string,
  timeOffsetSteps = 0,
  digits = 8,
  period = 30,
): Promise<string> {
  const keyBytes = base32ToBytes(secretBase32);

  // Calculate time step counter
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / period) + timeOffsetSteps;

  // Convert counter to 8-byte big-endian array
  const msgBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    msgBytes[i] = temp & 255;
    temp = Math.floor(temp / 256);
  }

  // Calculate HMAC-SHA1
  const hmacResult = await hmacSha1(keyBytes, msgBytes);

  // Dynamic Truncation
  const offset = hmacResult[hmacResult.length - 1] & 15;
  const binary =
    ((hmacResult[offset] & 127) << 24) |
    ((hmacResult[offset + 1] & 255) << 16) |
    ((hmacResult[offset + 2] & 255) << 8) |
    (hmacResult[offset + 3] & 255);

  const otpVal = binary % Math.pow(10, digits);
  let otpStr = otpVal.toString();
  while (otpStr.length < digits) {
    otpStr = "0" + otpStr;
  }

  return otpStr;
}

export async function verifyTOTP(
  secretBase32: string,
  code: string,
  digits = 8,
  period = 30,
): Promise<boolean> {
  // Allow a window of -1, 0, +1 time steps to handle clock drift
  for (let offset = -1; offset <= 1; offset++) {
    const expected = await generateTOTP(secretBase32, offset, digits, period);
    if (expected === code.trim()) {
      return true;
    }
  }
  return false;
}

export function generateBase32Secret(length = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % 32];
  }
  return result;
}
