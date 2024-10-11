@echo off
echo Starting cleanup and build process...

echo Removing old files and directories...
if exist out rmdir /s /q out
if exist node_modules rmdir /s /q node_modules
if exist claude-code-clipboard*.vsix del /q claude-code-clipboard*.vsix
if exist package-lock.json del /q package-lock.json


echo Cleanup process completed successfully.