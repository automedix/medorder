# Migration erstellen
npx prisma migrate dev --name init

# Migration auf Produktion anwenden
npx prisma migrate deploy

# Datenbank zurücksetzen (VORSICHT!)
npx prisma migrate reset

# Prisma Client neu generieren
npx prisma generate

# Datenbank-Studio (GUI)
npx prisma studio
