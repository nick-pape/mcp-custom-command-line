import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Terminal, ConsoleTerminalProvider } from "@rushstack/terminal";
import { ConfigurationManager } from "./configuration.js";
import { CommandExecutor, ICommandExecutionParams } from "./executor.js";
import { ICommandLineEntry, IConfig, validateConfig } from "./schema.js";

const CONFIG_FILE_PATH_ENV: string | undefined = process.env.MCP_CLI_CONFIG_PATH;
const CONFIG_JSON_ENV: string | undefined = process.env.MCP_CLI_CONFIG_JSON;

// Initialize terminal for logging
let terminal: Terminal;

const server: McpServer = new McpServer({
  name: "mcp-cli-server",
  version: "0.0.1",
  capabilities: {
    resources: {},
    tools: {}
  }
});

let commandExecutor: CommandExecutor;

/**
 * Parse command line arguments
 */
async function parseArguments(): Promise<{ configFile?: string; config?: string }> {
  terminal?.writeDebugLine('Parsing command line arguments');
  
  const argv = await yargs(hideBin(process.argv))
    .option('config-file', {
      alias: 'c',
      type: 'string',
      description: 'Path to the configuration file'
    })
    .option('config', {
      type: 'string',
      description: 'JSON configuration as a string'
    })
    .help()
    .argv;

  const result = {
    configFile: argv['config-file'],
    config: argv.config
  };
  
  terminal?.writeVerboseLine(`Parsed arguments: configFile=${result.configFile || 'undefined'}, config=${result.config ? 'provided' : 'undefined'}`);
  return result;
}

/**
 * Initialize terminal with log level from environment variables
 */
function initializeTerminal(): Terminal {
  return new Terminal(new ConsoleTerminalProvider({
    verboseEnabled: process.env.LOG_LEVEL === 'verbose' || process.env.DEBUG === '1',
    debugEnabled: process.env.LOG_LEVEL === 'debug' || process.env.DEBUG === '1'
  }));
}

/**
 * Read JSON configuration from stdin
 */
