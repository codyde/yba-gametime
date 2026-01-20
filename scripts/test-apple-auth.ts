/**
 * Apple Auth Direct Test Script
 * 
 * This script tests the Apple authentication by attempting to make
 * a token request directly to Apple's servers.
 * 
 * This helps isolate whether the issue is with:
 * 1. The JWT/client_secret
 * 2. The Better Auth configuration
 * 3. The redirect_uri
 * 
 * Usage: npx tsx scripts/test-apple-auth.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testAppleAuth() {
  const clientId = process.env.APPLE_CLIENT_ID;
  const clientSecret = process.env.APPLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yba.girlsgotgame.app';
  
  if (!clientId || !clientSecret) {
    console.error('Missing APPLE_CLIENT_ID or APPLE_CLIENT_SECRET');
    process.exit(1);
  }

  console.log('\n=== Apple Auth Direct Test ===\n');
  console.log('This test simulates the token exchange request that Better Auth makes.\n');
  
  // Build the request body (simulating what Better Auth sends)
  const redirectUri = `${baseUrl}/api/auth/callback/apple`;
  
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', 'test_code_that_will_fail'); // We expect this to fail
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  body.set('redirect_uri', redirectUri);

  console.log('Request Details:');
  console.log(`  URL: https://appleid.apple.com/auth/token`);
  console.log(`  Method: POST`);
  console.log(`  client_id: ${clientId}`);
  console.log(`  client_secret: ${clientSecret.substring(0, 50)}...`);
  console.log(`  redirect_uri: ${redirectUri}`);
  console.log('');

  try {
    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    console.log('');

    // Interpret the error
    if (data.error === 'invalid_client') {
      console.log('=== DIAGNOSIS: invalid_client ===\n');
      console.log('This error means Apple rejected the client credentials.');
      console.log('Possible causes:');
      console.log('');
      console.log('1. PRIVATE KEY MISMATCH');
      console.log('   - The private key in .env may not match Key ID 9D7WF2P93Z');
      console.log('   - Re-download the .p8 file from Apple and regenerate the JWT');
      console.log('');
      console.log('2. KEY NOT ASSOCIATED WITH SIGN IN WITH APPLE');
      console.log('   - Go to Keys in Apple Developer Console');
      console.log('   - Find key 9D7WF2P93Z');
      console.log('   - Ensure "Sign In with Apple" is enabled');
      console.log('   - Ensure it\'s linked to the correct Primary App ID');
      console.log('');
      console.log('3. SERVICE ID NOT CONFIGURED');
      console.log('   - Go to Identifiers > Services IDs');
      console.log('   - Find com.buildwithcode.girlsgotgame.oauth');
      console.log('   - Ensure "Sign In with Apple" checkbox is ENABLED');
      console.log('   - Click Configure and verify settings');
      console.log('');
      console.log('4. TEAM ID MISMATCH');
      console.log('   - Verify your Team ID is exactly: 6NCKTNDL43');
      console.log('   - Check at: https://developer.apple.com/account (top right)');
      console.log('');
    } else if (data.error === 'invalid_grant') {
      console.log('=== DIAGNOSIS: invalid_grant ===\n');
      console.log('GOOD NEWS! This error means the client credentials are VALID!');
      console.log('The error is only because we used a fake authorization code.');
      console.log('Your Apple Sign In should work now.');
      console.log('');
    } else if (data.error === 'invalid_request') {
      console.log('=== DIAGNOSIS: invalid_request ===\n');
      console.log('The request format is invalid.');
      console.log('Check redirect_uri matches what\'s configured in Apple Developer Console.');
      console.log('');
    }
    
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testAppleAuth().catch(console.error);
