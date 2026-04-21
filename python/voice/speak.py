#!/usr/bin/env python3
# python/voice/speak.py
# Text-to-Speech offline con pyttsx3
# Uso: python speak.py "Texto a hablar"

import sys
import os

def speak(text):
    try:
        import pyttsx3
        
        engine = pyttsx3.init()
        
        # Configurar voz en español si está disponible
        voices = engine.getProperty('voices')
        for voice in voices:
            if 'spanish' in voice.name.lower() or 'es' in voice.id.lower() or 'jorge' in voice.name.lower():
                engine.setProperty('voice', voice.id)
                break
        
        # Configuración de velocidad y volumen
        engine.setProperty('rate', 150)    # Palabras por minuto
        engine.setProperty('volume', 0.9)  # 0.0 a 1.0
        
        engine.say(text)
        engine.runAndWait()
        
        print(f"OK: '{text}'")
        sys.stdout.flush()
        
    except ImportError:
        print("ERROR: pyttsx3 no instalado. Ejecuta: pip install pyttsx3", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python speak.py 'texto a hablar'", file=sys.stderr)
        sys.exit(1)
    
    # Unir todos los argumentos en caso de texto con espacios
    text = " ".join(sys.argv[1:])
    speak(text)
