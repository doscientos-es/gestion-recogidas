# Migraciones

La migración versionada crea `demo_workspaces`, el almacén JSON de la demo, con
RLS por `auth.uid()`. Antes de activar `VITE_DATA_MODE=supabase`:

1. Aplica las migraciones al proyecto autorizado.
2. Habilita los inicios de sesión anónimos en Supabase Auth.
3. Configura únicamente la URL y publishable key públicas en Vercel.

No guardes dumps, datos reales, service roles ni otros secretos en esta carpeta.
