/**
 * Form Discovery Script
 *
 * Uses Playwright MCP + Anthropic API to:
 * 1. Run seed steps (login, navigation, etc.)
 * 2. Discover form fields via browser interactions
 * 3. Generate a Playwright test file with locators
 * 4. Generate a data generator for test values
 */

import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from './config.js';
import { createMCPClient } from './lib/mcp-client.js';
import {
  createAnthropicClient,
  convertToolsToAnthropicFormat,
  callWithRetry,
} from './lib/anthropic.js';
import { extractFiles, saveFiles } from './lib/file-writer.js';
import { loadSeed } from './seeds/index.js';
import { getDiscoveryPrompt, getNudgePrompt } from './prompts/discovery.js';

async function main() {
  const config = loadConfig();

  console.log('Starting Form Discovery...\n');
  console.log(`Target form: ${config.formUrl}`);
  console.log(`Form name: ${config.formName}`);
  console.log(`Seed: ${config.seedName || 'default'}`);
  console.log(`Output: ${config.outputDir}\n`);

  // Load seed function
  const seed = await loadSeed(config.seedName);

  // Create MCP client
  const { client: mcpClient, tools: mcpTools } = await createMCPClient(config);

  try {
    // Run seed (login, navigation, etc.)
    await seed(mcpClient, config.formUrl);

    // Convert tools for Anthropic API
    const anthropicTools = convertToolsToAnthropicFormat(mcpTools);
    const anthropic = createAnthropicClient();

    // Run discovery conversation
    console.log('Starting form discovery with Claude...\n');
    console.log('─'.repeat(60));

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: getDiscoveryPrompt(config.formUrl) }
    ];

    let continueLoop = true;
    let iterations = 0;

    while (continueLoop && iterations < config.maxIterations) {
      iterations++;

      // Nudge to generate output when approaching limit
      if (iterations === config.maxIterations - 5) {
        messages.push({ role: 'user', content: getNudgePrompt() });
      }

      const response = await callWithRetry(anthropic, {
        model: config.model,
        maxTokens: 4096,
        tools: anthropicTools,
        messages,
      });

      // Process the response
      let hasToolUse = false;
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          console.log(`\nClaude: ${block.text}\n`);
        } else if (block.type === 'tool_use') {
          hasToolUse = true;
          console.log(`\n[Tool Call] ${block.name}(${JSON.stringify(block.input)})`);

          try {
            const result = await mcpClient.callTool({
              name: block.name,
              arguments: block.input as Record<string, unknown>,
            });

            let resultText = '';
            if (Array.isArray(result.content)) {
              resultText = result.content
                .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
                .map(c => c.text)
                .join('\n');
            }

            console.log(`[Tool Result] ${resultText.substring(0, 200)}${resultText.length > 200 ? '...' : ''}`);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: resultText,
            });
          } catch (error) {
            console.error(`[Tool Error] ${error}`);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Error: ${error}`,
              is_error: true,
            });
          }
        }
      }

      // Add assistant message to history
      messages.push({ role: 'assistant', content: response.content });

      // If there were tool uses, add results and continue
      if (hasToolUse && toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }

      // Check stop condition
      if (response.stop_reason === 'end_turn' && !hasToolUse) {
        continueLoop = false;

        // Extract and save generated files from ALL assistant messages
        // (Claude may split long responses across multiple turns)
        let allAssistantText = '';
        for (const msg of messages) {
          if (msg.role === 'assistant' && Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if (block.type === 'text') {
                allAssistantText += block.text + '\n';
              }
            }
          }
        }

        const extracted = extractFiles(allAssistantText);
        saveFiles(extracted, config.outputDir, config.formName);
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('Discovery complete!');

  } catch (error) {
    console.error('Error during discovery:', error);
    throw error;
  } finally {
    await mcpClient.close();
  }
}

main().catch(console.error);
