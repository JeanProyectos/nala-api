@echo off
echo ========================================
echo   EJECUTAR SCRIPT SQL CON PSQL
echo ========================================
echo.

REM Usar la ruta completa de psql.exe
set PSQL_PATH="C:\Program Files\PostgreSQL\17\bin\psql.exe"

echo Ejecutando script SQL...
echo.
echo NOTA: Se te pedira la contraseña de PostgreSQL
echo Contrasena por defecto: postgres
echo.

%PSQL_PATH% -U postgres -d nala -f "prisma\migrations\manual_migration.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Script SQL ejecutado correctamente
    echo ========================================
    echo.
    echo Ahora ejecuta en tu terminal:
    echo   npx prisma migrate dev --name add_marketplace_payments
    echo.
) else (
    echo.
    echo ERROR: Fallo la ejecucion del script SQL
    echo.
    echo Alternativa: Usa pgAdmin (mas facil)
    echo Ver: EJECUTAR_SQL_PGADMIN.md
    echo.
)

pause
