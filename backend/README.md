# Sistema de Gestión de Asistencias Moodle — PLAi

Aplicación web desacoplada para la automatización, procesamiento y visualización de asistencias de estudiantes inscritos en cursos autogestivos de Moodle, adaptada al Estándar Tecnológico de PLAi v1.0.

## Arquitectura y Stack Tecnológico

- **Frontend:** React 19 + Vite 7 + TypeScript + Tailwind CSS (Single Page Application).
- **Backend:** Python 3.12 + FastAPI + Uvicorn + Pydantic v2.
- **Servidor Web / Proxy:** Nginx (puerto 8080 en producción).
- **Contenerización:** Docker multi-etapa (usuario no root, salud e integración para Docker Swarm / Traefik v3).

## Ejecución en Entorno de Desarrollo Local

### 1. Requisitos Previos
- Node.js LTS (v22.x) y pnpm / npm.
- Python 3.12+ con virtualenv.

### 2. Iniciar Backend (FastAPI)
```bash
cd backend
python -m venv venv
# En Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# En Linux/Git Bash:
source venv/Scripts/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000