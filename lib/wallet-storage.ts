import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Buffer } from 'buffer';

class WalletStorage {
  private static STORAGE_KEY = 'encrypted_wallet_data';

  // In production, use a proper encryption library like crypto-js or Web Crypto API
  static async encryptData(data: string, password: string): Promise<string> {
    // This is a simplified example
    // In production, use Web Crypto API or crypto-js with AES-256-GCM
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );

    const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedData), salt.length + iv.length);

    return bs58.encode(result);
  }

  static async decryptData(encryptedData: string, password: string): Promise<string> {
    const data = bs58.decode(encryptedData);
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  static async saveEncryptedSeed(seed: string, password: string): Promise<void> {
    const encrypted = await this.encryptData(seed, password);
    sessionStorage.setItem(this.STORAGE_KEY, encrypted);
  }

  static async loadDecryptedSeed(password: string): Promise<string | null> {
    const encrypted = sessionStorage.getItem(this.STORAGE_KEY);
    if (!encrypted) return null;
    
    try {
      return await this.decryptData(encrypted, password);
    } catch (error) {
      throw new Error('Invalid password');
    }
  }

  static clearStorage(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  static hasStoredWallet(): boolean {
    return sessionStorage.getItem(this.STORAGE_KEY) !== null;
  }
}

export default WalletStorage;

export async function getKeypairFromMnemonic(
  mnemonic: string,
  accountIndex: number = 0
): Promise<Keypair> {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const seedBuffer = Buffer.from(seed).toString('hex');
  const solanaDerivationPath = `m/44'/501'/${accountIndex}'/0'`;
  const derivedSeed = derivePath(solanaDerivationPath, seedBuffer).key;
  return Keypair.fromSeed(derivedSeed);
}