# /qlik - Qlik Sense Control via MCP

Control Qlik Sense applications through Claude using MCP tools.

## Usage

```
/qlik                    # Check connection status
/qlik apps               # List available apps
/qlik open <app_id>      # Open an app
/qlik sheets             # List sheets in current app
/qlik select <field> <values>  # Make selections
/qlik data <object_id>   # Get data from visualization
/qlik eval <expression>  # Evaluate Qlik expression
```

## Prerequisites

1. Chrome extension installed and connected
2. Qlik Sense page open in browser
3. MCP server running (auto-started by Claude)

## Instructions

<qlik-control>

You are controlling Qlik Sense via MCP tools. Parse the user's command and execute appropriate tools.

### Command Parsing

| Command | Action |
|---------|--------|
| `/qlik` or `/qlik status` | Call `qlik_status` |
| `/qlik apps` | Call `qlik_list_apps` |
| `/qlik open <id>` | Call `qlik_open_app` with app_id |
| `/qlik sheets` | Call `qlik_get_sheets` |
| `/qlik objects` | Call `qlik_get_objects` |
| `/qlik go <sheet_id>` | Call `qlik_go_to_sheet` |
| `/qlik select <field> <val1,val2,...>` | Call `qlik_select` |
| `/qlik clear [field]` | Call `qlik_clear_field` or `qlik_clear_all` |
| `/qlik data <object_id>` | Call `qlik_get_data` |
| `/qlik eval <expression>` | Call `qlik_evaluate` |
| `/qlik values <field>` | Call `qlik_get_field_values` |
| `/qlik bookmarks` | Call `qlik_get_bookmarks` |
| `/qlik bookmark <id>` | Call `qlik_apply_bookmark` |
| `/qlik vars` | Call `qlik_get_variables` |
| `/qlik setvar <name> <value>` | Call `qlik_set_variable` |
| `/qlik export <object_id> <format>` | Call `qlik_export` |
| `/qlik screenshot [object_id]` | Call `qlik_screenshot` |

### Available MCP Tools

- `qlik_status` - Connection status
- `qlik_list_apps` - List apps
- `qlik_open_app` - Open app by ID
- `qlik_close_app` - Close current app
- `qlik_get_sheets` - List sheets
- `qlik_go_to_sheet` - Navigate to sheet
- `qlik_get_objects` - List objects on sheet
- `qlik_get_selections` - Current selections
- `qlik_select` - Select values in field
- `qlik_clear_field` - Clear field selections
- `qlik_clear_all` - Clear all selections
- `qlik_lock_field` - Lock field
- `qlik_unlock_field` - Unlock field
- `qlik_forward` - Forward in history
- `qlik_back` - Back in history
- `qlik_get_field_values` - Get field values
- `qlik_get_data` - Get hypercube data
- `qlik_evaluate` - Evaluate expression
- `qlik_get_variables` - List variables
- `qlik_set_variable` - Set variable
- `qlik_get_bookmarks` - List bookmarks
- `qlik_apply_bookmark` - Apply bookmark
- `qlik_create_bookmark` - Create bookmark
- `qlik_export` - Export data
- `qlik_screenshot` - Take screenshot

### Workflow

1. Always check `qlik_status` first if unsure about connection
2. Use `qlik_list_apps` to find app IDs
3. Open app with `qlik_open_app` before other operations
4. Use `qlik_get_sheets` and `qlik_get_objects` to discover IDs
5. Format data results as markdown tables when possible

### Error Handling

- If "Chrome extension not connected": Ask user to open Qlik page with extension
- If "No Qlik app is open": Use `qlik_open_app` first
- If field/object not found: Use `qlik_get_objects` to verify IDs

</qlik-control>
