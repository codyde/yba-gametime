/**
 * Apple JWT Verification Script
 * 
 * This script decodes and verifies the Apple client secret JWT
 * to help debug invalid_client errors.
 * 
 * Usage: npx tsx scripts/verify-apple-jwt.ts
 */

import * as jose from 'jose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifyAppleJwt() {
  const clientSecret = process.env.APPLE_CLIENT_SECRET;
  const clientId = process.env.APPLE_CLIENT_ID;
  
  if (!clientSecret) {
    console.error('ERROR: APPLE_CLIENT_SECRET not found in environment');
    process.exit(1);
  }

  console.log('\n=== Apple JWT Verification ===\n');

  // Decode without verification to inspect claims
  const decoded = jose.decodeJwt(clientSecret);
  const header = jose.decodeProtectedHeader(clientSecret);

  console.log('JWT Header:');
  console.log(JSON.stringify(header, null, 2));
  console.log('');

  console.log('JWT Payload:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log('');

  // Validation checks
  console.log('=== Validation Checks ===\n');

  // Check algorithm
  if (header.alg === 'ES256') {
    console.log('✓ Algorithm: ES256 (correct)');
  } else {
    console.log(`✗ Algorithm: ${header.alg} (should be ES256)`);
  }

  // Check kid
  if (header.kid) {
    console.log(`✓ Key ID (kid): ${header.kid}`);
  } else {
    console.log('✗ Key ID (kid): MISSING');
  }

  // Check issuer (should be Team ID)
  if (decoded.iss) {
    console.log(`✓ Issuer (iss/Team ID): ${decoded.iss}`);
    if (decoded.iss.length !== 10) {
      console.log(`  ⚠ Warning: Team ID should be exactly 10 characters, got ${decoded.iss.length}`);
    }
  } else {
    console.log('✗ Issuer (iss): MISSING');
  }

  // Check subject (should match client ID)
  if (decoded.sub) {
    console.log(`✓ Subject (sub/Client ID): ${decoded.sub}`);
    if (clientId && decoded.sub !== clientId) {
      console.log(`  ⚠ WARNING: sub (${decoded.sub}) doesn't match APPLE_CLIENT_ID (${clientId})`);
    } else if (clientId) {
      console.log('  ✓ Matches APPLE_CLIENT_ID');
    }
  } else {
    console.log('✗ Subject (sub): MISSING');
  }

  // Check audience
  if (decoded.aud === 'https://appleid.apple.com') {
    console.log('✓ Audience (aud): https://appleid.apple.com (correct)');
  } else {
    console.log(`✗ Audience (aud): ${decoded.aud} (should be https://appleid.apple.com)`);
  }

  // Check timestamps
  const now = Math.floor(Date.now() / 1000);
  
  if (decoded.iat) {
    const iatDate = new Date((decoded.iat as number) * 1000);
    console.log(`✓ Issued At (iat): ${decoded.iat} (${iatDate.toISOString()})`);
    if ((decoded.iat as number) > now) {
      console.log('  ⚠ WARNING: iat is in the future!');
    }
  } else {
    console.log('✗ Issued At (iat): MISSING');
  }

  if (decoded.exp) {
    const expDate = new Date((decoded.exp as number) * 1000);
    const daysUntilExpiry = Math.floor(((decoded.exp as number) - now) / 86400);
    console.log(`✓ Expiration (exp): ${decoded.exp} (${expDate.toISOString()})`);
    if ((decoded.exp as number) < now) {
      console.log('  ✗ ERROR: Token has EXPIRED!');
    } else {
      console.log(`  ✓ Valid for ${daysUntilExpiry} more days`);
    }
  } else {
    console.log('✗ Expiration (exp): MISSING');
  }

  console.log('\n=== Environment Check ===\n');
  console.log(`APPLE_CLIENT_ID: ${process.env.APPLE_CLIENT_ID || 'NOT SET'}`);
  console.log(`APPLE_CLIENT_SECRET: ${clientSecret ? clientSecret.substring(0, 50) + '...' : 'NOT SET'}`);
  console.log(`BETTER_AUTH_URL: ${process.env.BETTER_AUTH_URL || 'NOT SET'}`);
  console.log(`NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET'}`);

  console.log('\n=== Apple Developer Console Checklist ===\n');
  console.log('Verify these in your Apple Developer Console:');
  console.log(`1. Service ID identifier matches: ${decoded.sub}`);
  console.log(`2. Team ID matches: ${decoded.iss}`);
  console.log(`3. Key ID matches: ${header.kid}`);
  console.log('4. Key is associated with the correct Primary App ID');
  console.log('5. Sign In with Apple is ENABLED on the Service ID');
  console.log(`6. Return URL is: https://yba.girlsgotgame.app/api/auth/callback/apple`);
  console.log('');
}

verifyAppleJwt().catch(console.error);
