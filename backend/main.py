from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import io
import os
import re
from datetime import datetime

app = FastAPI(
    title="API de Reportes e Integración Moodle - PLAi",
    version="6.6.0"
)

# Configuración de CORS para conexión con React/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Esquema Pydantic para la gestión manual de cursos
class CursoSchema(BaseModel):
    nombre: str
    codigo_curso: str
    codigo_implementacion: str
    modalidad: str = "Autogestivo"
    estado: str = "Activo"
    estudiantes: int = 0
    area: str = "General"
    calificacion_minima: str = "80"
    moodle_url: str = "#"

# Estado en memoria para desarrollo local
CATALOGO_CURSOS: List[dict] = []
HISTORIAL_REPORTES_PROCESADOS: List[dict] = []

def cargar_df_moodle(contents: bytes, filename: str) -> pd.DataFrame:
    """Función auxiliar con tolerancia multi-encoding para leer archivos exportados de Moodle."""
    ext = filename.lower().split('.')[-1]
    
    if ext == 'csv':
        try:
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-16', sep='\t')
            if len(df.columns) > 1:
                return df
        except Exception:
            pass

        try:
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
            if len(df.columns) > 1:
                return df
        except Exception:
            pass

        try:
            return pd.read_csv(io.BytesIO(contents), encoding='latin-1')
        except Exception:
            return pd.read_csv(io.BytesIO(contents), encoding='utf-16')

    elif ext in ['xlsx', 'xlsm']:
        return pd.read_excel(io.BytesIO(contents), engine='openpyxl')
    elif ext == 'xls':
        try:
            return pd.read_excel(io.BytesIO(contents), engine='xlrd')
        except Exception:
            return pd.read_html(io.BytesIO(contents))[0]
    else:
        return pd.read_csv(io.BytesIO(contents), encoding='latin-1')

def parsear_excel_flexible(file_bytes: bytes) -> List[dict]:
    """Extrae automáticamente los cursos desde archivos Excel estructurados."""
    xls = pd.ExcelFile(io.BytesIO(file_bytes))
    
    sheet_candidates = [
        s for s in xls.sheet_names 
        if 'catálogo' in s.lower() or 'catalogo' in s.lower()
    ]
    selected_sheet = sheet_candidates[0] if sheet_candidates else xls.sheet_names[0]
    
    df_raw = pd.read_excel(xls, sheet_name=selected_sheet)
    
    header_idx = None
    for idx, row in df_raw.iterrows():
        row_str = " ".join([str(val).lower() for val in row.values if pd.notna(val)])
        if 'nombre del curso' in row_str:
            header_idx = idx
            break

    if header_idx is not None:
        df_cat = df_raw.iloc[header_idx + 1:].copy()
        df_cat.columns = [str(c).strip() for c in df_raw.iloc[header_idx].values]
    else:
        df_cat = df_raw.copy()
        df_cat.columns = [str(c).strip() for c in df_cat.columns]

    nuevos_cursos = []
    cols_dict = {str(c).lower().strip(): c for c in df_cat.columns}
    
    col_nombre = next((cols_dict[c] for c in cols_dict if 'nombre del curso' in c), None)
    if not col_nombre:
        col_nombre = next((cols_dict[c] for c in cols_dict if 'actividad formativa' in c and 'tipo' not in c), None)

    col_codigo = next((cols_dict[c] for c in cols_dict if 'código del curso' in c or 'codigo del curso' in c), None)
    col_imp = next((cols_dict[c] for c in cols_dict if 'código de implementación' in c or 'codigo de implementacion' in c), None)
    col_modalidad = next((cols_dict[c] for c in cols_dict if 'modalidad' in c), None)
    col_estado = next((cols_dict[c] for c in cols_dict if 'estatus' in c or 'estado' in c), None)
    col_area = next((cols_dict[c] for c in cols_dict if 'área' in c or 'eje temático' in c), None)
    col_moodle = next((cols_dict[c] for c in cols_dict if 'moodle' in c or 'liga' in c), None)
    col_inscritos = next((cols_dict[c] for c in cols_dict if 'inscritos' in c or 'usuarios activos' in c or 'planeados' in c), None)
    col_calif = next((cols_dict[c] for c in cols_dict if 'calificación mínima' in c or 'criterio' in c), None)

    for idx, row in df_cat.iterrows():
        val_nombre = row.get(col_nombre, '') if col_nombre else ''
        if pd.isna(val_nombre):
            continue
            
        nombre_exacto = str(val_nombre).strip()
        if not nombre_exacto or nombre_exacto.lower() == 'nan' or 'nombre del curso' in nombre_exacto.lower():
            continue
        
        cod_curso = str(row.get(col_codigo, 'N/A')).strip() if col_codigo else 'N/A'
        cod_imp = str(row.get(col_imp, 'N/A')).strip() if col_imp else 'N/A'
        modalidad = str(row.get(col_modalidad, 'Autogestivo')).strip() if col_modalidad else 'Autogestivo'
        
        raw_estado = str(row.get(col_estado, '')).strip() if col_estado else ''
        estado = "Activo" if not raw_estado or raw_estado.lower() == 'nan' else raw_estado.capitalize()

        area = str(row.get(col_area, 'General')).strip() if col_area else 'General'
        moodle_url = str(row.get(col_moodle, '#')).strip() if col_moodle else '#'
        
        raw_estudiantes = row.get(col_inscritos, 0) if col_inscritos else 0
        try:
            estudiantes = int(raw_estudiantes) if pd.notna(raw_estudiantes) else 0
        except:
            estudiantes = 0

        raw_calif = row.get(col_calif, '80') if col_calif else '80'
        calif_min_str = "Asistencia" if pd.isna(raw_calif) or str(raw_calif).strip().lower() == 'nan' else str(raw_calif).strip()

        nuevos_cursos.append({
            "id": len(nuevos_cursos) + 1,
            "nombre": nombre_exacto,
            "codigo_curso": cod_curso if cod_curso != 'nan' else "N/A",
            "codigo_implementacion": cod_imp if cod_imp != 'nan' else "N/A",
            "modalidad": modalidad if modalidad != 'nan' else "Autogestivo",
            "estado": estado,
            "estudiantes": estudiantes,
            "area": area if area != 'nan' else "General",
            "calificacion_minima": calif_min_str,
            "moodle_url": moodle_url if moodle_url != 'nan' else "#"
        })

    return nuevos_cursos


# ENDPOINTS DE MÉTRICAS Y CATÁLOGO DE CURSOS

@app.get("/api/v1/estadisticas")
def obtener_estadisticas_dashboard():
    total_cursos = len(CATALOGO_CURSOS)
    estudiantes_activos = sum(c.get("estudiantes", 0) for c in CATALOGO_CURSOS) if total_cursos > 0 else 0
    reportes_procesados_reales = len(HISTORIAL_REPORTES_PROCESADOS)

    return {
        "total_cursos": total_cursos,
        "estudiantes_activos": estudiantes_activos,
        "reportes_procesados": reportes_procesados_reales
    }

@app.get("/api/v1/cursos")
def obtener_cursos():
    return {"total": len(CATALOGO_CURSOS), "cursos": CATALOGO_CURSOS}

@app.get("/api/v1/cursos/{curso_id}")
def obtener_curso_por_id(curso_id: int):
    curso = next((c for c in CATALOGO_CURSOS if c["id"] == curso_id), None)
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return curso

@app.post("/api/v1/cursos")
def crear_curso(curso: CursoSchema):
    nuevo_id = max([c["id"] for c in CATALOGO_CURSOS], default=0) + 1
    nuevo_curso = {"id": nuevo_id, **curso.dict()}
    CATALOGO_CURSOS.insert(0, nuevo_curso)
    return {"mensaje": "Curso agregado al catálogo", "curso": nuevo_curso}

@app.put("/api/v1/cursos/{curso_id}")
def actualizar_curso(curso_id: int, curso_data: CursoSchema):
    for idx, c in enumerate(CATALOGO_CURSOS):
        if c["id"] == curso_id:
            CATALOGO_CURSOS[idx] = {"id": curso_id, **curso_data.dict()}
            return {"mensaje": "Curso actualizado", "curso": CATALOGO_CURSOS[idx]}
    raise HTTPException(status_code=404, detail="Curso no encontrado")

@app.delete("/api/v1/cursos/{curso_id}")
def eliminar_curso(curso_id: int):
    global CATALOGO_CURSOS
    CATALOGO_CURSOS = [c for c in CATALOGO_CURSOS if c["id"] != curso_id]
    return {"mensaje": "Curso eliminado"}

@app.delete("/api/v1/catalogo/vaciar")
def vaciar_catalogo():
    """Vacía tanto el catálogo de cursos como el historial de reportes procesados."""
    global CATALOGO_CURSOS, HISTORIAL_REPORTES_PROCESADOS
    total_cursos_borrados = len(CATALOGO_CURSOS)
    total_reportes_borrados = len(HISTORIAL_REPORTES_PROCESADOS)
    
    CATALOGO_CURSOS.clear()
    HISTORIAL_REPORTES_PROCESADOS.clear()
    
    return {
        "status": "success",
        "mensaje": f"Se eliminaron {total_cursos_borrados} cursos y {total_reportes_borrados} reportes procesados. Todas las métricas del Dashboard vuelven a 0.",
        "total_cursos": 0,
        "reportes_procesados": 0
    }

@app.delete("/api/v1/reportes/limpiar-historial")
def limpiar_historial_reportes():
    """Limpia únicamente el historial de reportes procesados dejando las métricas de reportes en 0."""
    global HISTORIAL_REPORTES_PROCESADOS
    total_reportes = len(HISTORIAL_REPORTES_PROCESADOS)
    HISTORIAL_REPORTES_PROCESADOS.clear()
    return {
        "status": "success",
        "mensaje": f"Se limpiaron {total_reportes} reportes del historial. El contador de reportes procesados vuelve a 0."
    }

@app.post("/api/v1/catalogo/subir-excel")
async def subir_catalogo_excel(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        nuevos_cursos = parsear_excel_flexible(contents)
        if not nuevos_cursos:
            raise HTTPException(status_code=400, detail="No se pudieron extraer cursos válidos del archivo.")

        global CATALOGO_CURSOS
        CATALOGO_CURSOS = nuevos_cursos
            
        return {
            "status": "success",
            "mensaje": f"¡Catálogo cargado con éxito! Se registraron {len(CATALOGO_CURSOS)} cursos.",
            "total": len(CATALOGO_CURSOS)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando el Excel del catálogo: {str(e)}")

# ---------------------------------------------------------
# ENDPOINTS DE PROCESAMIENTO DE REPORTES MOODLE
# ---------------------------------------------------------

@app.post("/api/v1/reportes/asistencias")
async def procesar_reporte_asistencias(file: UploadFile = File(...), curso_nombre: str = Form(...)):
    contents = await file.read()
    try:
        df = cargar_df_moodle(contents, file.filename)
        df.columns = [str(c).strip() for c in df.columns]

        col_nombre = df.columns[0]
        col_correo = next((c for c in df.columns if any(t in c.lower() for t in ['correo', 'email', 'dirección', 'direccion'])), None)

        registros = []
        for idx, row in df.iterrows():
            raw_full = str(row[col_nombre]).strip() if pd.notna(row[col_nombre]) else ""
            if not raw_full or "nombre" in raw_full.lower() or "first name" in raw_full.lower():
                continue

            partes = [p for p in raw_full.replace('.', ' ').split() if p.strip()]
            if len(partes) >= 3:
                nombre = " ".join(partes[:-2])
                apellido = " ".join(partes[-2:])
            elif len(partes) == 2:
                nombre = partes[0]
                apellido = partes[1]
            else:
                nombre = raw_full.replace('.', '').strip()
                apellido = ""

            correo = str(row[col_correo]).strip() if col_correo and pd.notna(row[col_correo]) else f"usuario{idx+1}@plai.mx"

            tiene_finalizados = False
            meses_unicos = set()
            conteo_actividades = 0
            
            for col in df.columns:
                val = str(row[col])
                if "finalizado" in val.lower() and "no finalizado" not in val.lower():
                    tiene_finalizados = True
                    conteo_actividades += 1
                
                dates_found = re.findall(r'\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}', val)
                if dates_found:
                    for d in dates_found:
                        dt = pd.to_datetime(d, errors='coerce')
                        if pd.notna(dt):
                            meses_unicos.add(dt.strftime('%m-%Y'))
                else:
                    try:
                        dt = pd.to_datetime(val, errors='coerce')
                        if pd.notna(dt):
                            meses_unicos.add(dt.strftime('%m-%Y'))
                    except:
                        pass
            
            if len(meses_unicos) > 0:
                asistencias_obtenidas = len(meses_unicos)
            elif tiene_finalizados:
                asistencias_obtenidas = conteo_actividades
            else:
                asistencias_obtenidas = 0

            registros.append({
                "id": idx + 1,
                "nombre": nombre if nombre else raw_full,
                "apellido": apellido,
                "correo": correo,
                "asistencias_curso": asistencias_obtenidas
            })

        HISTORIAL_REPORTES_PROCESADOS.append({
            "tipo": "Asistencias",
            "curso": curso_nombre,
            "registros": len(registros)
        })

        return {
            "tipo_reporte": "Asistencias",
            "curso_nombre": curso_nombre,
            "total_registros": len(registros),
            "datos": registros
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo archivo de asistencias: {str(e)}")

@app.post("/api/v1/reportes/calificaciones")
async def procesar_reporte_calificaciones(
    file: UploadFile = File(...), 
    curso_nombre: str = Form(...),
    criterio_aprobacion: str = Form(...)
):
    contents = await file.read()
    try:
        df = cargar_df_moodle(contents, file.filename)
        df.columns = [str(c).strip() for c in df.columns]

        match = re.search(r'\d+(\.\d+)?', str(criterio_aprobacion))
        nota_corte_num = float(match.group(0)) if match else None

        col_nombre = df.columns[0]
        col_correo = next((c for c in df.columns if any(t in c.lower() for t in ['correo', 'email', 'dirección', 'direccion'])), None)
        col_calif = next(
            (c for c in df.columns if any(term in c.lower() for term in ['calificación final', 'course total', 'total del curso', 'calificación', 'calificacion', 'grade', 'nota'])),
            None
        )

        registros = []
        for idx, row in df.iterrows():
            raw_full = str(row[col_nombre]).strip() if pd.notna(row[col_nombre]) else ""
            if not raw_full or "nombre" in raw_full.lower() or "first name" in raw_full.lower():
                continue

            partes = [p for p in raw_full.replace('.', ' ').split() if p.strip()]
            if len(partes) >= 3:
                nombre = " ".join(partes[:-2])
                apellido = " ".join(partes[-2:])
            elif len(partes) == 2:
                nombre = partes[0]
                apellido = partes[1]
            else:
                nombre = raw_full.replace('.', '').strip()
                apellido = ""

            correo = str(row[col_correo]).strip() if col_correo and pd.notna(row[col_correo]) else f"usuario{idx+1}@plai.mx"

            raw_val = row[col_calif] if col_calif and pd.notna(row[col_calif]) else "0"
            try:
                calif_real = float(str(raw_val).replace(',', '.').strip())
            except:
                calif_real = str(raw_val).strip()

            if isinstance(calif_real, (int, float)):
                aprobado = (calif_real >= nota_corte_num) if nota_corte_num is not None else (calif_real >= 60.0)
            else:
                aprobado = True if str(calif_real).lower() in ['aprobado', 'acredita', 'completado', 'finalizado'] else False

            registros.append({
                "id": idx + 1,
                "nombre": nombre if nombre else raw_full,
                "apellido": apellido,
                "correo": correo,
                "calificacion_real": calif_real,
                "criterio_requerido": criterio_aprobacion,
                "aprobado": aprobado,
                "estatus": "Aprobado" if aprobado else "No Aprobado"
            })

        HISTORIAL_REPORTES_PROCESADOS.append({
            "tipo": "Calificaciones",
            "curso": curso_nombre,
            "registros": len(registros)
        })

        return {
            "tipo_reporte": "Calificaciones",
            "curso_nombre": curso_nombre,
            "total_registros": len(registros),
            "datos": registros
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo archivo de calificaciones: {str(e)}")

@app.post("/api/v1/reportes/constancias")
async def procesar_reporte_constancias(file: UploadFile = File(...), curso_nombre: str = Form(...)):
    contents = await file.read()
    try:
        df = cargar_df_moodle(contents, file.filename)
        df.columns = [str(c).strip() for c in df.columns]

        col_nombre = df.columns[0]
        col_correo = next((c for c in df.columns if any(t in c.lower() for t in ['correo', 'email', 'dirección', 'direccion'])), None)
        col_cod = next((c for c in df.columns if any(t in c.lower() for t in ['constancia', 'código', 'codigo', 'certificado'])), None)
        col_fec = next((c for c in df.columns if any(t in c.lower() for t in ['descarga', 'emision', 'fecha'])), None)

        registros = []
        for idx, row in df.iterrows():
            raw_full = str(row[col_nombre]).strip() if pd.notna(row[col_nombre]) else ""
            if not raw_full or "nombre" in raw_full.lower() or "first name" in raw_full.lower():
                continue

            partes = [p for p in raw_full.replace('.', ' ').split() if p.strip()]
            if len(partes) >= 3:
                nombre = " ".join(partes[:-2])
                apellido = " ".join(partes[-2:])
            elif len(partes) == 2:
                nombre = partes[0]
                apellido = partes[1]
            else:
                nombre = raw_full.replace('.', '').strip()
                apellido = ""

            correo = str(row[col_correo]).strip() if col_correo and pd.notna(row[col_correo]) else f"usuario{idx+1}@plai.mx"

            cod_c = str(row[col_cod]) if col_cod and pd.notna(row[col_cod]) else f"CST-PLAI-{(idx+1):04d}"
            fec_c = str(row[col_fec]) if col_fec and pd.notna(row[col_fec]) else "Descargada"

            registros.append({
                "id": idx + 1,
                "nombre": nombre if nombre else raw_full,
                "apellido": apellido,
                "correo": correo,
                "codigo_constancia": cod_c,
                "fecha_descarga": fec_c
            })

        HISTORIAL_REPORTES_PROCESADOS.append({
            "tipo": "Constancias",
            "curso": curso_nombre,
            "registros": len(registros)
        })

        return {
            "tipo_reporte": "Constancias",
            "curso_nombre": curso_nombre,
            "total_registros": len(registros),
            "datos": registros
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo archivo de constancias: {str(e)}")