@echo off
REM Quick Start Script for Certificate Automation Tool

echo ========================================
echo Certificate Automation Tool - Quick Start
echo ========================================
echo.

:menu
echo Please select an option:
echo.
echo 1. Run DRY-RUN (generate certificates without sending emails)
echo 2. Run TEST MODE (send all certificates to admin email)
echo 3. Run PRODUCTION (send certificates to all participants)
echo 4. View logs
echo 5. Open output folder
echo 6. Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto dryrun
if "%choice%"=="2" goto test
if "%choice%"=="3" goto production
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto output
if "%choice%"=="6" goto end

echo Invalid choice. Please try again.
echo.
goto menu

:dryrun
echo.
echo Running in DRY-RUN mode...
echo (Certificates will be generated but NOT emailed)
echo.
call npm run dry-run
pause
goto menu

:test
echo.
echo Running in TEST mode...
echo (All certificates will be sent to ADMIN_EMAIL only)
echo.
call npm run test
pause
goto menu

:production
echo.
echo ========================================
echo WARNING: PRODUCTION MODE
echo ========================================
echo This will send emails to ALL participants!
echo Make sure you have:
echo   1. Configured EMAIL_USER and EMAIL_PASSWORD in .env
echo   2. Updated participants.xlsx with real data
echo   3. Tested with dry-run or test mode first
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "

if /i "%confirm%"=="yes" (
    echo.
    echo Running in PRODUCTION mode...
    call npm start
    pause
) else (
    echo.
    echo Production run cancelled.
    pause
)
goto menu

:logs
echo.
echo Opening logs folder...
start logs
goto menu

:output
echo.
echo Opening output folder...
start output\generated-certificates
goto menu

:end
echo.
echo Goodbye!
exit
