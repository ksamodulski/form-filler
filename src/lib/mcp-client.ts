import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { DiscoveryConfig } from '../config.js';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export async function createMCPClient(config: DiscoveryConfig): Promise<{
  client: Client;
  tools: MCPTool[];
}> {
  const args = ['@playwright/mcp@latest', '--browser', config.browser, '--caps', 'vision'];

  if (config.headless) {
    args.push('--headless');
  }

  const transport = new StdioClientTransport({
    command: 'npx',
    args,
  });

  const client = new Client(
    { name: 'form-discovery', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('Connected to Playwright MCP server\n');

  const toolsResult = await client.listTools();
  const tools: MCPTool[] = toolsResult.tools;
  console.log(`Available MCP tools: ${tools.map(t => t.name).join(', ')}\n`);

  return { client, tools };
}
