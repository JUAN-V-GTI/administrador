# ============================================================
#  VoxAssistant - Instalador PowerShell
#  Ejecuta en Warp/PowerShell:
#  powershell -ExecutionPolicy Bypass -File instalar.ps1
# ============================================================

$Host.UI.RawUI.WindowTitle = "VoxAssistant Instalador"
Write-Host ""
Write-Host "=== VoxAssistant - Instalador PowerShell ===" -ForegroundColor Cyan
Write-Host ""

# ── Node.js ──────────────────────────────────────────────────
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = & "C:\Program Files\nodejs\node.exe" --version 2>$null
    if (-not $nodeVersion) {
        $nodeVersion = node --version 2>$null
    }
    Write-Host "  [OK] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Node.js no encontrado. Instala desde nodejs.org" -ForegroundColor Red
    exit 1
}

# ── Python ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Verificando Python..." -ForegroundColor Yellow
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $v = & $cmd --version 2>$null
        if ($v -match "Python") {
            $pythonCmd = $cmd
            Write-Host "  [OK] $v (comando: $cmd)" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $pythonCmd) {
    Write-Host "  [!] Python no encontrado. Instalando..." -ForegroundColor Yellow
    winget install --id Python.Python.3.11 --silent --accept-source-agreements
    $pythonCmd = "python"
    Write-Host "  [OK] Python instalado. Continuando..." -ForegroundColor Green
}

# ── Paquetes Python ───────────────────────────────────────────
Write-Host ""
Write-Host "[3/5] Instalando paquetes Python..." -ForegroundColor Yellow
& $pythonCmd -m pip install --upgrade pip --quiet
& $pythonCmd -m pip install pyttsx3 SpeechRecognition --quiet
Write-Host "  [OK] pyttsx3 y SpeechRecognition instalados" -ForegroundColor Green

# pyaudio
& $pythonCmd -m pip install pyaudio --quiet
if ($LASTEXITCODE -ne 0) {
    & $pythonCmd -m pip install pipwin --quiet
    & $pythonCmd -m pipwin install pyaudio --quiet
}
Write-Host "  [OK] pyaudio instalado" -ForegroundColor Green

# ── npm install raiz ──────────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Instalando dependencias Node.js..." -ForegroundColor Yellow
Write-Host "  (puede tardar 2-3 minutos)" -ForegroundColor Gray
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] npm install fallo" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Dependencias raiz listas" -ForegroundColor Green

Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] npm install en /frontend fallo" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "  [OK] Frontend React listo" -ForegroundColor Green

# ── Prueba de voz ─────────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Probando voz..." -ForegroundColor Yellow
& $pythonCmd python\voice\speak.py "VoxAssistant instalado correctamente."
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Voz funcionando" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] La voz puede tardar en funcionar, continua igual" -ForegroundColor Yellow
}

# ── LISTO ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " INSTALACION COMPLETADA" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Para iniciar la app ejecuta:" -ForegroundColor White
Write-Host ""
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para cerrar"
