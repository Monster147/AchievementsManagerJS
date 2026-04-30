@echo off
cd /d "C:\Project\1stVersionInJS"

:: Rewrite the log file (creates it or clears it)
echo. > server.log

echo Starting the server...
:: Start the server and redirect both stdout and stderr to the log file
npm start >> server.log 2>&1