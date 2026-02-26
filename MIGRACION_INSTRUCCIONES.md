# 📋 Instrucciones para Ejecutar las Migraciones

## ⚠️ IMPORTANTE: Ejecutar Migraciones de Prisma

Después de actualizar el schema de Prisma, necesitas ejecutar las migraciones para actualizar la base de datos.

### Pasos:

1. **Generar la migración:**
   ```bash
   cd "C:\Proyectos Jean Git\nala-api"
   npx prisma migrate dev --name add_health_modules
   ```

2. **Generar el Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Verificar que todo esté correcto:**
   ```bash
   npx prisma studio
   ```
   Esto abrirá Prisma Studio donde puedes ver todas las tablas.

### Cambios en el Schema:

- ✅ Agregado campo `photo` a modelo `Pet`
- ✅ Agregado campo `color` a modelo `Pet`
- ✅ Cambiado campo `sex` de String a enum `PetSex`
- ✅ Agregado campo `veterinary` a modelo `Vaccine`
- ✅ Creado modelo `Deworming` (Desparasitantes)
- ✅ Creado modelo `Allergy` (Alergias)
- ✅ Creado modelo `HealthHistory` (Historial de Salud)

### Nuevos Enums:

- `DewormingType`: INTERNAL, EXTERNAL
- `AllergyType`: FOOD, ENVIRONMENTAL, MEDICATION
- `SeverityLevel`: MILD, MODERATE, SEVERE

## 🚀 Reiniciar el Backend

Después de las migraciones, reinicia el backend:

```bash
npm run start:dev
```

## 📱 Probar en la App

1. Recarga la app Expo
2. Prueba registrar una nueva mascota con todos los campos
3. Prueba subir una foto
4. Ve a "Historial de Salud" y prueba todos los módulos:
   - Vacunas
   - Desparasitantes
   - Alergias
   - Historial de Salud
