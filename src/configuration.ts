import { FileSystem, JsonFile } from "@rushstack/node-core-library";
import { Terminal } from "@rushstack/terminal";
import { IConfig, ICommandLineEntry, validateConfig } from "./schema.js";

/**
 * Configuration loader and manager for the MCP CLI server
 */
export class ConfigurationManager {
  private _config: IConfig | undefined;
  private _configFilePath: string;
  private _terminal?: Terminal;

  public constructor(configFilePath: string, terminal?: Terminal) {
    this._configFilePath = configFilePath;
    this._terminal = terminal;
    this._terminal?.writeDebugLine(`ConfigurationManager initialized with file path: ${configFilePath}`);
  }

  /**
   * Load and validate the configuration file
   */
  public async loadConfig(): Promise<void> {
    this._terminal?.writeVerboseLine(`Starting configuration load from: ${this._configFilePath}`);
    
    try {
      // Check if config file exists
      this._terminal?.writeDebugLine('Checking if configuration file exists');
      if (!FileSystem.exists(this._configFilePath)) {
        const errorMsg = `Configuration file not found: ${this._configFilePath}`;
        this._terminal?.writeErrorLine(errorMsg);
        throw new Error(errorMsg);
      }

      this._terminal?.writeVerboseLine('Configuration file exists, attempting to load');

      // Read the JSON file using Rush Stack tools
      this._terminal?.writeDebugLine('Reading JSON configuration file');
      const configData: unknown = JsonFile.load(this._configFilePath);
      this._terminal?.writeVerboseLine('Configuration file loaded successfully');

      // Validate against schema
      this._terminal?.writeVerboseLine('Validating configuration against schema');
      this._config = validateConfig(configData, this._terminal);
      
      const commandCount = this._config.commands.length;
      this._terminal?.writeVerboseLine(`Configuration loaded and validated successfully with ${commandCount} commands`);
      
      if (commandCount === 0) {
        this._terminal?.writeWarningLine('Warning: Configuration contains no commands');
      }
      
    } catch (error) {
      const errorMsg = `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`;
      this._terminal?.writeErrorLine(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Get the loaded configuration
   */
  public getConfig(): IConfig {
    this._terminal?.writeDebugLine('Getting loaded configuration');
    
    if (!this._config) {
      const errorMsg = "Configuration not loaded. Call loadConfig() first.";
      this._terminal?.writeErrorLine(errorMsg);
      throw new Error(errorMsg);
    }
    
    this._terminal?.writeDebugLine('Returning loaded configuration');
    return this._config;
  }

  /**
   * Get all command line entries
   */
  public getCommands(): ICommandLineEntry[] {
    this._terminal?.writeDebugLine('Getting all commands from configuration');
    const commands = this.getConfig().commands;
    this._terminal?.writeVerboseLine(`Returning ${commands.length} commands`);
    return commands;
  }

  /**
   * Get a specific command by name
   */
  public getCommand(name: string): ICommandLineEntry | undefined {
    this._terminal?.writeDebugLine(`Looking up command: ${name}`);
    const command = this.getCommands().find(cmd => cmd.name === name);
    
    if (command) {
      this._terminal?.writeVerboseLine(`Found command: ${name}`);
    } else {
      this._terminal?.writeWarningLine(`Command not found: ${name}`);
    }
    
    return command;
  }

  /**
   * Check if configuration is loaded
   */
  public isLoaded(): boolean {
    const loaded = this._config !== undefined;
    this._terminal?.writeDebugLine(`Configuration loaded status: ${loaded}`);
    return loaded;
  }

  /**
   * Set terminal for logging
   */
  public setTerminal(terminal: Terminal): void {
    this._terminal = terminal;
    this._terminal.writeDebugLine('Terminal reference updated in ConfigurationManager');
  }
}
