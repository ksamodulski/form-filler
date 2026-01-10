import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

/**
 * A seed function that runs before form discovery.
 * Use this to:
 * - Login to the application
 * - Navigate through menus
 * - Handle authentication
 * - Get to the specific form page
 */
export type SeedFunction = (mcpClient: Client, formUrl: string) => Promise<void>;

/**
 * Helper to call an MCP tool and log the result.
 */
export async function callTool(
  mcpClient: Client,
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  console.log(`[Seed] ${name}(${JSON.stringify(args)})`);

  const result = await mcpClient.callTool({
    name,
    arguments: args,
  });

  let resultText = '';
  if (Array.isArray(result.content)) {
    resultText = result.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map(c => c.text)
      .join('\n');
  }

  const preview = resultText.substring(0, 100);
  console.log(`[Seed] Result: ${preview}${resultText.length > 100 ? '...' : ''}`);

  return resultText;
}
