import type { SeedFunction } from './types.js';
import { callTool } from './types.js';

/**
 * Default seed - simply navigates to the form URL.
 * Use this when no authentication or navigation is needed.
 */
export const seed: SeedFunction = async (mcpClient, formUrl) => {
  console.log('\n[Seed] Running default seed (direct navigation)...');

  await callTool(mcpClient, 'browser_navigate', { url: formUrl });

  // Remove common ad overlays that interfere with form interaction
  await callTool(mcpClient, 'browser_evaluate', {
    function: `() => {
      document.querySelectorAll('#adplus-anchor, #fixedban, .ad-wrap, iframe[id*="google_ads"]')
        .forEach(el => el.remove());
    }`,
  });

  console.log('[Seed] Default seed complete.\n');
};
