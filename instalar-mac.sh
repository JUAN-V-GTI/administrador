#!/bin/bash
# ============================================================
#  VoxAssistant - Script de instalación para macOS
#  Ejecuta en Terminal: bash instalar-mac.sh
# ============================================================

set -e  # Detener si hay error

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

print_header() {
  echo -e "${CYAN}"
  echo "  ██╗   ██╗ ██████╗ ██╗  ██╗     █████╗ ███████╗███████╗"
  echo "  ██║   ██║██╔═══██╗╚██╗██╔╝    ██╔══██╗██╔════╝██╔════╝"
  echo "  ██║   ██║██║   ██║ ╚███╔╝     ███████║███████╗███████╗"
  echo "  ╚██╗ ██╔╝██║   ██║ ██╔██╗     ██╔══██║╚════██║╚════██║"
  echo "   ╚████╔╝ ╚██████╔╝██╔╝ ██╗    ██║  ██║███████║███████║"
  echo "    ╚═══╝   ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚══════╝"
  echo -e "${NC}"
  echo "  Instalador automático para macOS"
  echo "  ============================================"
  echo ""
}

print_header

# ── PASO 1: Homebrew ─────────────────────────────────────────
echo -e "${YELLOW}[1/7] Verificando Homebrew...${NC}"
if ! command -v brew &> /dev/null; then
    echo "  Homebrew no encontrado. Instalando..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Agregar brew al PATH (Apple Silicon)
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    echo -e "${GREEN}  [OK] Homebrew instalado${NC}"
else
    echo -e "${GREEN}  [OK] Homebrew $(brew --version | head -1) encontrado${NC}"
fi

# ── PASO 2: Node.js ───────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/7] Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "  Instalando Node.js via Homebrew..."
    brew install node
    echo -e "${GREEN}  [OK] Node.js instalado${NC}"
else
    echo -e "${GREEN}  [OK] Node.js $(node --version) encontrado${NC}"
fi

# ── PASO 3: Python ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/7] Verificando Python 3...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "  Instalando Python 3 via Homebrew..."
    brew install python@3.11
    echo -e "${GREEN}  [OK] Python instalado${NC}"
else
    echo -e "${GREEN}  [OK] $(python3 --version) encontrado${NC}"
fi

# ── PASO 4: PortAudio (necesario para PyAudio/micrófono) ─────
echo ""
echo -e "${YELLOW}[4/7] Instalando PortAudio para microfono...${NC}"
if ! brew list portaudio &> /dev/null; then
    brew install portaudio
fi
echo -e "${GREEN}  [OK] PortAudio instalado${NC}"

# ── PASO 5: Paquetes Python ───────────────────────────────────
echo ""
echo -e "${YELLOW}[5/7] Instalando paquetes Python...${NC}"
pip3 install pyttsx3 SpeechRecognition pyaudio --quiet
echo -e "${GREEN}  [OK] pyttsx3, SpeechRecognition, pyaudio instalados${NC}"

# ── PASO 6: Dependencias Node.js ─────────────────────────────
echo ""
echo -e "${YELLOW}[6/7] Instalando dependencias Node.js...${NC}"

# Raíz del proyecto
npm install --quiet
echo -e "  [OK] Dependencias raiz${NC}"

# Frontend React
cd frontend
npm install --quiet
cd ..
echo -e "${GREEN}  [OK] Frontend instalado${NC}"

# ── PASO 7: Prueba de voz ─────────────────────────────────────
echo ""
echo -e "${YELLOW}[7/7] Probando sintetizador de voz...${NC}"
python3 python/voice/speak.py "Instalación completada. VoxAssistant listo para usar." || {
    echo -e "${YELLOW}  [AVISO] La voz no funcionó, pero puedes continuar.${NC}"
}

# ── Permisos necesarios en macOS ─────────────────────────────
echo ""
echo -e "${YELLOW}  IMPORTANTE - Permisos macOS:${NC}"
echo "  Al abrir la app por primera vez, macOS te pedirá permisos para:"
echo "  • Micrófono (para comandos de voz)"
echo "  • Accesibilidad (para abrir otras apps)"
echo "  Acepta ambos para que VoxAssistant funcione correctamente."

# ── FINALIZADO ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}"
echo "  ============================================"
echo "   INSTALACIÓN COMPLETADA ✓"
echo "  ============================================"
echo -e "${NC}"
echo "  Para INICIAR en modo desarrollo:"
echo "    npm run dev"
echo ""
echo "  Para INICIAR solo (si ya corre React en otro terminal):"
echo "    npm start"
echo ""
