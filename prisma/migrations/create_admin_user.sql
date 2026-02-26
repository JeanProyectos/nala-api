-- Script para crear un usuario ADMIN
-- Ejecutar en pgAdmin o cualquier cliente PostgreSQL

-- IMPORTANTE: Cambia estos valores antes de ejecutar
-- Reemplaza 'admin@nala.com' con el email que quieras usar
-- Reemplaza 'Admin123!' con la contraseña que quieras usar

-- La contraseña se encripta con bcrypt (hash de ejemplo, debes generar uno real)
-- Para generar el hash correcto, puedes usar: https://bcrypt-generator.com/
-- O ejecutar en Node.js: const bcrypt = require('bcrypt'); bcrypt.hash('tu_password', 10).then(console.log)

-- Ejemplo de uso:
-- 1. Genera el hash de tu contraseña
-- 2. Reemplaza 'admin@nala.com' con tu email
-- 3. Reemplaza el hash de ejemplo con el hash real de tu contraseña
-- 4. Ejecuta el script

INSERT INTO "User" (email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin@nala.com',  -- Cambia este email
  '$2b$10$EjemploHashAquiReemplazarConHashReal',  -- Cambia este hash con el hash real de tu contraseña
  'Administrador',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'ADMIN', "isActive" = true;

-- Verificar que se creó correctamente
SELECT id, email, name, role, "isActive" FROM "User" WHERE role = 'ADMIN';
