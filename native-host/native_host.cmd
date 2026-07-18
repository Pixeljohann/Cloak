@echo off
setlocal
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
  echo Node.js was not found at %NODE_EXE%. > "%~dp0native_host.log"
  exit /b 1
)
"%NODE_EXE%" "%~dp0native_host.cjs"
