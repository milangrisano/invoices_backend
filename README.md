# Invoices Backend (NestJS + PostgreSQL)

Este es el backend de facturación desarrollado con **NestJS**, **TypeORM** y **PostgreSQL**. Cuenta con autenticación por JWT para la aplicación web y claves de API (ApiKeys) para integraciones de servicios externos (como Herb u otros sistemas de automatización).

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu máquina local:
1. **Node.js** (Versión 18 o 20 recomendada)
2. **pnpm** (Gestor de paquetes): `npm install -g pnpm`
3. **Docker Desktop**: Para ejecutar la base de datos PostgreSQL de manera local y aislada.
4. **Git**: Para el control de versiones.

---

## 🚀 Configuración del Entorno de Desarrollo Local

Sigue estos pasos para poner en marcha el proyecto en tu entorno local por primera vez:

### Paso 1: Instalar Dependencias
Instala todas las librerías necesarias del proyecto utilizando `pnpm`:
```bash
pnpm install
```

### Paso 2: Configurar Variables de Entorno
Crea tu archivo de entorno local si no lo tienes. El proyecto ya incluye un archivo de ejemplo:
```bash
cp .env.example .env
```
*Nota: Si ya tienes un archivo `.env`, asegúrate de que la variable `DB_HOST` esté configurada como `localhost` para el desarrollo local.*

### Paso 3: Levantar la Base de Datos (PostgreSQL)
Inicia el contenedor de Docker únicamente para el servicio de base de datos (`db`). Esto evitará que consumas recursos innecesarios ejecutando la API dentro de Docker mientras desarrollas:
```bash
docker compose up -d db
```

### Paso 4: Iniciar el Servidor de Desarrollo
Arranca la aplicación de NestJS en modo "Watch". El servidor compilará el código y se reiniciará automáticamente con cada cambio que guardes:
```bash
pnpm start:dev
```
La API estará disponible en: [http://localhost:3000](http://localhost:3000)  
La documentación interactiva de Swagger UI estará disponible en: [http://localhost:3000/api](http://localhost:3000/api)

---

## 🧪 Ejecución de Pruebas

Para garantizar que tus modificaciones no rompan funcionalidades existentes, ejecuta la suite de pruebas:

```bash
# Pruebas unitarias
pnpm run test

# Pruebas de integración E2E (requiere que la base de datos esté corriendo)
pnpm run test:e2e

# Cobertura de código (Coverage)
pnpm run test:cov
```

---

## 🔄 Flujo de Trabajo con Git (Creación de Nuevas Versiones)

Cuando vayas a realizar modificaciones en el código, te sugerimos seguir este flujo de trabajo estándar y seguro:

### 1. Crear una Rama para tu Cambio
No trabajes directamente sobre la rama `main`. Crea una rama limpia y descriptiva para tus cambios:
```bash
git checkout -b feature/nombre-de-tu-mejora
```

### 2. Realizar Cambios y Validar Localmente
Realiza tus modificaciones de código en la carpeta `src/`.
- Verifica que el servidor (`pnpm start:dev`) compile sin errores.
- Ejecuta los tests con `pnpm test` y asegúrate de que todo pase al 100%.

### 3. Confirmar tus Cambios (Git Commit)
Cuando todo esté listo y probado, prepara tus archivos y realiza un commit:
```bash
# 1. Comprobar qué archivos han sido modificados o agregados
git status

# 2. Agregar los archivos específicos que modificaste
git add src/ruta/al/archivo.ts

# 3. Crear el commit con un mensaje descriptivo (estilo Semantic Commits)
git commit -m "feat: agregar validación adicional en el módulo de productos"
```

### 4. Crear una Nueva Versión (Merge y Tag)
Una vez que tus cambios han sido aprobados y deseas integrarlos y generar una nueva versión del proyecto:

```bash
# 1. Volver a la rama principal
git checkout main

# 2. Asegurarse de tener la última versión de main
git pull origin main

# 3. Fusionar tu rama de cambios
git merge feature/nombre-de-tu-mejora

# 4. Crear una etiqueta (tag) para la nueva versión (ej: v1.1.0)
git tag -a v1.1.0 -m "Versión 1.1.0: Añadida funcionalidad X"

# 5. Subir los cambios y la nueva etiqueta al repositorio remoto
git push origin main --follow-tags
```

---

## 🔒 Estructura del Backend y Características de Seguridad

- **Baja Lógica**: Las peticiones de eliminación de productos (`DELETE /products/:id`) no eliminan físicamente los datos, sino que cambian su estado (`isActive = false`) para preservar la integridad de la base de datos.
- **Auto-Semilla (Seeding)**: En el primer arranque, la aplicación crea automáticamente el usuario Administrador y genera la clave de API inicial para Herb de forma automática basándose en las variables del archivo `.env`.
- **Autenticación Combinada**: Los endpoints de `/products` aceptan tanto tokens JWT (cabecera `Authorization: Bearer <token>`) como ApiKeys (cabecera `x-api-key` o `Authorization: ApiKey <key>`).
