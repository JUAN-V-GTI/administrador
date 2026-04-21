#!/usr/bin/env python3
# python/voice/record.py
# Reconocimiento de voz con SpeechRecognition
# Uso: python record.py start | python record.py stop

import sys
import json

def recognize_voice():
    """Graba y reconoce un comando de voz"""
    try:
        import speech_recognition as sr
        
        recognizer = sr.Recognizer()
        
        with sr.Microphone() as source:
            print("STATUS:listening", flush=True)
            
            # Ajustar al ruido ambiente
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            # Escuchar (timeout 5 segundos, frase máxima 10 segundos)
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
        
        print("STATUS:processing", flush=True)
        
        # Reconocer con Google (requiere internet) o Sphinx (offline)
        try:
            text = recognizer.recognize_google(audio, language='es-MX')
            print(f"TEXT:{text}", flush=True)
        except sr.UnknownValueError:
            print("TEXT:", flush=True)  # No se entendió
        except sr.RequestError:
            # Fallback: intentar offline con Sphinx si está instalado
            try:
                text = recognizer.recognize_sphinx(audio, language='es-ES')
                print(f"TEXT:{text}", flush=True)
            except:
                print("ERROR:Sin conexión y sin reconocimiento offline", flush=True)
                
    except ImportError:
        print("ERROR:speech_recognition no instalado. Ejecuta: pip install SpeechRecognition pyaudio", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR:{str(e)}", flush=True)

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "start"
    
    if action in ["start", "stop", "record"]:
        recognize_voice()
    else:
        print(f"Acción desconocida: {action}", file=sys.stderr)
        sys.exit(1)
