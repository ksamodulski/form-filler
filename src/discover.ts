/**
 * Form Discovery Script
 *
 * Uses Playwright MCP + Anthropic API to:
 * 1. Navigate to a form URL
 * 2. Discover form fields via browser interactions
 * 3. Generate a Playwright test file with locators
 * 4. Generate a data generator for test values
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as fs from 'fs';
import * as path from 'path';

const FORM_URL = 'https://demoqa.com/automation-practice-form';

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

async function main() {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('Options:');
    console.error('  1. Create a .env file with: ANTHROPIC_API_KEY=your-api-key');
    console.error('  2. Export directly: export ANTHROPIC_API_KEY=your-api-key');
    console.error('\nSee .env.example for reference.');
    process.exit(1);
  }

  console.log('Starting Form Discovery...\n');
  console.log(`Target form: ${FORM_URL}\n`);

  // Create MCP client transport (headed by default, with vision for screenshots)
  // Use chromium browser instead of chrome (which requires system install)
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['@playwright/mcp@latest', '--browser', 'chromium', '--caps', 'vision'],
  });

  const mcpClient = new Client(
    { name: 'form-discovery', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    await mcpClient.connect(transport);
    console.log('Connected to Playwright MCP server\n');

    // List available tools
    const toolsResult = await mcpClient.listTools();
    const mcpTools: MCPTool[] = toolsResult.tools;
    console.log(`Available MCP tools: ${mcpTools.map(t => t.name).join(', ')}\n`);

    // Convert MCP tools to Anthropic tool format
    const anthropicTools: Anthropic.Tool[] = mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    }));

    // Initialize Anthropic client
    const anthropic = new Anthropic();

    // Discovery prompt
    const discoveryPrompt = `You are a test automation expert. Your task is to explore a web form and generate a Playwright test file for it.

Target URL: ${FORM_URL}

## Instructions

1. Navigate to the form URL using browser_navigate
2. Take a snapshot to see the form structure
3. Quickly test each form field type ONCE (one text input, one radio, one dropdown, etc.)
4. Click the submit button to see what happens
5. IMMEDIATELY generate the test files using the locators from MCP responses

## CRITICAL: Be Efficient
- Do NOT exhaustively test every field - just discover the locator patterns
- After ~10 interactions, you MUST stop exploring and generate the output
- Use the EXACT locators returned by MCP tool responses
- If a click times out, try an alternative approach ONCE, then move on

## Output Format

After exploring, output EXACTLY this format (required for file extraction):

\`\`\`TEST_FILE
// Your complete Playwright test file here
\`\`\`

\`\`\`DATA_GENERATOR
// Your data generator file here
\`\`\`

Start now. Be quick and efficient.`;

    // Run the discovery conversation
    console.log('Starting form discovery with Claude...\n');
    console.log('─'.repeat(60));

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: discoveryPrompt }
    ];

    let continueLoop = true;
    let iterations = 0;
    const maxIterations = 20;

    while (continueLoop && iterations < maxIterations) {
      iterations++;

      // Nudge to generate output when approaching limit
      if (iterations === 15) {
        messages.push({
          role: 'user',
          content: 'You have explored enough. Now STOP exploring and generate the TEST_FILE and DATA_GENERATOR output immediately.'
        });
      }

      let response;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            tools: anthropicTools,
            messages,
          });
          break;
        } catch (error: unknown) {
          if (error instanceof Error && error.message.includes('rate_limit')) {
            retries++;
            const waitTime = Math.pow(2, retries) * 10000; // 20s, 40s, 80s
            console.log(`\nRate limited. Waiting ${waitTime/1000}s before retry ${retries}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error;
          }
        }
      }

      if (!response) {
        throw new Error('Max retries exceeded for rate limiting');
      }

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
            // Call the MCP tool
            const result = await mcpClient.callTool({
              name: block.name,
              arguments: block.input as Record<string, unknown>,
            });

            // Extract text content from result
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

        // Extract generated files from the response
        const lastAssistant = messages[messages.length - 1];
        if (lastAssistant.role === 'assistant' && Array.isArray(lastAssistant.content)) {
          for (const block of lastAssistant.content) {
            if (block.type === 'text') {
              extractAndSaveFiles(block.text);
            }
          }
        }
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

function extractAndSaveFiles(text: string) {
  const outputDir = path.join(process.cwd(), 'tests', 'generated');

  // Extract test file
  const testMatch = text.match(/```TEST_FILE\n([\s\S]*?)```/);
  if (testMatch) {
    const testContent = testMatch[1].trim();
    const testPath = path.join(outputDir, 'student-form.spec.ts');
    fs.writeFileSync(testPath, testContent);
    console.log(`\nGenerated test file: ${testPath}`);
  }

  // Extract data generator
  const dataMatch = text.match(/```DATA_GENERATOR\n([\s\S]*?)```/);
  if (dataMatch) {
    const dataContent = dataMatch[1].trim();
    const dataPath = path.join(outputDir, 'student-form.data.ts');
    fs.writeFileSync(dataPath, dataContent);
    console.log(`Generated data file: ${dataPath}`);
  }
}

main().catch(console.error);
