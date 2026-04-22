#!/usr/bin/env python3
# python/voice/speak.py
# Text-to-Speech offline con pyttsx3
# Uso: python speak.py "Texto a hablar"

import sys
import os

def pick_best_spanish_female_voice(engine):
    voices = engine.getProperty('voices')

    # Prioridad alta en macOS: voces femeninas en espanol comunes
    preferred_names = [
        "paulina",   # es-MX
        "monica",    # es-ES
        "marisol",   # es-MX
        "soledad",   # es-ES
        "paloma",    # es-ES
    ]

    # 1) Buscar coincidencia exacta por nombre preferido
    for preferred in preferred_names:
        for voice in voices:
            name = getattr(voice, "name", "").lower()
            voice_id = getattr(voice, "id", "").lower()
            if preferred in name or preferred in voice_id:
                return voice.id

    # 2) Buscar voz en espanol con pistas de femenino
    feminine_hints = ["female", "woman", "mujer", "femenina", "f"]
    spanish_hints = ["spanish", "es_", "es-", "es.", "jorge", "juan", "mex", "spain"]
    for voice in voices:
        name = getattr(voice, "name", "").lower()
        voice_id = getattr(voice, "id", "").lower()
        languages = str(getattr(voice, "languages", "")).lower()
        haystack = f"{name} {voice_id} {languages}"
        if any(s in haystack for s in spanish_hints) and any(f in haystack for f in feminine_hints):
            return voice.id

    # 3) Cualquier voz en espanol
    for voice in voices:
        name = getattr(voice, "name", "").lower()
        voice_id = getattr(voice, "id", "").lower()
        languages = str(getattr(voice, "languages", "")).lower()
        haystack = f"{name} {voice_id} {languages}"
        if "spanish" in haystack or "es" in haystack:
            return voice.id

    return None

def speak(text):
    try:
        import pyttsx3
        
        engine = pyttsx3.init()
        
        # Permite forzar voz por variable de entorno (VOICE_NAME)
        # Ejemplo: VOICE_NAME=Paulina python speak.py "hola"
        forced_voice_name = os.getenv("VOICE_NAME", "").strip().lower()
        if forced_voice_name:
            for voice in engine.getProperty('voices'):
                name = getattr(voice, "name", "").lower()
                voice_id = getattr(voice, "id", "").lower()
                if forced_voice_name in name or forced_voice_name in voice_id:
                    engine.setProperty('voice', voice.id)
                    break
        else:
            best_voice_id = pick_best_spanish_female_voice(engine)
            if best_voice_id:
                engine.setProperty('voice', best_voice_id)
        
        # Configuración de velocidad y volumen
        engine.setProperty('rate', 165)    # Palabras por minuto (más natural)
        engine.setProperty('volume', 1.0)  # 0.0 a 1.0
        
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
