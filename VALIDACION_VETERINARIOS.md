# 🔍 SISTEMA DE VALIDACIÓN DE VETERINARIOS

## 📋 SITUACIÓN ACTUAL

Actualmente:
- ✅ Los veterinarios se registran con status `PENDING`
- ❌ **NO hay validación automática**
- ❌ **NO hay endpoint para que admin verifique**
- ⚠️ Solo veterinarios `ACTIVE` o `VERIFIED` pueden recibir consultas

---

## 🎯 OPCIONES DE VALIDACIÓN

### **OPCIÓN 1: Validación Manual por Admin** ⭐ RECOMENDADA

**Cómo funciona:**
1. Veterinario se registra → Status: `PENDING`
2. Veterinario sube documentos (cédula profesional, diploma, etc.)
3. Admin revisa documentos manualmente
4. Admin aprueba/rechaza desde panel de administración

**Ventajas:**
- ✅ Control total sobre quién puede ser veterinario
- ✅ Verificación de documentos reales
- ✅ Implementación simple
- ✅ No requiere APIs externas

**Desventajas:**
- ⚠️ Requiere tiempo del admin
- ⚠️ No es automático

---

### **OPCIÓN 2: Validación Automática con Wompi**

**Cómo funciona:**
1. Veterinario hace onboarding en Wompi
2. Wompi valida identidad (KYC - Know Your Customer)
3. Si Wompi aprueba → Status automático: `VERIFIED`
4. Si Wompi rechaza → Status: `REJECTED`

**Ventajas:**
- ✅ Automático
- ✅ Wompi ya valida identidad para subcuentas
- ✅ Confiable (Wompi es regulado)

**Desventajas:**
- ⚠️ No valida que sea veterinario real
- ⚠️ Solo valida identidad, no título profesional

---

### **OPCIÓN 3: Híbrida (Documentos + Wompi)** ⭐⭐ MEJOR

**Cómo funciona:**
1. Veterinario se registra → Status: `PENDING`
2. Veterinario sube documentos:
   - Cédula profesional
   - Diploma universitario
   - Foto de identificación
3. Veterinario hace onboarding en Wompi (valida identidad)
4. Admin revisa documentos
5. Si ambos OK → Status: `VERIFIED`

**Ventajas:**
- ✅ Valida identidad (Wompi)
- ✅ Valida título profesional (Admin)
- ✅ Máxima seguridad

**Desventajas:**
- ⚠️ Más pasos
- ⚠️ Requiere implementación de subida de documentos

---

## 🚀 RECOMENDACIÓN: OPCIÓN 1 + MEJORAS

### Implementar:

1. **Sistema de Documentos:**
   - Campo en `Veterinarian`: `verificationDocuments` (JSON)
   - Endpoint para subir documentos
   - Almacenar en `/uploads/veterinarians/{id}/`

2. **Panel de Admin:**
   - Endpoint: `PUT /admin/veterinarians/:id/verify`
   - Lista de veterinarios pendientes
   - Ver documentos antes de aprobar

3. **Notificaciones:**
   - Email al veterinario cuando es aprobado/rechazado
   - Notificación push si está disponible

---

## 📝 CAMPOS A AGREGAR AL MODELO

```prisma
model Veterinarian {
  // ... campos existentes
  
  // Documentos de verificación
  verificationDocuments Json? // { cedula: "url", diploma: "url", id: "url" }
  verificationNotes     String? // Notas del admin al rechazar
  verifiedAt           DateTime? // Fecha de verificación
  verifiedBy           Int? // ID del admin que verificó
}
```

---

## 🔐 FLUJO RECOMENDADO

```
1. Usuario se registra como VET
   ↓
2. Completa perfil de veterinario
   ↓
3. Sube documentos (cédula, diploma)
   ↓
4. Status: PENDING (esperando verificación)
   ↓
5. Admin revisa documentos
   ↓
6a. Si OK → Status: VERIFIED → Puede recibir consultas
6b. Si NO → Status: REJECTED → No puede recibir consultas
```

---

## 💡 ALTERNATIVA RÁPIDA (Sin documentos)

Si quieres algo más simple ahora:

1. **Validación básica por email:**
   - Veterinario debe usar email institucional (@universidad.edu, @clinicavet.com)
   - O verificar con código enviado por email

2. **Validación por primera consulta:**
   - Veterinario empieza con status `PENDING`
   - Después de X consultas exitosas → `VERIFIED` automático

3. **Sistema de referencias:**
   - Otro veterinario verificado puede referir a uno nuevo
   - Después de X referencias → `VERIFIED`

---

## ❓ PREGUNTA PARA TI

**¿Qué prefieres?**

A) **Validación manual por admin** (más control, requiere tu tiempo)
B) **Validación automática con Wompi** (rápido, pero solo valida identidad)
C) **Híbrida** (máxima seguridad, más trabajo)
D) **Validación básica** (email institucional o referencias)

**¿Quieres que implemente alguna de estas opciones?**
