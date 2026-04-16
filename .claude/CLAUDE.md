# Qlik MCP Project

## Available Skills

| Skill | Description |
|-------|-------------|
| `/qlik` | Control Qlik Sense - status, apps, sheets, selections, data |
| `/qlik-analyze` | Analyze data from Qlik visualizations |
| `/qlik-report` | Generate formatted reports from Qlik data |

## MCP Tools

This project provides MCP tools for Qlik Sense control:

- **Connection**: `qlik_status`, `qlik_list_apps`, `qlik_open_app`, `qlik_close_app`
- **Navigation**: `qlik_get_sheets`, `qlik_go_to_sheet`, `qlik_get_objects`
- **Selection**: `qlik_select`, `qlik_clear_field`, `qlik_clear_all`, `qlik_lock_field`, `qlik_unlock_field`
- **Data**: `qlik_get_data`, `qlik_evaluate`, `qlik_get_field_values`, `qlik_get_variables`
- **Bookmarks**: `qlik_get_bookmarks`, `qlik_apply_bookmark`, `qlik_create_bookmark`
- **Export**: `qlik_export`, `qlik_screenshot`

## Quick Start

1. Load Chrome extension from `src/chrome-extension/dist/`
2. Open Qlik Sense in Chrome
3. Use `/qlik status` to verify connection
4. Use `/qlik apps` to list available apps
5. Use `/qlik open <app_id>` to open an app

## Development

```bash
# MCP Server
npm run dev      # Watch mode
npm run build    # Build

# Chrome Extension
cd src/chrome-extension
npm run watch    # Watch mode
npm run build    # Build
```
