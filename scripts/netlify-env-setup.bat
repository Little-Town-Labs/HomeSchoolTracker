@echo off
REM Netlify Environment Variables Setup (Windows Batch)
REM This script avoids PowerShell PSReadLine issues

echo Setting up Netlify environment variables...
echo.

REM Check if netlify CLI is available
netlify --version >nul 2>&1
if errorlevel 1 (
    echo Error: Netlify CLI not found. Please install it first:
    echo npm install -g netlify-cli
    pause
    exit /b 1
)

REM Check if site is linked
netlify status >nul 2>&1
if errorlevel 1 (
    echo Error: Site not linked. Run 'netlify link' first.
    pause
    exit /b 1
)

echo Marking sensitive variables as secrets...
echo.

REM Note: The --secret flag may not work in older CLI versions
REM In that case, use the web interface at https://app.netlify.com

echo Attempting to mark PAYPAL_CLIENT_SECRET as secret...
echo y | netlify env:set PAYPAL_CLIENT_SECRET %PAYPAL_CLIENT_SECRET% --secret

echo Attempting to mark VITE_PAYPAL_SECRET as secret...
echo y | netlify env:set VITE_PAYPAL_SECRET %VITE_PAYPAL_SECRET% --secret

echo Attempting to mark VITE_RESEND_API_KEY as secret...
echo y | netlify env:set VITE_RESEND_API_KEY %VITE_RESEND_API_KEY% --secret

echo.
echo Setup complete! 
echo.
echo If the --secret flag didn't work, please manually mark these as secrets in:
echo https://app.netlify.com/projects/homeschooltracker
echo.
pause 