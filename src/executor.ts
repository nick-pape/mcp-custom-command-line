import { Executable } from "@rushstack/node-core-library";
import { Terminal } from "@rushstack/terminal";
import { ICommandLineEntry, ICommandArgument } from "./schema.js";

/**
 * Interface for command execution result
 */
export interface ICommandExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Interface for command execution parameters
 */
export interface ICommandExecutionParams {
  [argumentName: string]: string | number | boolean;
}

/**
 * Command executor that handles running command line tools
 */
export class CommandExecutor {
  private _terminal?: Terminal;

  public constructor(terminal?: Terminal) {
    this._terminal = terminal;
    this._terminal?.writeDebugLine('CommandExecutor initialized');
  }

  /**
   * Execute a command with the provided parameters
   */
  public async executeCommand(
    command: ICommandLineEntry,
    params: ICommandExecutionParams = {}
  ): Promise<ICommandExecutionResult> {
    this._terminal?.writeVerboseLine(`Starting execution of command: ${command.name}`);
    this._terminal?.writeDebugLine(`Command definition: ${JSON.stringify(command, null, 2)}`);
    this._terminal?.writeDebugLine(`Parameters: ${JSON.stringify(params, null, 2)}`);
    
    try {
      // Build the command arguments
      this._terminal?.writeDebugLine('Building command arguments');
      const args: string[] = this._buildCommandArguments(command, params);
      this._terminal?.writeVerboseLine(`Built arguments: [${args.join(', ')}]`);
      
      // Parse the command to get the executable and initial args
      this._terminal?.writeDebugLine(`Parsing command string: ${command.command}`);
      const commandParts: string[] = command.command.split(' ');
      const executable: string = commandParts[0];
      const baseArgs: string[] = commandParts.slice(1);
      
      this._terminal?.writeVerboseLine(`Executable: ${executable}`);
      this._terminal?.writeDebugLine(`Base arguments: [${baseArgs.join(', ')}]`);
      
      // Combine base args with dynamic args
      const allArgs: string[] = [...baseArgs, ...args];
      this._terminal?.writeVerboseLine(`Final command: ${executable} ${allArgs.join(' ')}`);
      
      // Execute the command
      this._terminal?.writeVerboseLine('Executing command via Executable.spawnSync');
      const startTime = Date.now();
      
      const result = Executable.spawnSync(executable, allArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const executionTime = Date.now() - startTime;
      this._terminal?.writeVerboseLine(`Command execution completed in ${executionTime}ms`);
      
      const success = result.status === 0;
      const stdout = result.stdout || '';
      const stderr = result.stderr || '';
      const exitCode = result.status || 0;
      
      this._terminal?.writeDebugLine(`Exit code: ${exitCode}`);
      this._terminal?.writeDebugLine(`STDOUT length: ${stdout.length} characters`);
      this._terminal?.writeDebugLine(`STDERR length: ${stderr.length} characters`);
      
      if (success) {
        this._terminal?.writeVerboseLine(`Command '${command.name}' executed successfully`);
        if (stdout.trim()) {
          this._terminal?.writeDebugLine(`STDOUT: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`);
        }
      } else {
        this._terminal?.writeWarningLine(`Command '${command.name}' failed with exit code ${exitCode}`);
        if (stderr.trim()) {
          this._terminal?.writeDebugLine(`STDERR: ${stderr.substring(0, 200)}${stderr.length > 200 ? '...' : ''}`);
        }
      }
      
      return {
        success,
        stdout,
        stderr,
        exitCode
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this._terminal?.writeErrorLine(`Command execution failed: ${errorMsg}`);
      
      return {
        success: false,
        stdout: '',
        stderr: errorMsg,
        exitCode: -1
      };
    }
  }

  /**
   * Validate command parameters against the command definition
   */
  public validateParameters(command: ICommandLineEntry, params: ICommandExecutionParams): string[] {
    this._terminal?.writeDebugLine(`Validating parameters for command: ${command.name}`);
    
    const errors: string[] = [];
    
    // Check required arguments
    this._terminal?.writeDebugLine('Checking required arguments');
    for (const arg of command.arguments) {
      if (arg.required && !(arg.name in params)) {
        const error = `Required argument '${arg.name}' is missing`;
        errors.push(error);
        this._terminal?.writeWarningLine(error);
      }
    }
    
    // Check argument types
    this._terminal?.writeDebugLine('Validating argument types');
    for (const [paramName, paramValue] of Object.entries(params)) {
      const argDef: ICommandArgument | undefined = command.arguments.find((a: ICommandArgument) => a.name === paramName);
      if (argDef) {
        const typeError: string | undefined = this._validateArgumentType(argDef, paramValue as string | number | boolean);
        if (typeError) {
          errors.push(typeError);
          this._terminal?.writeWarningLine(typeError);
        }
      } else {
        this._terminal?.writeWarningLine(`Unknown parameter provided: ${paramName}`);
      }
    }
    
    if (errors.length === 0) {
      this._terminal?.writeVerboseLine('Parameter validation passed');
    } else {
      this._terminal?.writeWarningLine(`Parameter validation failed with ${errors.length} errors`);
    }
    
    return errors;
  }

  /**
   * Build command line arguments from parameters
   */
  private _buildCommandArguments(command: ICommandLineEntry, params: ICommandExecutionParams): string[] {
    this._terminal?.writeDebugLine('Building command line arguments from parameters');
    
    const args: string[] = [];
    
    for (const argDef of command.arguments) {
      let value: string | number | boolean | undefined = params[argDef.name];
      
      // Use default value if not provided
      if (value === undefined && argDef.defaultValue !== undefined) {
        value = argDef.defaultValue;
        this._terminal?.writeDebugLine(`Using default value for '${argDef.name}': ${value}`);
      }
      
      // Skip if no value and not required
      if (value === undefined) {
        this._terminal?.writeDebugLine(`Skipping undefined argument: ${argDef.name}`);
        continue;
      }
      
      // Add the argument (for now, just add as --name value format)
      this._terminal?.writeDebugLine(`Adding argument: --${argDef.name} ${value}`);
      args.push(`--${argDef.name}`);
      args.push(String(value));
    }
    
    this._terminal?.writeDebugLine(`Built ${args.length / 2} argument pairs`);
    return args;
  }

  /**
   * Validate argument type
   */
  private _validateArgumentType(argDef: ICommandArgument, value: string | number | boolean): string | undefined {
    this._terminal?.writeDebugLine(`Validating argument '${argDef.name}' of type '${argDef.type}' with value: ${value}`);
    
    switch (argDef.type) {
      case 'string':
        if (typeof value !== 'string') {
          const error = `Argument '${argDef.name}' must be a string`;
          this._terminal?.writeDebugLine(`Type validation failed: ${error}`);
          return error;
        }
        break;
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          const error = `Argument '${argDef.name}' must be a number`;
          this._terminal?.writeDebugLine(`Type validation failed: ${error}`);
          return error;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          const error = `Argument '${argDef.name}' must be a boolean`;
          this._terminal?.writeDebugLine(`Type validation failed: ${error}`);
          return error;
        }
        break;
    }
    
    this._terminal?.writeDebugLine(`Type validation passed for argument '${argDef.name}'`);
    return undefined;
  }

  /**
   * Set terminal for logging
   */
  public setTerminal(terminal: Terminal): void {
    this._terminal = terminal;
    this._terminal.writeDebugLine('Terminal reference updated in CommandExecutor');
  }
}
