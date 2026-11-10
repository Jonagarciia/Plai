# Imagen base oficial con versión fija (Estándar PLAi)
FROM python:3.12-slim

WORKDIR /app

# Crear usuario no root con UID >= 1000
RUN adduser --disabled-password --gecos "" --uid 1001 appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Asignar permisos al usuario no root
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Endpoint de salud configurado según Sección 5.1
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]