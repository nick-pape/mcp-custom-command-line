# MCP CLI Server 🚀

A powerful **Model Context Protocol (MCP) server** that enables AI assistants to execute command-line tools through a flexible, configuration-driven interface. Turn any command-line utility into an AI-accessible tool with simple JSON configuration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- **🔧 Configuration-Driven**: Define commands via JSON configuration files
- **🛡️ Type-Safe**: Built with TypeScript and comprehensive validation using Zod and AJV
- **📋 Flexible Arguments**: Support for string, number, and boolean arguments with defaults
- **🔍 Debug Support**: Comprehensive logging with debug and verbose modes
- **⚡ Fast & Reliable**: Built on the official MCP SDK with robust error handling
- **🌐 Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g mcp-cli
```

### Basic Usage

1. **Create a configuration file** (`config.json`):

```json
{
  "version": "1.0",
  "commands": [
    {
      "name": "echo",
      "description": "Echo a message to the console",
      "command": "echo",
      "arguments": [
        {
          "name": "message",
          "description": "The message to echo",
          "type": "string",
          "required": true
        }
      ]
    },
    {
      "name": "list-files",
      "description": "List files in a directory",
      "command": "dir",
      "arguments": [
        {
          "name": "path",
          "description": "The directory path to list",
          "type": "string",
          "required": false,
          "defaultValue": "."
        }
      ]
    }
  ]
}
```

2. **Run the MCP server**:

```bash
# Using config file
mcp-cli --config-file ./config.json

# Using inline JSON config
mcp-cli --config '{"version":"1.0","commands":[...]}'

# With environment variable (config file path)
set MCP_CLI_CONFIG_PATH=./config.json
mcp-cli

# With environment variable (raw JSON config)
set MCP_CLI_CONFIG_JSON={"version":"1.0","commands":[{"name":"echo","description":"Echo a message","command":"echo","arguments":[{"name":"message","description":"The message to echo","type":"string","required":true}]}]}
mcp-cli

# Streaming config via pipe (Windows)
type config.json | mcp-cli

# Streaming config via pipe (Unix/Linux/macOS)
cat config.json | mcp-cli
```

3. **Connect your AI assistant** to the MCP server and start executing commands!

## 📖 Configuration Reference

### Configuration File Structure

```json
{
  "version": "1.0",
  "commands": [
    {
      "name": "command-name",
      "description": "Description of what this command does",
      "command": "actual-cli-command",
      "arguments": [
        {
          "name": "arg-name",
          "description": "Argument description",
          "type": "string|number|boolean",
          "required": true|false,
          "defaultValue": "optional-default"
        }
      ]
    }
  ]
}
```

### Command Arguments

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | ✅ | Argument name |
| `description` | string | ✅ | Human-readable description |
| `type` | `"string"` \| `"number"` \| `"boolean"` | ✅ | Argument data type |
| `required` | boolean | ✅ | Whether the argument is mandatory |
| `defaultValue` | string \| number \| boolean | ❌ | Default value if not provided |

## 🤝 Contributing

Interested in contributing? Check out our [Contributing Guide](CONTRIBUTING.md) for development setup, build instructions, and guidelines.

## � License

### Git Commands

```json
{
  "version": "1.0",
  "commands": [
    {
      "name": "git-status",
      "description": "Check Git repository status",
      "command": "git status",
      "arguments": []
    },
    {
      "name": "git-commit",
      "description": "Commit changes with a message",
      "command": "git commit",
      "arguments": [
        {
          "name": "message",
          "description": "Commit message",
          "type": "string",
          "required": true
        },
        {
          "name": "all",
          "description": "Stage all changes",
          "type": "boolean",
          "required": false,
          "defaultValue": false
        }
      ]
    }
  ]
}
```

### System Information

```json
{
  "version": "1.0",
  "commands": [
    {
      "name": "system-info",
      "description": "Display system information",
      "command": "systeminfo",
      "arguments": []
    },
    {
      "name": "disk-usage",
      "description": "Show disk usage",
      "command": "dir",
      "arguments": [
        {
          "name": "drive",
          "description": "Drive letter to check",
          "type": "string",
          "required": false,
          "defaultValue": "C:\\"
        }
      ]
    }
  ]
}
```

## 🤝 Contributing

Interested in contributing? Check out our [Contributing Guide](CONTRIBUTING.md) for development setup, build instructions, and guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Powered by [Rush Stack](https://rushstack.io/) tools
- Validation provided by [Zod](https://zod.dev/) and [AJV](https://ajv.js.org/)

## 📚 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official TypeScript SDK
- [Claude Desktop](https://claude.ai/desktop) - AI assistant with MCP support

---

**Made with ❤️ for the AI community**