/**
 * Apple Client Secret Generator
 * 
 * This script generates a JWT client secret for Apple Sign In.
 * Apple requires a client secret in JWT format, signed with your private key.
 * 
 * The generated JWT is valid for up to 6 months (Apple's maximum).
 * Set a reminder to regenerate before expiration.
 * 
 * Usage:
 *   npx tsx scripts/generate-apple-secret.ts
 * 
 * Required environment variables in .env:
 *   - APPLE_TEAM_ID: Your 10-character Apple Team ID
 *   - APPLE_KEY_ID: The Key ID from your Apple Developer account
 *   - APPLE_CLIENT_ID: Your Service ID (e.g., com.company.app.oauth)
 *   - APPLE_PRIVATE_KEY: The contents of your .p8 private key file
 */

import * as jose from 'jose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function generateAppleClientSecret(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

  // Validate required environment variables
  if (!teamId) {
    throw new Error('Missing APPLE_TEAM_ID environment variable');
  }
  if (!keyId) {
    throw new Error('Missing APPLE_KEY_ID environment variable');
  }
  if (!clientId) {
    throw new Error('Missing APPLE_CLIENT_ID environment variable');
  }
  if (!privateKeyRaw) {
    throw new Error('Missing APPLE_PRIVATE_KEY environment variable');
  }

  // Clean up private key - handle various formats from environment variables
  let privateKey = privateKeyRaw
    .replace(/\\n/g, '\n')  // Handle escaped newlines
    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
    .trim();

  // Ensure proper PEM format
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format. Must be in PEM format.');
  }

  console.log('\n--- Apple Client Secret Generator ---\n');
  console.log('Configuration:');
  console.log(`  Team ID:   ${teamId}`);
  console.log(`  Key ID:    ${keyId}`);
  console.log(`  Client ID: ${clientId}`);
  console.log(`  Private Key: ${privateKey.substring(0, 50)}...`);
  console.log('');

  // Import the private key
  const key = await jose.importPKCS8(privateKey, 'ES256');

  // Calculate timestamps
  const now = Math.floor(Date.now() / 1000);
  const sixMonthsInSeconds = 180 * 24 * 60 * 60; // 180 days
  const exp = now + sixMonthsInSeconds;

  // Generate the JWT
  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setAudience('https://appleid.apple.com')
    .setIssuer(teamId)
    .setSubject(clientId)
    .sign(key);

  // Calculate expiration date for display
  const expirationDate = new Date(exp * 1000);

  console.log('JWT Generated Successfully!');
  console.log('');
  console.log(`Expires: ${expirationDate.toISOString()}`);
  console.log(`         (${Math.floor(sixMonthsInSeconds / 86400)} days from now)`);
  console.log('');
  console.log('--- Generated Client Secret ---');
  console.log('');
  console.log(jwt);
  console.log('');
  console.log('--- Environment Variable ---');
  console.log('');
  console.log(`APPLE_CLIENT_SECRET=${jwt}`);
  console.log('');
  console.log('Copy the APPLE_CLIENT_SECRET line above to your .env file.');
  console.log('');

  return jwt;
}

// Run the generator
generateAppleClientSecret()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error generating Apple client secret:', error.message);
    process.exit(1);
  });
