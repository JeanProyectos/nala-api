# 🔍 Dónde Agregar el Hostname en Cloudflare

## 📍 Ubicación Actual

Estás viendo el panel de detalles del túnel `mundialpet-tunnel`.

**Routes:** `--` (confirma que no hay hostnames configurados)

## 🔎 Dónde Buscar "Public Hostnames"

### Opción 1: Botón "Edit"

1. **Click en el botón "Edit"** (arriba a la derecha del panel)
2. Esto puede abrir una página de configuración donde puedes agregar hostnames

### Opción 2: Tabs/Pestañas

Busca **tabs o pestañas** arriba del panel de detalles:
- **"Public Hostnames"**
- **"Routes"**
- **"Ingress"**
- **"Configuration"**

Click en cualquiera de estos para ver/agregar hostnames.

### Opción 3: Menú Lateral "Routes"

1. En el **menú lateral izquierdo**, busca **"Routes"**
2. Está debajo de **"Networks"** → **"Routes"**
3. Click en **"Routes"**
4. Esto muestra todos los hostnames de todos los túneles
5. Puedes agregar uno nuevo desde ahí

### Opción 4: Desde la Tabla Principal

1. Vuelve a la tabla principal de túneles
2. Busca un botón o link que diga **"Configure"** o **"Manage routes"**
3. O busca un icono de engranaje/configuración en la fila del túnel

## ✅ Pasos Recomendados (en orden)

### Intento 1: Click en "Edit"
1. Click en **"Edit"** (botón azul arriba a la derecha)
2. Busca sección de **"Public Hostnames"** o **"Routes"**

### Intento 2: Menú Lateral "Routes"
1. En el menú izquierdo, click en **"Routes"** (debajo de Networks)
2. Click en **"+ Add a route"** o **"+ Add a public hostname"**
3. Selecciona el túnel: `mundialpet-tunnel`
4. Configura el hostname

### Intento 3: Buscar Tabs
1. Arriba del panel de detalles, busca tabs
2. Click en **"Public Hostnames"** o **"Routes"**

## 📝 Configuración del Hostname

Cuando encuentres dónde agregar, configura:

- **Subdomain:** `nala-api`
- **Domain:** `patasypelos.xyz`
- **Service:** `http://127.0.0.1:3000`
- **Path:** (vacío)
- **HTTP Host Header:** `nala-api.patasypelos.xyz` (opcional)

## 🎯 Ubicación Más Probable

**La opción más probable es:**
1. **Menú lateral izquierdo** → **"Routes"** (debajo de Networks)
2. O **Click en "Edit"** del túnel

---

**✅ Prueba primero: Click en "Edit" o busca "Routes" en el menú lateral**
