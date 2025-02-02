import * as crypto from "crypto";

/**
 * Encrypts data using a public key.
 * @param publicKey - The public key in hex format.
 * @param data - The data to encrypt as a Uint8Array.
 * @returns Encrypted data as Uint8Array.
 */
export function encryptWithPublicKey(publicKey: string, data: Uint8Array): Uint8Array {
  const keyBuffer = Buffer.from(publicKey, "hex");
  const encrypted = crypto.publicEncrypt(
    {
      key: keyBuffer,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(data)
  );
  return new Uint8Array(encrypted);
}
