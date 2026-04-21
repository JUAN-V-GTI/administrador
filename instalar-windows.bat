@echo off
chcp 65001 >nul
title VoxAssistant - Instalador

echo.
echo  === VoxAssistant - Instalador automatico para Windows ===
echo.

echo [1/6] Verificando Node.js...
where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [!] Node.js NO detectado aunque ya lo instalaste.
    echo.
    echo  Esto pasa porque Windows no actualizo las variables
    echo  de entorno todavia. Solucion:
    echo.
    echo   OPCION A (recomendada):
    echo     1. Cierra esta ventana
    echo     2. REINICIA la computadora
    echo     3. Abre esta carpeta de nuevo y ejecuta el bat
    echo.
    echo   OPCION B (sin reiniciar):
    echo     1. Cierra esta ventana
    echo     2. Abre "Simbolo del sistema" (cmd) como Administrador
    echo     3. Escribe: setx PATH "%PATH%;C:\Program Files\nodejs\" /M
    echo     4. Cierra y vuelve a abrir el cmd
    echo     5. Ejecuta este bat de nuevo
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo  [OK] Node.js %%i

echo.
echo [2/6] Verificando npm...
where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] npm no encontrado. Reinstala Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo  [OK] npm %%i

echo.
echo [3/6] Verificando Python...
where python >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [!] Python no encontrado. Instalando via winget...
    winget install --id Python.Python.3.11 --silent --accept-source-agreements --accept-package-agreements
    IF %ERRORLEVEL% NEQ 0 (
        echo  [!] Instala Python manualmente desde: https://www.python.org/downloads/
        echo      MUY IMPORTANTE: activa "Add Python to PATH"
        start https://www.python.org/downloads/
        pause
        exit /b 1
    )
    echo  [OK] Python instalado. Reinicia el script para continuar.
    pause
    exit /b 0
) ELSE (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo  [OK] %%i
)

echo.
echo [4/6] Instalando paquetes Python (pyttsx3 + voz)...
python -m pip install --upgrade pip --quiet
python -m pip install pyttsx3 SpeechRecognition --quiet
echo  [OK] Paquetes de voz instalados

echo      Instalando pyaudio (microfono)...
python -m pip install pyaudio --quiet 2>nul
IF %ERRORLEVEL% NEQ 0 (
    python -m pip install pipwin --quiet
    python -m pipwin install pyaudio --quiet 2>nul
    IF %ERRORLEVEL% NEQ 0 (
        echo  [AVISO] pyaudio fallo. El microfono puede no funcionar, pero TTS si.
    ) ELSE (
        echo  [OK] pyaudio instalado
    )
) ELSE (
    echo  [OK] pyaudio instalado
)

echo.
echo [5/6] Instalando dependencias Node.js (tarda 2-3 min)...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] npm install fallo en la raiz
    pause
    exit /b 1
)
echo  [OK] Dependencias raiz listas

cd frontend
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] npm install fallo en /frontend
    pause
    exit /b 1
)
cd ..
echo  [OK] Frontend React listo

echo.
echo [6/6] Probando voz...
python python\voice\speak.py "VoxAssistant instalado correctamente."
IF %ERRORLEVEL% NEQ 0 (
    echo  [AVISO] La voz no funciono aun. Puede funcionar al abrir la app.
) ELSE (
    echo  [OK] Voz funcionando
)

echo.
echo  =========================================
echo   INSTALACION COMPLETADA
echo  =========================================
echo.
echo  Para iniciar la app ejecuta:
echo.
echo     npm run dev
echo.
echo  La primera vez tarda 1-2 minutos. Es normal.
echo.
pause
