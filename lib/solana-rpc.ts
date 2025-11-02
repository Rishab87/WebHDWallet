import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';

export const NETWORKS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
} as const;

export type NetworkType = keyof typeof NETWORKS;

export async function getBalance(
  publicKey: string,
  network: NetworkType = 'mainnet'
): Promise<number> {
  try {
    const connection = new Connection(NETWORKS[network], 'confirmed');
    const pubKey = new PublicKey(publicKey);
    const balance = await connection.getBalance(pubKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

export async function getAccountInfo(
  publicKey: string,
  network: NetworkType = 'mainnet'
) {
  try {
    const connection = new Connection(NETWORKS[network], 'confirmed');
    const pubKey = new PublicKey(publicKey);
    const accountInfo = await connection.getAccountInfo(pubKey);
    
    return {
      exists: accountInfo !== null,
      balance: accountInfo ? accountInfo.lamports / LAMPORTS_PER_SOL : 0,
      executable: accountInfo?.executable || false,
      owner: accountInfo?.owner.toBase58() || null,
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
}

export async function sendSol(
  fromKeypair: Keypair,
  toAddress: string,
  amount: number,
  network: NetworkType = 'mainnet'
): Promise<string> {
  try {
    const connection = new Connection(NETWORKS[network], 'confirmed');
    const toPubkey = new PublicKey(toAddress);
    
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    // Send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair]
    );

    return signature;
  } catch (error) {
    console.error('Error sending SOL:', error);
    throw error;
  }
}
