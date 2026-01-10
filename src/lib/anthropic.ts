import Anthropic from '@anthropic-ai/sdk';
import type { MCPTool } from './mcp-client.js';

export function createAnthropicClient(): Anthropic {
  return new Anthropic();
}

export function convertToolsToAnthropicFormat(mcpTools: MCPTool[]): Anthropic.Tool[] {
  return mcpTools.map(tool => ({
    name: tool.name,
    description: tool.description || '',
    input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
  }));
}

export interface CallOptions {
  model: string;
  maxTokens: number;
  tools: Anthropic.Tool[];
  messages: Anthropic.MessageParam[];
  maxRetries?: number;
}

export async function callWithRetry(
  client: Anthropic,
  options: CallOptions
): Promise<Anthropic.Message> {
  const { model, maxTokens, tools, messages, maxRetries = 3 } = options;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await client.messages.create({
        model,
        max_tokens: maxTokens,
        tools,
        messages,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('rate_limit')) {
        retries++;
        const waitTime = Math.pow(2, retries) * 10000; // 20s, 40s, 80s
        console.log(`\nRate limited. Waiting ${waitTime / 1000}s before retry ${retries}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded for rate limiting');
}
