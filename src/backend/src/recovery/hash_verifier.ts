import crypto from "crypto";
import fs from "fs";

export class HashVerifier {
  /**
   * Calculate cryptographic hashes for a given file.
   */
  static calculateFileHashes(filePath: string, algorithms: string[] = ["md5", "sha1", "sha256"]): Record<string, string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const hashObjects: Record<string, crypto.Hash> = {};
    for (const algo of algorithms) {
      const algoLower = algo.toLowerCase();
      if (["md5", "sha1", "sha256"].includes(algoLower)) {
        hashObjects[algoLower] = crypto.createHash(algoLower);
      } else {
        throw new Error(`Unsupported hashing algorithm: ${algo}`);
      }
    }

    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(65536);
    let bytesRead = 0;
    let position = 0;

    while (true) {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, position);
      if (bytesRead === 0) {
        break;
      }
      position += bytesRead;
      const dataChunk = buffer.subarray(0, bytesRead);
      for (const obj of Object.values(hashObjects)) {
        obj.update(dataChunk);
      }
    }
    fs.closeSync(fd);

    const results: Record<string, string> = {};
    for (const [algo, obj] of Object.entries(hashObjects)) {
      results[algo] = obj.digest("hex");
    }
    return results;
  }

  /**
   * Calculate cryptographic hashes for a byte buffer.
   */
  static calculateBytesHashes(data: Buffer | string, algorithms: string[] = ["md5", "sha1", "sha256"]): Record<string, string> {
    const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : data;
    const results: Record<string, string> = {};

    for (const algo of algorithms) {
      const algoLower = algo.toLowerCase();
      if (["md5", "sha1", "sha256"].includes(algoLower)) {
        results[algoLower] = crypto.createHash(algoLower).update(buffer).digest("hex");
      } else {
        throw new Error(`Unsupported hashing algorithm: ${algo}`);
      }
    }
    return results;
  }

  /**
   * Verify if the hash of a file matches the expected hash.
   */
  static verifyIntegrity(filePath: string, expectedHash: string, algorithm = "sha256"): boolean {
    try {
      const hashes = this.calculateFileHashes(filePath, [algorithm]);
      const calculated = hashes[algorithm.toLowerCase()];
      return calculated.toLowerCase() === expectedHash.toLowerCase();
    } catch (e) {
      return false;
    }
  }
}
