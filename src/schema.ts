import Ajv from "ajv";
import { FileSystem } from "@rushstack/node-core-library";
import { Terminal } from "@rushstack/terminal";
import * as path from "path";

/**
 * Interface for command argument definition
 */
export interface ICommandArgument {
  name: string;
  description: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  defaultValue?: string | number | boolean;
}

/**
 * Interface for command line entry definition
 */
export interface ICommandLineEntry {
  name: string;
  description: string;
  command: string;
  arguments: ICommandArgument[];
}

/**
 * Interface for the entire configuration file
 */
export interface IConfig {
  version: string;
  commands: ICommandLineEntry[];
}

/**
 * Schema validator instance
 */
let validator: Ajv | undefined;

/**
 * Get or create the schema validator
 */
function getValidator(terminal?: Terminal): Ajv {
  if (!validator) {
    terminal?.writeVerboseLine('Creating new AJV schema validator instance');
    validator = new Ajv();
    terminal?.writeDebugLine('AJV validator instance created successfully');
  }
  return validator;
}

/**
 * Load and parse the JSON schema
 */
function getSchema(terminal?: Terminal): object {
  const schemaPath: string = path.join(__dirname, "config-schema.json");
  
  terminal?.writeVerboseLine(`Loading schema from: ${schemaPath}`);
  
  if (!FileSystem.exists(schemaPath)) {
    const errorMsg = `Schema file not found: ${schemaPath}`;
    terminal?.writeErrorLine(errorMsg);
    throw new Error(errorMsg);
  }
  
  try {
    const schemaContent: string = FileSystem.readFile(schemaPath);
    terminal?.writeDebugLine(`Schema file read successfully, content length: ${schemaContent.length} characters`);
    
    const parsedSchema = JSON.parse(schemaContent);
    terminal?.writeVerboseLine('Schema parsed successfully');
    return parsedSchema;
  } catch (error) {
    const errorMsg = `Failed to parse schema file: ${error instanceof Error ? error.message : String(error)}`;
    terminal?.writeErrorLine(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Validate configuration data against the schema
 */
export function validateConfig(data: unknown, terminal?: Terminal): IConfig {
  terminal?.writeVerboseLine('Starting configuration validation');
  
  try {
    const schema: object = getSchema(terminal);
    const ajv: Ajv = getValidator(terminal);
    
    terminal?.writeDebugLine('Compiling validation schema');
    const validate = ajv.compile(schema);
    
    terminal?.writeVerboseLine('Validating configuration data against schema');
    const isValid: boolean = validate(data);
    
    if (!isValid) {
      const errorMessages: string[] = (validate.errors || []).map((error) => 
        `${error.instancePath}: ${error.message}`
      );
      const errorMsg = `Configuration validation failed: ${errorMessages.join(', ')}`;
      terminal?.writeErrorLine(errorMsg);
      terminal?.writeDebugLine(`Validation errors: ${JSON.stringify(validate.errors, null, 2)}`);
      throw new Error(errorMsg);
    }
    
    terminal?.writeVerboseLine('Configuration validation completed successfully');
    return data as IConfig;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Configuration validation failed')) {
      throw error; // Re-throw validation errors as-is
    }
    const errorMsg = `Schema validation process failed: ${error instanceof Error ? error.message : String(error)}`;
    terminal?.writeErrorLine(errorMsg);
    throw new Error(errorMsg);
  }
}
