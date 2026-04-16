#!/bin/bash
# Qlik MCP - Auto Install Script
# Works with Claude Code and Claude Desktop on Linux/macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_SERVER_PATH="$SCRIPT_DIR/dist/mcp-server/index.js"

echo "=== Qlik MCP Installer ==="

# Detect OS
OS="$(uname -s)"
case "$OS" in
  Linux*)  PLATFORM="linux" ;;
  Darwin*) PLATFORM="macos" ;;
  *)       echo "Unsupported OS: $OS (use install.ps1 for Windows)"; exit 1 ;;
esac
echo "Detected platform: $PLATFORM"

# 1. Install and build MCP server
echo "[1/4] Building MCP server..."
cd "$SCRIPT_DIR"
npm install --silent
npm run build

# 2. Build Chrome extension
echo "[2/4] Building Chrome extension..."
cd "$SCRIPT_DIR/src/chrome-extension"
npm install --silent
npm run build

# 3. Configure Claude Desktop
echo "[3/4] Configuring Claude Desktop..."
if [ "$PLATFORM" = "macos" ]; then
  CLAUDE_DESKTOP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
else
  CLAUDE_DESKTOP_CONFIG="$HOME/.config/claude/claude_desktop_config.json"
fi
mkdir -p "$(dirname "$CLAUDE_DESKTOP_CONFIG")"

if [ -f "$CLAUDE_DESKTOP_CONFIG" ]; then
  # Backup existing config
  cp "$CLAUDE_DESKTOP_CONFIG" "$CLAUDE_DESKTOP_CONFIG.bak"

  # Add qlik server using jq if available, otherwise manual
  if command -v jq &> /dev/null; then
    jq --arg path "$MCP_SERVER_PATH" '.mcpServers.qlik = {command: "node", args: [$path, "--debug"]}' \
      "$CLAUDE_DESKTOP_CONFIG.bak" > "$CLAUDE_DESKTOP_CONFIG"
  else
    echo "  Warning: jq not installed, please manually add qlik to claude_desktop_config.json"
  fi
else
  # Create new config
  cat > "$CLAUDE_DESKTOP_CONFIG" << EOF
{
  "mcpServers": {
    "qlik": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH", "--debug"]
    }
  }
}
EOF
fi

# 4. Configure Claude Code (project .mcp.json)
echo "[4/4] Configuring Claude Code..."
cat > "$SCRIPT_DIR/.mcp.json" << EOF
{
  "mcpServers": {
    "qlik": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH", "--debug"]
    }
  }
}
EOF

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Next steps:"
echo "1. Load Chrome extension from: $SCRIPT_DIR/src/chrome-extension/dist/"
echo "   - Open chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked' and select the dist folder"
echo ""
echo "2. Restart Claude Desktop or Claude Code"
echo ""
echo "3. Open Qlik Sense in Chrome and use /qlik commands"
echo ""
