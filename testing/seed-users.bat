@echo off
echo HomeSchool Tracker - Test User Seeding
echo ========================================

REM Check if service role key is provided as argument
if "%1"=="" (
    echo.
    echo ❌ Missing Supabase Service Role Key
    echo.
    echo Usage: seed-users.bat YOUR_SERVICE_ROLE_KEY
    echo.
    echo Get your service role key from:
    echo Supabase Dashboard → Settings → API → Service Role Key
    echo.
    pause
    exit /b 1
)

echo Setting environment variables...
set SUPABASE_SERVICE_ROLE_KEY=%1

echo Running user seeding script...
node testing/seed-users.js

echo.
echo Script completed. Check output above for results.
pause 