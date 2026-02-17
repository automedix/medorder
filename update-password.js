const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateMasterPassword() {
  const newPasswordHash = '$2b$10$XKxfmxi.JPl42M5YGSXcYOkT807XBqd3tSKJTia7fXPHDMruuAiwG';
  
  try {
    // Update admin user
    const admin = await prisma.admin.updateMany({
      where: { email: 'admin@praxis.de' },
      data: { passwordHash: newPasswordHash }
    });
    
    console.log('Admin-Passwort aktualisiert:', admin.count > 0 ? '✅ Erfolg' : '⚠️ Admin nicht gefunden');
    
    // Zeige alle Admins
    const allAdmins = await prisma.admin.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log('\nAktive Admins:');
    allAdmins.forEach(a => console.log(`  - ${a.email} (${a.name})`));
    
  } catch (error) {
    console.error('Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateMasterPassword();