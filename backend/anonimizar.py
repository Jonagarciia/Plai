import pandas as pd
import random

# Listas de datos ficticios para demostraciones
NOMBRES_MOCK = ["Juan", "María", "Carlos", "Ana", "Luis", "Sofía", "Pedro", "Lucía", "Diego", "Elena"]
APELLIDOS_MOCK = ["Pérez", "García", "López", "Hernández", "González", "Martínez", "Rodríguez", "Sánchez"]

def anonimizar_reporte_moodle(ruta_entrada: str, ruta_salida: str):
    """
    Lee un reporte real de Moodle (UTF-16/TSV) y reemplaza nombres 
    y correos con datos 100% sintéticos/ficticios.
    """
    try:
        # Leer archivo Moodle original
        df = pd.read_csv(ruta_entrada, encoding='utf-16', sep='\t')
        
        # Mapear la primera columna (nombres) y la columna de correo
        col_nombre = df.columns[0]
        col_correo = next((c for c in df.columns if any(t in c.lower() for t in ['correo', 'email', 'dirección', 'direccion'])), None)
        
        for idx in range(len(df)):
            nombre_ficticio = f"{random.choice(NOMBRES_MOCK)} {random.choice(APELLIDOS_MOCK)} {random.choice(APELLIDOS_MOCK)}"
            correo_ficticio = f"usuario_prueba{idx+1}@plai.mx"
            
            df.at[idx, col_nombre] = nombre_ficticio
            if col_correo:
                df.at[idx, col_correo] = correo_ficticio

        # Guardar copia anonimizada lista para demos
        df.to_csv(ruta_salida, sep='\t', encoding='utf-16', index=False)
        print(f"✅ Archivo anonimizado con éxito y guardado en: {ruta_salida}")
    except Exception as e:
        print(f"❌ Error al anonimizar: {e}")

if