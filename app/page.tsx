"use client";
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Buffer } from 'buffer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Copy, Wallet, Download, Upload } from 'lucide-react';
import bs58 from 'bs58';

const generateSolanaMnemonic = () => {
  const mnemonic = bip39.generateMnemonic(128);
  return mnemonic;
};

const getKeypairFromMnemonic = async (mnemonic: string, accountIndex: number = 0) => {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const seedBuffer = Buffer.from(seed).toString('hex');
  const solanaDerivationPath = `m/44'/501'/${accountIndex}'/0'`;
  const derivedSeed = derivePath(solanaDerivationPath, seedBuffer).key;
  const keypair = Keypair.fromSeed(derivedSeed);

  return keypair;
};

export default function Home() {
  const [keypairs, setKeypairs] = useState<Keypair[]>([]);
  const [seed, setSeed] = useState<string>('');
  const [hasNotedSeed, setHasNotedSeed] = useState<boolean>(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: number]: boolean }>({});
  const [importSeed, setImportSeed] = useState<string>('');
  const [showImport, setShowImport] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const togglePrivateKey = (index: number) => {
    setShowPrivateKeys(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const resetWallet = () => {
    setSeed('');
    setKeypairs([]);
    setHasNotedSeed(false);
    setShowPrivateKeys({});
    setImportSeed('');
    setShowImport(false);
  };

  const handleGenerateSeed = async () => {
    const mnemonic = generateSolanaMnemonic();
    setSeed(mnemonic);
  };

  const handleImportSeed = async () => {
    if (!bip39.validateMnemonic(importSeed.trim())) {
      alert('Invalid seed phrase. Please check and try again.');
      return;
    }
    setSeed(importSeed.trim());
    setHasNotedSeed(true);
    const firstKeypair = await getKeypairFromMnemonic(importSeed.trim(), 0);
    setKeypairs([firstKeypair]);
  };

  const handleConfirmSeed = async () => {
    setHasNotedSeed(true);
    const firstKeypair = await getKeypairFromMnemonic(seed, 0);
    setKeypairs([firstKeypair]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Solana Wallet Generator</h1>
          <p className="text-gray-600">Generate secure Solana wallets from a single seed phrase</p>
        </div>

        {!seed && !showImport && (
          <div className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Create New Wallet
                </CardTitle>
                <CardDescription>Generate a new seed phrase to create your wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGenerateSeed}
                  className="w-full"
                  size="lg"
                >
                  Generate Seed Phrase
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Existing Wallet
                </CardTitle>
                <CardDescription>Import your existing seed phrase to recover wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowImport(true)}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  Import Seed Phrase
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {!seed && showImport && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Import Seed Phrase</CardTitle>
              <CardDescription>
                Enter your 12-word seed phrase to import your wallets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter your 12-word seed phrase separated by spaces"
                  value={importSeed}
                  onChange={(e) => setImportSeed(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleImportSeed}
                  className="flex-1"
                  disabled={!importSeed.trim()}
                >
                  Import Wallet
                </Button>
                <Button
                  onClick={() => {
                    setShowImport(false);
                    setImportSeed('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {seed && !hasNotedSeed && (
          <Card className="shadow-lg border-2 border-yellow-400">
            <CardHeader>
              <CardTitle className="text-red-600">⚠️ Save Your Seed Phrase</CardTitle>
              <CardDescription>
                Write down these words in order and store them safely. You'll need them to recover your wallets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-400">
                <AlertDescription className="font-semibold">
                  Never share your seed phrase with anyone. Anyone with access to it can control your wallets!
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-2">
                  {seed.split(' ').map((word, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      <span className="text-gray-500 text-xs mr-2">{index + 1}.</span>
                      <span className="font-mono font-semibold">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(seed)}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Seed Phrase
                </Button>
                <Button
                  onClick={handleConfirmSeed}
                  className="flex-1"
                >
                  I Have Saved It Securely
                </Button>
              </div>

              <Button
                onClick={resetWallet}
                variant="ghost"
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {seed && hasNotedSeed && (
          <>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Add Wallet
                </CardTitle>
                <CardDescription>Generate new wallets from your seed phrase</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={async () => {
                    const keypair = await getKeypairFromMnemonic(seed, keypairs.length);
                    setKeypairs([...keypairs, keypair]);
                  }}
                  className="w-full"
                  size="lg"
                >
                  + Add Wallet
                </Button>
              </CardContent>
            </Card>

            {keypairs.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Your Wallets</h2>
                  <Button onClick={resetWallet} variant="destructive" size="sm">
                    Reset All
                  </Button>
                </div>
                
                {keypairs.map((kp, index) => (
                  <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Wallet {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Public Key</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-gray-100 p-2 rounded text-sm break-all">
                            {kp.publicKey.toBase58()}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(kp.publicKey.toBase58())}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-600">Private Key</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-gray-100 p-2 rounded text-sm break-all">
                            {showPrivateKeys[index] 
                              ? bs58.encode(kp.secretKey)
                              : '••••••••••••••••••••••••••'}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePrivateKey(index)}
                          >
                            {showPrivateKeys[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {showPrivateKeys[index] && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(bs58.encode(kp.secretKey))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
