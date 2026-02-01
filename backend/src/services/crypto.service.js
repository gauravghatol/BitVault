/**
 * Crypto Service
 * Handles all cryptographic operations including:
 * - Bitcoin key pair generation
 * - Encryption/Decryption of private keys (for hot wallets)
 * - Signing and verification of transactions
 * - Hashing for integrity checks
 */

const crypto = require('crypto');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');

// Initialize ECPair with secp256k1
const ECPair = ECPairFactory(ecc);

class CryptoService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.authTagLength = 16;
  }

  /**
   * Get Bitcoin network configuration
   */
  getNetwork() {
    const networkType = process.env.BITCOIN_NETWORK || 'testnet';
    return networkType === 'mainnet' 
      ? bitcoin.networks.bitcoin 
      : bitcoin.networks.testnet;
  }

  /**
   * Generate a new Bitcoin key pair
   * Returns: { privateKey, publicKey, address, wif }
   */
  generateKeyPair() {
    try {
      const network = this.getNetwork();
      
      // Generate random key pair
      const keyPair = ECPair.makeRandom({ network });
      
      // Get the private key in different formats
      const privateKey = keyPair.privateKey.toString('hex');
      const wif = keyPair.toWIF(); // Wallet Import Format
      
      // Get public key
      const publicKey = keyPair.publicKey.toString('hex');
      
      // Generate P2PKH address (legacy Bitcoin address)
      const { address } = bitcoin.payments.p2pkh({ 
        pubkey: keyPair.publicKey, 
        network 
      });

      return {
        privateKey,
        privateKeyWIF: wif,
        publicKey,
        address,
        network: process.env.BITCOIN_NETWORK || 'testnet'
      };
    } catch (error) {
      throw new Error(`Key generation failed: ${error.message}`);
    }
  }

  /**
   * Derive key pair from existing private key
   */
  deriveKeyPair(privateKeyHex) {
    try {
      const network = this.getNetwork();
      const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { network });
      
      const publicKey = keyPair.publicKey.toString('hex');
      const { address } = bitcoin.payments.p2pkh({ 
        pubkey: keyPair.publicKey, 
        network 
      });

      return {
        publicKey,
        address,
        keyPair
      };
    } catch (error) {
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  /**
   * Validate if a private key corresponds to a public address
   */
  validateKeyPair(privateKeyHex, publicAddress) {
    try {
      const derived = this.deriveKeyPair(privateKeyHex);
      return derived.address === publicAddress;
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt private key for hot wallet storage
   * Uses AES-256-GCM for authenticated encryption
   */
  encryptPrivateKey(privateKey) {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
        authTagLength: this.authTagLength
      });
      
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt private key from hot wallet storage
   */
  decryptPrivateKey(encryptedData, ivHex, authTagHex) {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
        authTagLength: this.authTagLength
      });
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Get encryption key from environment (32 bytes for AES-256)
   */
  getEncryptionKey() {
    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) {
      throw new Error('ENCRYPTION_KEY not configured');
    }
    
    // Derive a consistent 32-byte key from the environment variable
    return crypto
      .createHash('sha256')
      .update(envKey)
      .digest();
  }

  /**
   * Sign a transaction message (simulated)
   * In a real implementation, this would create a proper Bitcoin transaction
   */
  signTransaction(privateKeyHex, transactionData) {
    try {
      const network = this.getNetwork();
      const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { network });
      
      // Create hash of transaction data
      const txHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(transactionData))
        .digest();
      
      // Sign the hash
      const signature = keyPair.sign(txHash);
      
      return {
        signature: signature.toString('hex'),
        txHash: txHash.toString('hex'),
        publicKey: keyPair.publicKey.toString('hex')
      };
    } catch (error) {
      throw new Error(`Transaction signing failed: ${error.message}`);
    }
  }

  /**
   * Verify a transaction signature
   */
  verifySignature(publicKeyHex, signatureHex, transactionData) {
    try {
      const network = this.getNetwork();
      const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
      const signature = Buffer.from(signatureHex, 'hex');
      
      const keyPair = ECPair.fromPublicKey(publicKeyBuffer, { network });
      
      const txHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(transactionData))
        .digest();
      
      return keyPair.verify(txHash, signature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate integrity hash for data
   */
  generateHash(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto
      .createHash('sha256')
      .update(dataString + process.env.ENCRYPTION_KEY)
      .digest('hex');
  }

  /**
   * Verify data integrity
   */
  verifyHash(data, expectedHash) {
    const currentHash = this.generateHash(data);
    return currentHash === expectedHash;
  }

  /**
   * Generate random bytes (for nonces, IVs, etc.)
   */
  generateRandomBytes(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate Bitcoin address format
   */
  validateAddress(address) {
    try {
      const network = this.getNetwork();
      bitcoin.address.toOutputScript(address, network);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
module.exports = new CryptoService();
