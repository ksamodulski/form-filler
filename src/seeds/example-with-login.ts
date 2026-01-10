import type { SeedFunction } from './types.js';
import { callTool } from './types.js';

/**
 * Example seed demonstrating login and navigation.
 *
 * Copy this file and customize for your application:
 * 1. Rename to match your app (e.g., 'my-app.ts')
 * 2. Update login URL and credentials
 * 3. Add navigation steps to reach your form
 * 4. Set SEED_NAME=my-app in .env
 */
export const seed: SeedFunction = async (mcpClient, formUrl) => {
  console.log('\n[Seed] Running login seed...');

  // Step 1: Navigate to login page
  // await callTool(mcpClient, 'browser_navigate', {
  //   url: 'https://your-app.com/login'
  // });

  // Step 2: Fill login form
  // await callTool(mcpClient, 'browser_type', {
  //   element: 'Username input',
  //   text: process.env.APP_USERNAME || 'testuser',
  // });
  // await callTool(mcpClient, 'browser_type', {
  //   element: 'Password input',
  //   text: process.env.APP_PASSWORD || 'testpass',
  // });

  // Step 3: Click login button
  // await callTool(mcpClient, 'browser_click', {
  //   element: 'Login button',
  // });

  // Step 4: Wait for dashboard/home page
  // await callTool(mcpClient, 'browser_wait_for', {
  //   selector: '.dashboard',
  //   timeout: 10000,
  // });

  // Step 5: Navigate to the form (through menus if needed)
  // await callTool(mcpClient, 'browser_click', {
  //   element: 'Forms menu',
  // });
  // await callTool(mcpClient, 'browser_click', {
  //   element: 'Registration form link',
  // });

  // Or just navigate directly to the form URL
  await callTool(mcpClient, 'browser_navigate', { url: formUrl });

  console.log('[Seed] Login seed complete.\n');
};
