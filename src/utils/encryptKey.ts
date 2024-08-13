import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16); // Initialization vector

// Encrypts a given encryption key
export async function generateEncryptedEncryptionKey(key: CryptoKey, encryptionKey: Uint8Array): Promise<{ iv: Uint8Array, encryptedKey: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector

    const encryptedKey = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key, // AES key
        encryptionKey // Data to encrypt
    );

    return {
        iv: iv,
        encryptedKey: new Uint8Array(encryptedKey)
    };
}

// Decrypts the encrypted encryption key
export async function decryptEncryptedEncryptionKey(key: CryptoKey, iv: Uint8Array, encryptedKey: Uint8Array): Promise<Uint8Array> {
    const decryptedKey = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key, // AES key
        encryptedKey // Data to decrypt
    );

    return new Uint8Array(decryptedKey);
}

export async function generateAESKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256, // Can be 128, 192, or 256
      },
      true, // Extractable
      ["encrypt", "decrypt"]
    );
  }