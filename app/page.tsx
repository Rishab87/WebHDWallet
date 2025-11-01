"use client";
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Copy, Wallet, Download, Upload, Lock, Unlock } from 'lucide-react';
import bs58 from 'bs58';
import WalletStorage, { getKeypairFromMnemonic } from '@/lib/wallet-storage';

const generateSolanaMnemonic = () => {
  return bip39.generateMnemonic(128);
};

export default function Home() {
  const [keypairs, setKeypairs] = useState<Keypair[]>([]);
  const [seed, setSeed] = useState<string>('');
  const [hasNotedSeed, setHasNotedSeed] = useState<boolean>(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: number]: boolean }>({});
  const [importSeed, setImportSeed] = useState<string>('');
  const [showImport, setShowImport] = useState<boolean>(false);
  
  // Password protection
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [hasStoredWallet, setHasStoredWallet] = useState<boolean>(false);

  useEffect(() => {
    setHasStoredWallet(WalletStorage.hasStoredWallet());
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const togglePrivateKey = (index: number) => {
    setShowPrivateKeys(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const lockWallet = () => {
    setSeed('');
    setKeypairs([]);
    setPassword('');
    setIsLocked(true);
    setShowPrivateKeys({});
  };

  const resetWallet = () => {
    WalletStorage.clearStorage();
    setSeed('');
    setKeypairs([]);
    setHasNotedSeed(false);
    setShowPrivateKeys({});
    setImportSeed('');
    setShowImport(false);
    setPassword('');
    setConfirmPassword('');
    setIsLocked(true);
    setHasStoredWallet(false);
  };

  const unlockWallet = async () => {
    try {
      const decryptedSeed = await WalletStorage.loadDecryptedSeed(password);
      if (decryptedSeed) {
        setSeed(decryptedSeed);
        setHasNotedSeed(true);
        setIsLocked(false);
        // Load first wallet
        const firstKeypair = await getKeypairFromMnemonic(decryptedSeed, 0);
        setKeypairs([firstKeypair]);
      }
    } catch (error) {
      alert('Invalid password');
    }
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
    if (password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSeed(importSeed.trim());
    setHasNotedSeed(true);
    setIsLocked(false);
    
    // Save encrypted seed
    await WalletStorage.saveEncryptedSeed(importSeed.trim(), password);
    setHasStoredWallet(true);
    
    const firstKeypair = await getKeypairFromMnemonic(importSeed.trim(), 0);
    setKeypairs([firstKeypair]);
  };

  const handleConfirmSeed = async () => {
    if (password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setHasNotedSeed(true);
    setIsLocked(false);
    
    // Save encrypted seed
    await WalletStorage.saveEncryptedSeed(seed, password);
    setHasStoredWallet(true);
    
    const firstKeypair = await getKeypairFromMnemonic(seed, 0);
    setKeypairs([firstKeypair]);
  };

  // Unlock screen for returning users
  if (hasStoredWallet && isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-md mx-auto space-y-6 mt-20">
          <div className="text-center mb-8">
            <Lock className="h-16 w-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Enter your password to unlock your wallet</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Unlock Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && unlockWallet()}
              />
              <Button onClick={unlockWallet} className="w-full" disabled={!password}>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock
              </Button>
              <Button onClick={resetWallet} variant="outline" className="w-full">
                Reset Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                Enter your 12-word seed phrase and set a password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your 12-word seed phrase separated by spaces"
                value={importSeed}
                onChange={(e) => setImportSeed(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Create a password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleImportSeed}
                  className="flex-1"
                  disabled={!importSeed.trim() || !password || !confirmPassword}
                >
                  Import Wallet
                </Button>
                <Button
                  onClick={() => {
                    setShowImport(false);
                    setImportSeed('');
                    setPassword('');
                    setConfirmPassword('');
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

              <Input
                type="password"
                placeholder="Create a password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

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
                  disabled={!password || !confirmPassword}
                >
                  I Have Saved It Securely
                </Button>
              </div>

              <Button onClick={resetWallet} variant="ghost" className="w-full">
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {seed && hasNotedSeed && !isLocked && (
          <>
            <div className="flex justify-end">
              <Button onClick={lockWallet} variant="outline" size="sm">
                <Lock className="mr-2 h-4 w-4" />
                Lock Wallet
              </Button>
            </div>

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
