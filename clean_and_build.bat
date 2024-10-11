@echo off
echo Starting cleanup and build process...

echo Removing old files and directories...
if exist out rmdir /s /q out
if exist node_modules rmdir /s /q node_modules
if exist claude-code-clipboard*.vsix del /q claude-code-clipboard*.vsix
if exist package-lock.json del /q package-lock.json

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: npm install failed
    exit /b %errorlevel%
)

echo Compiling the project...
call npm run compile
if %errorlevel% neq 0 (
    echo Error: npm run compile failed
    exit /b %errorlevel%
)

echo Packaging the extension...
call vsce package
if %errorlevel% neq 0 (
    echo Error: vsce package failed
    exit /b %errorlevel%
)

echo Cleanup and build process completed successfully.