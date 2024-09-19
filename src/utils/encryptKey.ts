import crypto from "crypto";

// Constants for AES-GCM encryption/decryption
const algorithm = "aes-256-gcm"; // AES-GCM for authenticated encryption
const keyLength = 32; // AES-256 needs a 32-byte key
const ivLength = 12; // 12 bytes for GCM IV
const authTagLength = 16; // Authentication tag size is 16 bytes for GCM

// Function to generate a random AES key (32 bytes for AES-256)
export function generateAESKey(): Buffer {
  return crypto.randomBytes(keyLength); // Generates a 256-bit key (32 bytes)
}

// Encrypt function using AES-GCM and concatenate AES Key, IV, AuthTag, and EncryptedKey
export async function generateEncryptedEncryptionKey(
  encryptionKey: Uint8Array // The data to encrypt (Uint8Array)
): Promise<Uint8Array> {
  try {
    // Generate AES key and IV
    const aesKey = generateAESKey();
    const iv = crypto.randomBytes(ivLength);

    // Create AES-GCM cipher
    const cipher = crypto.createCipheriv(algorithm, aesKey, iv);

    // Encrypt the encryptionKey (data)
    const encryptedKey = Buffer.concat([
      cipher.update(Buffer.from(encryptionKey)),
      cipher.final(),
    ]);

    // Get authentication tag for AES-GCM
    const authTag = cipher.getAuthTag();

    // Combine AES Key, IV, AuthTag, and EncryptedKey into one Uint8Array
    const combined = Buffer.concat([aesKey, iv, authTag, encryptedKey]);

    return new Uint8Array(combined); // Return combined array
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }
}

// Decrypt function by splitting AES Key, IV, AuthTag, and EncryptedKey
export async function decryptEncryptedEncryptionKey(
  combinedData: Uint8Array // Combined AES Key, IV, AuthTag, and EncryptedKey
): Promise<Buffer> {
  try {
    const combinedBuffer = Buffer.from(combinedData);

    // Extract AES Key, IV, AuthTag, and EncryptedKey from the combined data
    const aesKey = combinedBuffer.slice(0, keyLength); // First 32 bytes for AES Key
    const iv = combinedBuffer.slice(keyLength, keyLength + ivLength); // Next 12 bytes for IV
    const authTag = combinedBuffer.slice(keyLength + ivLength, keyLength + ivLength + authTagLength); // Next 16 bytes for AuthTag
    const encryptedKey = combinedBuffer.slice(keyLength + ivLength + authTagLength); // The rest is the encrypted data

    // Create AES-GCM decipher
    const decipher = crypto.createDecipheriv(algorithm, aesKey, iv);

    // Set the authentication tag
    decipher.setAuthTag(authTag);

    // Decrypt the encrypted data
    const decryptedKey = Buffer.concat([
      decipher.update(encryptedKey),
      decipher.final(),
    ]);

    return decryptedKey; // Return decrypted data as Buffer
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw error;
  }
}