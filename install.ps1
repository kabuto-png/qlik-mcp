# Qlik MCP - Windows Install Script
# Works with Claude Code and Claude Desktop

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$McpServerPath = Join-Path $ScriptDir "dist\mcp-server\index.js"

Write-Host "=== Qlik MCP Installer (Windows) ===" -ForegroundColor Cyan

# 1. Install and build MCP server
Write-Host "[1/4] Building MCP server..." -ForegroundColor Yellow
Set-Location $ScriptDir
npm install --silent
npm run build

# 2. Build Chrome extension
Write-Host "[2/4] Building Chrome extension..." -ForegroundColor Yellow
Set-Location (Join-Path $ScriptDir "src\chrome-extension")
npm install --silent
npm run build

# 3. Configure Claude Desktop
Write-Host "[3/4] Configuring Claude Desktop..." -ForegroundColor Yellow
$ClaudeConfigDir = Join-Path $env:APPDATA "Claude"
$ClaudeConfigFile = Join-Path $ClaudeConfigDir "claude_desktop_config.json"

if (-not (Test-Path $ClaudeConfigDir)) {
    New-Item -ItemType Directory -Path $ClaudeConfigDir -Force | Out-Null
}

# Get full path to node.exe
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodePath) {
    Write-Host "ERROR: Node.js not found in PATH. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Use absolute paths (Windows paths need escaping in JSON)
$McpConfig = @{
    mcpServers = @{
        qlik = @{
            command = $NodePath
            args = @($McpServerPath)
        }
    }
}

if (Test-Path $ClaudeConfigFile) {
    # Backup and merge
    Copy-Item $ClaudeConfigFile "$ClaudeConfigFile.bak"
    $ExistingConfig = Get-Content $ClaudeConfigFile | ConvertFrom-Json -AsHashtable
    if (-not $ExistingConfig.mcpServers) {
        $ExistingConfig.mcpServers = @{}
    }
    $ExistingConfig.mcpServers.qlik = $McpConfig.mcpServers.qlik
    $ExistingConfig | ConvertTo-Json -Depth 10 | Set-Content $ClaudeConfigFile
} else {
    $McpConfig | ConvertTo-Json -Depth 10 | Set-Content $ClaudeConfigFile
}

# 4. Configure Claude Code (project .mcp.json)
Write-Host "[4/4] Configuring Claude Code..." -ForegroundColor Yellow
$McpConfig | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $ScriptDir ".mcp.json")

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Load Chrome extension from: $ScriptDir\src\chrome-extension\dist\"
Write-Host "   - Open chrome://extensions/"
Write-Host "   - Enable Developer mode"
Write-Host "   - Click 'Load unpacked' and select the dist folder"
Write-Host ""
Write-Host "2. Restart Claude Desktop"
Write-Host ""
Write-Host "3. Open Qlik Sense in Chrome and use /qlik commands"