async function readConfigFromStdin(): Promise<string> {
  terminal?.writeVerboseLine('Reading configuration from stdin');
  
  return new Promise((resolve, reject) => {
    let data: string = '';
    
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => {
      data += chunk;
      terminal?.writeDebugLine(`Received stdin chunk of ${chunk.length} characters`);
    });
    
    process.stdin.on('end', () => {
      terminal?.writeVerboseLine(`Finished reading from stdin, total length: ${data.length} characters`);
      resolve(data.trim());
    });
    
    process.stdin.on('error', (error: Error) => {
      terminal?.writeErrorLine(`Error reading from stdin: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Resolve configuration from various sources
 */
async function resolveConfiguration(args: { configFile?: string; config?: string }): Promise<IConfig> {
  terminal?.writeVerboseLine('Starting configuration resolution');
  
  // Priority order:
  // 1. Command line --config (JSON string)
  // 2. Command line --config-file (file path)
  // 3. Environment variable MCP_CLI_CONFIG_JSON (JSON string)
  // 4. Environment variable MCP_CLI_CONFIG_PATH (file path)
  // 5. stdin (JSON string)
  
  if (args.config) {
    // Parse JSON from command line argument
    try {
      terminal?.writeVerboseLine('Using configuration from --config argument');
      terminal?.writeDebugLine(`Config argument length: ${args.config.length} characters`);
      const configData: unknown = JSON.parse(args.config);
      return validateConfig(configData, terminal);
    } catch (error) {
      const errorMsg = `Failed to parse --config JSON: ${error instanceof Error ? error.message : String(error)}`;
      terminal?.writeErrorLine(errorMsg);
      throw new Error(errorMsg);
    }
  }
  
  if (args.configFile) {
    // Load from command line specified file
    terminal?.writeVerboseLine(`Loading configuration from file: ${args.configFile}`);
    const configManager: ConfigurationManager = new ConfigurationManager(args.configFile, terminal);
    await configManager.loadConfig();
    return configManager.getConfig();
  }
  
  if (CONFIG_JSON_ENV) {
    // Parse JSON from environment variable
    try {
      terminal?.writeVerboseLine('Using configuration from MCP_CLI_CONFIG_JSON environment variable');
      terminal?.writeDebugLine(`Environment config length: ${CONFIG_JSON_ENV.length} characters`);
      const configData: unknown = JSON.parse(CONFIG_JSON_ENV);
      return validateConfig(configData, terminal);
    } catch (error) {
      const errorMsg = `Failed to parse MCP_CLI_CONFIG_JSON: ${error instanceof Error ? error.message : String(error)}`;
      terminal?.writeErrorLine(errorMsg);
      throw new Error(errorMsg);
    }
  }
  
  if (CONFIG_FILE_PATH_ENV) {
    // Load from environment variable specified file
    terminal?.writeVerboseLine(`Loading configuration from environment variable file: ${CONFIG_FILE_PATH_ENV}`);
    const configManager: ConfigurationManager = new ConfigurationManager(CONFIG_FILE_PATH_ENV, terminal);
    await configManager.loadConfig();
    return configManager.getConfig();
  }
  
  // Read from stdin
  try {
    terminal?.writeVerboseLine('Reading configuration from stdin');
    const stdinData: string = await readConfigFromStdin();
    if (!stdinData) {
      const errorMsg = "No configuration provided via stdin";
      terminal?.writeErrorLine(errorMsg);
      throw new Error(errorMsg);
    }
    terminal?.writeDebugLine(`Stdin data length: ${stdinData.length} characters`);
    const configData: unknown = JSON.parse(stdinData);
    return validateConfig(configData, terminal);
  } catch (error) {
    const errorMsg = `Failed to read/parse configuration from stdin: ${error instanceof Error ? error.message : String(error)}`;
    terminal?.writeErrorLine(errorMsg);
    throw new Error(errorMsg);
  }
}

// Register tools based on configuration
async function registerTools(config: IConfig): Promise<void> {
  terminal?.writeVerboseLine('Starting tool registration');
  const commands: ICommandLineEntry[] = config.commands;
  
  terminal?.writeVerboseLine(`Registering ${commands.length} commands as MCP tools`);
  
  for (const command of commands) {
    terminal?.writeDebugLine(`Registering tool for command: ${command.name}`);
    
    // Build Zod schema for the command arguments
    const schemaObject: Record<string, z.ZodType> = {};
    for (const arg of command.arguments) {
      terminal?.writeDebugLine(`Processing argument: ${arg.name} (type: ${arg.type}, required: ${arg.required})`);
      
      let zodType: z.ZodType;
      switch (arg.type) {
        case 'string':
          zodType = z.string().describe(arg.description);
          break;
        case 'number':
          zodType = z.number().describe(arg.description);
          break;
        case 'boolean':
          zodType = z.boolean().describe(arg.description);
          break;
        default:
          terminal?.writeWarningLine(`Unknown argument type '${arg.type}' for argument '${arg.name}', defaulting to string`);
          zodType = z.string().describe(arg.description);
      }
      
      if (!arg.required) {
        zodType = zodType.optional();
        terminal?.writeDebugLine(`Argument '${arg.name}' marked as optional`);
      }
      
      if (arg.defaultValue !== undefined) {
        zodType = zodType.default(arg.defaultValue);
        terminal?.writeDebugLine(`Argument '${arg.name}' has default value: ${arg.defaultValue}`);
      }
      
      schemaObject[arg.name] = zodType;
    }
    
    // Register the tool
    terminal?.writeVerboseLine(`Registering MCP tool: ${command.name}`);
    server.tool(
      command.name,
      command.description,
      schemaObject,
      async (params: Record<string, unknown>) => {
        terminal?.writeVerboseLine(`Executing MCP tool: ${command.name}`);
        terminal?.writeDebugLine(`Tool parameters: ${JSON.stringify(params, null, 2)}`);
        
        try {
          // Validate parameters
          const typedParams: ICommandExecutionParams = params as ICommandExecutionParams;
          const validationErrors: string[] = commandExecutor.validateParameters(command, typedParams);
          if (validationErrors.length > 0) {
            const errorMsg = `Parameter validation failed: ${validationErrors.join(', ')}`;
            terminal?.writeErrorLine(errorMsg);
            throw new Error(errorMsg);
          }
          
          // Execute the command
          terminal?.writeVerboseLine(`Executing command: ${command.name}`);
          const result = await commandExecutor.executeCommand(command, typedParams);
          
          const responseText = result.success 
            ? `Command executed successfully:\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}\n\nExit Code: ${result.exitCode}`
            : `Command failed:\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}\n\nExit Code: ${result.exitCode}`;
          
          terminal?.writeVerboseLine(`Tool execution completed: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
          
          return {
            content: [
              {
                type: "text",
                text: responseText
              }
            ],
            isError: !result.success
          };
        } catch (error) {
          const errorMsg = `Error executing command: ${error instanceof Error ? error.message : String(error)}`;
          terminal?.writeErrorLine(errorMsg);
          
          return {
            content: [
              {
                type: "text",
                text: errorMsg
              }
            ],
            isError: true
          };
        }
      }
    );
    
    terminal?.writeVerboseLine(`Successfully registered tool: ${command.name}`);
  }
  
  terminal?.writeVerboseLine(`Completed registration of ${commands.length} tools`);
}

async function main(): Promise<void> {
  try {
    terminal?.writeVerboseLine('Starting MCP CLI Server initialization');
    
    // Parse command line arguments
    terminal?.writeVerboseLine('Parsing command line arguments');
    const args = await parseArguments();
    
    // Initialize terminal with log level from environment variables
    terminal?.writeVerboseLine('Initializing terminal with environment settings');
    terminal = initializeTerminal();
    
    // Initialize command executor with terminal
    terminal.writeVerboseLine('Initializing command executor');
    commandExecutor = new CommandExecutor(terminal);
    
    // Resolve configuration from various sources
    terminal.writeVerboseLine('Resolving configuration');
    const config: IConfig = await resolveConfiguration(args);
    terminal.writeVerboseLine(`Loaded configuration with ${config.commands.length} commands`);
    
    // Register tools
    terminal.writeVerboseLine('Registering MCP tools');
    await registerTools(config);
    terminal.writeVerboseLine("Registered tools with MCP server");
    
    // Start server
    terminal.writeVerboseLine('Starting MCP server transport');
    const transport: StdioServerTransport = new StdioServerTransport();
    await server.connect(transport);
    terminal.writeVerboseLine("MCP CLI Server is running and listening for requests...");
  } catch (error) {
    const errorMsg = `Error starting server: ${error instanceof Error ? error.message : String(error)}`;
    if (terminal) {
      terminal.writeErrorLine(errorMsg);
    } else {
      console.error("Error starting server:", error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  const errorMsg = `Error starting server: ${error instanceof Error ? error.message : String(error)}`;
  if (terminal) {
    terminal.writeErrorLine(errorMsg);
  } else {
    console.error("Error starting server:", error);
  }
  process.exit(1);
});