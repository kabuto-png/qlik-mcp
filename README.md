# Qlik MCP

MCP (Model Context Protocol) server that enables Claude to control Qlik Sense applications through a Chrome extension bridge.

## Architecture

```
┌─────────────────┐     stdio      ┌─────────────────┐     WebSocket     ┌─────────────────┐
│   Claude MCP    │ ◄───────────► │  Qlik MCP Server │ ◄────────────────► │ Chrome Extension│
│   (claude.ai)   │               │   (Node.js)      │                    │   (in browser)  │
└─────────────────┘               └─────────────────┘                    └────────┬────────┘
                                                                                  │
                                                                                  ▼
                                                                         ┌─────────────────┐
                                                                         │   Qlik Sense    │
                                                                         │   (Web/Cloud)   │
                                                                         └─────────────────┘
```

## Features

- **38 MCP tools** for comprehensive Qlik Sense control
- Data model exploration, QC/validation, and advanced analysis
- Works with Qlik Sense Enterprise and Cloud

### Available MCP Tools (38)

| Category | Count | Tools |
|----------|-------|-------|
| **Connection** | 4 | `qlik_status`, `qlik_list_apps`, `qlik_open_app`, `qlik_close_app` |
| **Navigation** | 3 | `qlik_get_sheets`, `qlik_go_to_sheet`, `qlik_get_objects` |
| **Selection** | 8 | `qlik_get_selections`, `qlik_select`, `qlik_clear_field`, `qlik_clear_all`, `qlik_lock_field`, `qlik_unlock_field`, `qlik_forward`, `qlik_back` |
| **Data** | 5 | `qlik_get_field_values`, `qlik_get_data`, `qlik_evaluate`, `qlik_get_variables`, `qlik_set_variable` |
| **Bookmarks** | 3 | `qlik_get_bookmarks`, `qlik_apply_bookmark`, `qlik_create_bookmark` |
| **Export** | 2 | `qlik_export`, `qlik_screenshot` |
| **QC / Validation** | 7 | `qlik_verify_value`, `qlik_compare`, `qlik_count_nulls`, `qlik_validate_sum`, `qlik_search`, `qlik_distinct_count`, `qlik_field_stats` |
| **Data Model** | 8 | `qlik_get_fields`, `qlik_get_tables`, `qlik_get_associations`, `qlik_get_table_schema`, `qlik_get_measures`, `qlik_get_dimensions`, `qlik_get_object_props`, `qlik_get_script` |
| **Analysis** | 7 | `qlik_top_n`, `qlik_crosstab`, `qlik_detect_duplicates`, `qlik_find_outliers`, `qlik_select_by_expression`, `qlik_search_select`, `qlik_rank` |

## Installation

### Quick Install (Recommended)

**Linux/macOS:**
```bash
cd /path/to/qlik-mcp
./install.sh
```

**Windows (PowerShell):**
```powershell
cd C:\path\to\qlik-mcp
.\install.ps1
```

This will:
- Build MCP server and Chrome extension
- Configure Claude Desktop automatically
- Configure Claude Code (`.mcp.json`)

### Manual Installation

#### 1. Install MCP Server

```bash
cd /path/to/qlik-mcp
npm install
npm run build
```

#### 2. Install Chrome Extension

```bash
cd src/chrome-extension
npm install
npm run build
```

Then load in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `src/chrome-extension/dist` directory

### 3. Configure Claude Desktop

Add to your Claude Desktop config:

| Platform | Config Path |
|----------|-------------|
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "qlik": {
      "command": "node",
      "args": ["/path/to/qlik-mcp/dist/mcp-server/index.js"]
    }
  }
}
```

**Note:** On Windows, use forward slashes or escaped backslashes in the path:
```json
"args": ["C:/Users/you/qlik-mcp/dist/mcp-server/index.js"]
```

For Claude Code, add to `.mcp.json` in project root (created by install script).

### Claude Desktop vs Claude Code

| Feature | Claude Desktop | Claude Code |
|---------|---------------|-------------|
| MCP Tools (38) | Yes | Yes |
| Skills (`/qlik`, `/qlik-analyze`) | No | Yes |
| Best for | Quick queries | Power users, automation |

**Note:** Skills (slash commands) only work in Claude Code CLI/IDE extensions. Claude Desktop users can use all 38 MCP tools directly by asking Claude to interact with Qlik.

### Windows Troubleshooting

If MCP doesn't connect on Windows:

1. **Check Node.js is installed:** Run `node --version` in PowerShell
2. **Restart Claude Desktop** after running `install.ps1`
3. **Check config file:** Open `%APPDATA%\Claude\claude_desktop_config.json` and verify paths are correct
4. **Use absolute paths:** If issues persist, manually edit the config to use full path to `node.exe`:
   ```json
   {
     "mcpServers": {
       "qlik": {
         "command": "C:\\Program Files\\nodejs\\node.exe",
         "args": ["C:\\path\\to\\qlik-mcp\\dist\\mcp-server\\index.js"]
       }
     }
   }
   ```

## Usage

### Quick Start

1. **Open Qlik Sense** in Chrome (with extension installed)
2. **Open an app** and navigate to a sheet
3. **Check extension status** - click extension icon, should show "Connected"
4. **Start Claude Desktop** or use Claude Code
5. **Ask Claude** to interact with Qlik

### Workflow Examples

**Dashboard Review:**
```
"What sheets are in this app?"
"Show me all fields in the data model"
"What are the top 10 customers by revenue?"
"Check data quality for the Email field"
```

**Data Analysis:**
```
"Select Year = 2024 and show total sales"
"Compare sales between Q1 and Q2"
"Find duplicate Order IDs"
"Show statistics for the Amount field"
```

**Data Exploration:**
```
"What values are in the Region field?"
"Evaluate Sum(Sales) / Sum(Target)"
"Show me a crosstab of Region vs Product Category"
"Get the load script for this app"
```

**Filter & Navigate:**
```
"Clear all selections"
"Select Country = 'USA' and State = 'California'"
"Go to the Sales Overview sheet"
"Apply the 'Monthly Report' bookmark"
```

## Development

### MCP Server

```bash
# Watch mode
npm run dev

# Build
npm run build
```

### Chrome Extension

```bash
cd src/chrome-extension

# Watch mode
npm run watch

# Build
npm run build
```

### Debug Mode

Run with `--debug` flag to see detailed logs:

```bash
node dist/mcp-server/index.js --debug --port=9876
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `--port` | 9876 | WebSocket bridge port |
| `--debug` | false | Enable debug logging |

## Troubleshooting

### Extension not connecting
- Ensure the MCP server is running
- Check the WebSocket URL in extension popup (default: `ws://localhost:9876`)
- Look for errors in Chrome DevTools console

### Qlik APIs not available
- Make sure you're on a Qlik Sense page
- Wait for the page to fully load
- Check that Qlik Capability APIs are exposed (standard in Qlik Sense)

### Tool errors
- Ensure an app is open before using most tools
- Check field names match exactly (case-sensitive)
- Verify object IDs by using `qlik_get_objects`

## License

MIT
