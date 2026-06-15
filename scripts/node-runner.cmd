@echo off
setlocal

set "PORTABLE_NODE=%TEMP%\powerpicks-node\node-v24.14.0-win-x64\node.exe"

if exist "%PORTABLE_NODE%" (
  "%PORTABLE_NODE%" %*
) else (
  node %*
)

exit /b %ERRORLEVEL%
