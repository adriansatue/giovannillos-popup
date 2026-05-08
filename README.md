# Giovannillo's Pizza · Sistema de Registro de Evento

## Qué hace esto

- **`/`** → Formulario de registro (el que va detrás del QR)
- **`/entrada.html`** → Panel del equipo de puerta (tiempo real, validar asistentes)
- **`/api/register`** → Guarda registros en base de datos
- **`/api/registros`** → Devuelve lista de registros al panel
- **`/api/validar`** → Marca a alguien como validado

---

## Despliegue en Vercel (10 minutos)

### 1. Instala Vercel CLI
```bash
npm install -g vercel
```

### 2. Sube el proyecto
```bash
cd giovannillos
vercel
```
Sigue el asistente: nuevo proyecto, sin framework, directorio raíz `/`.

### 3. Crea la base de datos KV (gratuita)
En el dashboard de Vercel:
1. Ve a tu proyecto → **Storage** → **Create Database** → **KV**
2. Nombre: `giovannillos-kv`
3. Clic en **Connect to Project**

Vercel inyecta automáticamente las variables de entorno necesarias (`KV_URL`, `KV_REST_API_URL`, etc.).

### 4. Redespliega para que coja las variables
```bash
vercel --prod
```

### 5. Genera el QR
Ve a [qr.new](https://qr.new) e introduce la URL de tu proyecto:
```
https://tu-proyecto.vercel.app
```
Descarga el QR e imprímelo para el evento.

### 6. Panel de entrada (equipo de puerta)
Comparte esta URL solo con el equipo:
```
https://tu-proyecto.vercel.app/entrada.html
```

---

## Estructura de archivos

```
giovannillos/
├── public/
│   ├── index.html      ← Formulario de registro (QR)
│   └── entrada.html    ← Panel de validación (puerta)
├── api/
│   ├── register.js     ← POST /api/register
│   ├── registros.js    ← GET  /api/registros
│   └── validar.js      ← POST /api/validar
├── package.json
└── vercel.json
```

---

## Notas

- La base de datos KV de Vercel es gratuita hasta 30.000 requests/mes y 256MB — más que suficiente para un evento.
- Los registros persisten indefinidamente. Puedes ver todos los datos en Vercel → Storage → tu KV store.
- Para exportar la lista después del evento: en el dashboard de Vercel KV puedes ver todos los pares clave-valor, o añadir un endpoint `/api/export` que devuelva el CSV.
- El panel de entrada se actualiza solo cada 4 segundos. No hace falta refrescar.
