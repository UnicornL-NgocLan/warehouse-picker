import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM

const getKey = () => {
  const secret = process.env.CRYPTO_KEY || "default_secret_key_needs_override";
  return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
};

export const encrypt = (text) => {
  if (!text) return "";
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(text, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    ciphertext,
  });
};

export function decrypt(encryptedData) {
  if (!encryptedData) return "";

  // Attempt to parse AES-GCM JSON structure
  try {
    if (typeof encryptedData === "string" && encryptedData.trim().startsWith("{")) {
      const parsed = JSON.parse(encryptedData);
      if (parsed.iv && parsed.authTag && parsed.ciphertext) {
        const key = getKey();
        const iv = Buffer.from(parsed.iv, "hex");
        const authTag = Buffer.from(parsed.authTag, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(parsed.ciphertext, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
      }
    }
  } catch (err) {
    // If GCM decryption fails, proceed to check legacy fallback
  }

  // Fallback to legacy AES-256-CBC if old format is present
  try {
    const secretKey = crypto.createHash("sha256").update(process.env.CRYPTO_KEY || "").digest().slice(0, 32);
    const iv = crypto.createHash("sha256").update(process.env.IV || "").digest().slice(0, 16);
    const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    throw new Error("Không thể giải mã thông tin xác thực");
  }
}
