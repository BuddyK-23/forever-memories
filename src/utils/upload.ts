import crypto, { createHash, createDecipheriv } from "crypto";

export async function generateEncryptionKey(
  encryptionKey: string
): Promise<Uint8Array> {
  const hash = createHash("sha256");
  hash.update(encryptionKey);
  return hash.digest();
}

export async function encryptFile(
  file: File,
  encryptionKey: Uint8Array
): Promise<Uint8Array> {
  // Convert file to ArrayBuffer directly
  const fileBuffer = await file.arrayBuffer();

  // Generate a random initialization vector (IV)
  const iv = crypto.getRandomValues(new Uint8Array(16));

  // Import encryption key
  const key = await crypto.subtle.importKey(
    "raw",
    encryptionKey,
    "AES-CBC",
    false,
    ["encrypt"]
  );

  // Encrypt the file content directly
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    fileBuffer
  );

  // Concatenate IV with encrypted data
  return new Uint8Array([...iv, ...new Uint8Array(encryptedData)]);
}

export async function decryptFile(
  encryptedData: Uint8Array,
  encryptionKey: Uint8Array
): Promise<Buffer> {
  // Extract IV (Initialization Vector) from the encrypted data
  const iv = encryptedData.slice(0, 16);

  // Extract encrypted content (excluding IV)
  const encryptedContent = encryptedData.slice(16);

  // Create a Decipheriv object using AES-CBC algorithm
  const decipher = createDecipheriv("aes-256-cbc", encryptionKey, iv);

  // Perform decryption
  let decryptedData = decipher.update(encryptedContent);
  decryptedData = Buffer.concat([decryptedData, decipher.final()]);

  // Return decrypted data as a Buffer
  return decryptedData;
}
