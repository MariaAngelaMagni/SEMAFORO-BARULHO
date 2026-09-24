@echo off
cd /d "%~dp0"
echo ================================================
echo     SEMAFORO DO BARULHO - SERVIDOR LOCAL
echo ================================================
echo.
echo Abra no navegador: http://localhost:8000
 echo.
python -m http.server 8000
pause
