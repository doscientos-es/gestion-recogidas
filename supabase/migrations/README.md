# Migraciones

Las migraciones versionadas crean el estado compartido de operaciones y el almacén de
correos entrantes. Antes de usar la aplicación:

1. Aplica las migraciones al proyecto autorizado.
2. Configura los usuarios autorizados en Supabase Auth.
3. Configura únicamente la URL y publishable key públicas en Vercel.

No guardes dumps, datos reales, service roles ni otros secretos en esta carpeta.
