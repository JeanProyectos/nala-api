# 📋 Cambios Pendientes - NALA

## ✅ Completados

1. ✅ **Error subir foto** - Carpetas creadas (`uploads/users`, `uploads/veterinarians`)
2. ✅ **Refrescar mascotas** - Agregado `useFocusEffect` para refrescar después de editar
3. ✅ **Formatear precios** - Creado `utils/formatPrice.js` y aplicado en perfil y veterinarios
4. ✅ **Calificación con estrellas** - Componente `StarRating.js` creado y modal agregado
5. ✅ **Más opciones asistencia guiada** - Agregadas: Mis consultas, Comunidad, Perfil
6. ✅ **Error imagen mis consultas** - Agregado `onError` handler
7. ✅ **TouchableOpacity** - Import agregado en pacientes.js

## ⚠️ Pendientes (Requieren Migración de BD)

### 3. Estado Disponible/No Disponible para Veterinarios

**Backend - Schema Prisma** (`prisma/schema.prisma`):
```prisma
model Veterinarian {
  // ... campos existentes ...
  isAvailable Boolean @default(true) // ✅ Agregar este campo
  // ... resto de campos ...
}
```

**Migración**:
```bash
cd nala-api
npx prisma migrate dev --name add_is_available_to_veterinarian
npx prisma generate
```

**Backend - DTO** (`src/veterinarians/dto/update-veterinarian.dto.ts`):
Ya está incluido porque extiende `CreateVeterinarianDto`

**Backend - Service** (`src/veterinarians/veterinarians.service.ts`):
Ya debería funcionar automáticamente

**Frontend - Editar Perfil** (`app/veterinario/editar-perfil.js`):
```javascript
// Agregar al formData inicial:
isAvailable: true,

// Agregar switch en el formulario:
<View style={styles.inputGroup}>
  <View style={styles.switchContainer}>
    <Text style={styles.label}>Disponible para consultas</Text>
    <Switch
      value={formData.isAvailable}
      onValueChange={(value) => setFormData({ ...formData, isAvailable: value })}
      trackColor={{ false: '#E0E0E0', true: '#8B7FA8' }}
      thumbColor={formData.isAvailable ? '#FFFFFF' : '#F4F3F4'}
    />
  </View>
</View>
```

**Frontend - Lista Veterinarios** (`app/(tabs)/consultar/veterinarios.js`):
```javascript
// Agregar badge de estado:
{vet.isAvailable ? (
  <View style={styles.availableBadge}>
    <Text style={styles.availableText}>✅ Disponible</Text>
  </View>
) : (
  <View style={styles.unavailableBadge}>
    <Text style={styles.unavailableText}>⏸️ No disponible</Text>
  </View>
)}
```

---

## 🔧 Cambios Aplicados que Necesitan Prueba

### 1. Subir Foto de Usuario/Veterinario
- ✅ Endpoints creados: `/upload/user-photo`, `/upload/veterinarian-photo`
- ✅ Carpetas creadas: `uploads/users`, `uploads/veterinarians`
- ⚠️ **Probar**: Subir foto desde la app

### 2. Formato de Precios
- ✅ Función `formatPrice()` creada
- ✅ Aplicada en perfil y veterinarios
- ⚠️ **Probar**: Verificar que muestra `50.000.00` en lugar de `50000`

### 3. Calificación con Estrellas
- ✅ Componente `StarRating.js` creado
- ✅ Modal agregado en `consulta-chat.js`
- ⚠️ **Probar**: Finalizar consulta y calificar

### 4. Refrescar Mascotas
- ✅ `useFocusEffect` agregado
- ⚠️ **Probar**: Editar mascota y verificar que se refresca la lista

---

## 📝 Notas

- Los filtros en comunidad ya están arreglados (más pequeños)
- El error de imagen en pacientes ya tiene handler de error
- La asistencia guiada ya tiene más opciones

---

**Última actualización**: 2026-03-02
