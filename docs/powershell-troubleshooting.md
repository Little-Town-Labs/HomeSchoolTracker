# PowerShell Troubleshooting Guide

## PSReadLine Console Buffer Issues

### Problem Description

PowerShell 5.1 with PSReadLine 2.0.0 experiences console buffer exceptions when running interactive commands, particularly with tools like Netlify CLI.

### Error Symptoms

```
System.ArgumentOutOfRangeException: The value must be greater than or equal to zero and less than the console's buffer size in that dimension.
Parameter name: top
Actual value was X.
   at System.Console.SetCursorPosition(Int32 left, Int32 top)
   at Microsoft.PowerShell.PSConsoleReadLine.ReallyRender(RenderData renderData, String defaultColor)
```

### Environment Details

- **PowerShell Version**: 5.1.26100.4061
- **PSReadLine Version**: 2.0.0
- **OS**: Microsoft Windows 10.0.26100

## Solutions

### 1. Immediate Workarounds

```powershell
# Disable PSReadLine for current session
Remove-Module PSReadLine -Force

# Use cmd for problematic commands
cmd /c "netlify env:set VARIABLE_NAME value"

# Use echo for automatic responses
echo y | netlify command
```

### 2. Permanent Fixes

```powershell
# Update PSReadLine to latest version
Install-Module PSReadLine -Force -SkipPublisherCheck

# Check current version
Get-Module PSReadLine -ListAvailable
```

### 3. Alternative Shells

- **Command Prompt (cmd)**: Most reliable for CLI tools
- **Git Bash**: Good alternative if installed
- **Windows Terminal**: Try different profiles
- **PowerShell 7**: Consider upgrading from PowerShell 5.1

## Best Practices for Development

### For CLI Tools

1. **Test in cmd first** for interactive commands
2. **Use non-interactive flags** when possible (`--force`, `--yes`)
3. **Pipe responses** for automatic confirmation (`echo y |`)
4. **Use web interfaces** as fallback for critical operations

### For Netlify Specifically

- **Environment variables**: Use web interface for secrets
- **Deployments**: CLI works fine for non-interactive commands
- **Site linking**: Usually works, but may need cmd

### For Other Tools

- **npm/yarn**: Generally work fine
- **git**: Works well in PowerShell
- **docker**: May have similar issues with interactive prompts

## Prevention

1. **Keep PSReadLine updated**
2. **Consider PowerShell 7** for new projects
3. **Have cmd/Git Bash ready** as alternatives
4. **Document workarounds** for team members

## Related Issues

- GitHub Issue: https://github.com/PowerShell/PSReadLine/issues
- Common with: Netlify CLI, some npm packages, interactive Docker commands
- Windows-specific: Not seen on macOS/Linux

## Testing Commands

```powershell
# Test PSReadLine functionality
Get-PSReadLineOption

# Test console buffer
$Host.UI.RawUI.BufferSize
$Host.UI.RawUI.WindowSize

# Check PowerShell version
$PSVersionTable
```
