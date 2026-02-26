@echo off
echo ========================================
echo   MIGRACION MARKETPLACE PAYMENTS
echo ========================================
echo.

echo PASO 1: Verificando conexion a la base de datos...
echo.

REM Verificar si psql esta disponible
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: psql no esta instalado o no esta en el PATH
    echo.
    echo Por favor ejecuta el script SQL manualmente usando:
    echo - pgAdmin
    echo - DBeaver
    echo - O cualquier cliente PostgreSQL
    echo.
    echo Archivo: prisma\migrations\manual_migration.sql
    echo.
    pause
    exit /b 1
)

echo PASO 2: Ejecutando script SQL manual...
echo.
echo NOTA: Se te pedira la contraseña de PostgreSQL
echo Contrasena por defecto: postgres
echo.

psql -U postgres -d nala -f "prisma\migrations\manual_migration.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fallo la ejecucion del script SQL
    echo Por favor ejecuta el script manualmente
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Script SQL ejecutado correctamente
echo ========================================
echo.
echo PASO 3: Ahora ejecuta manualmente en tu terminal:
echo.
echo   npx prisma migrate dev --name add_marketplace_payments
echo.
echo IMPORTANTE: Debes ejecutarlo en una terminal interactiva
echo.
pause
