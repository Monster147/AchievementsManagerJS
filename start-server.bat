@echo off

:: Go to the folder where this .bat file is located
cd /d "%~dp0"

:: Rewrite the log file (creates it or clears it)
echo. > server.log

echo Starting the server...

:: Start the server and redirect stdout + stderr
npm start >> server.log 2>&1