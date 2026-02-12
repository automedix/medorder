import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@praxis.de' },
    update: {},
    create: {
      email: 'admin@praxis.de',
      passwordHash: adminPassword,
      name: 'Praxis Admin'
    }
  })
  console.log('Admin created:', admin.email)

  // Create sample care home
  const careHomePassword = await bcrypt.hash('demo123', 10)
  const careHome = await prisma.careHome.upsert({
    where: { email: 'demo@pflegeheim.de' },
    update: {},
    create: {
      email: 'demo@pflegeheim.de',
      passwordHash: careHomePassword,
      name: 'Muster-Pflegeheim GmbH',
      contactPerson: 'Maria Müller',
      phone: '030-12345678',
      address: 'Musterstraße 1, 12345 Berlin'
    }
  })
  console.log('CareHome created:', careHome.email)

  // Create categories
  const categories = [
    { name: 'Pflaster und Wundauflagen', sortOrder: 1 },
    { name: 'Verbände und Binden', sortOrder: 2 },
    { name: 'Desinfektion', sortOrder: 3 },
    { name: 'Spritzen und Kanülen', sortOrder: 4 },
    { name: 'Handschuhe und Schutz', sortOrder: 5 }
  ]

  for (const cat of categories) {
    const exists = await prisma.category.findFirst({ where: { name: cat.name } })
    if (!exists) {
      await prisma.category.create({ data: cat })
    }
  }
  console.log('Categories created')

  // Get category IDs
  const catPflaster = await prisma.category.findFirst({ where: { name: 'Pflaster und Wundauflagen' } })
  const catVerbaende = await prisma.category.findFirst({ where: { name: 'Verbände und Binden' } })
  const catDesinfektion = await prisma.category.findFirst({ where: { name: 'Desinfektion' } })
  const catSpritzen = await prisma.category.findFirst({ where: { name: 'Spritzen und Kanülen' } })
  const catHandschuhe = await prisma.category.findFirst({ where: { name: 'Handschuhe und Schutz' } })

  // Create sample products
  const products = [
    // Pflaster
    { name: 'Injektionspflaster 2x4 cm', unit: 'Stück', categoryId: catPflaster!.id },
    { name: 'Wundschnellverband 6x10 cm', unit: 'Stück', categoryId: catPflaster!.id },
    { name: 'Wundpflaster elastisch 4x5 cm', unit: 'Stück', categoryId: catPflaster!.id },
    { name: 'Mullkompressen steril 10x10 cm', unit: 'Stück', categoryId: catPflaster!.id },
    
    // Verbände
    { name: 'Mullbinden 4 m x 6 cm', unit: 'Rolle', categoryId: catVerbaende!.id },
    { name: 'Mullbinden 4 m x 8 cm', unit: 'Rolle', categoryId: catVerbaende!.id },
    { name: 'Elastische Binde 5 m x 8 cm', unit: 'Rolle', categoryId: catVerbaende!.id },
    { name: 'Netzschlauchverband Gr. 3', unit: 'Stück', categoryId: catVerbaende!.id },
    
    // Desinfektion
    { name: 'Desinfektionstücher', unit: 'Packung', categoryId: catDesinfektion!.id },
    { name: 'Octenisept Lösung 250 ml', unit: 'Flasche', categoryId: catDesinfektion!.id },
    { name: 'Sterillium 500 ml', unit: 'Flasche', categoryId: catDesinfektion!.id },
    
    // Spritzen
    { name: 'Einmalspritzen 2 ml', unit: 'Stück', categoryId: catSpritzen!.id },
    { name: 'Einmalspritzen 5 ml', unit: 'Stück', categoryId: catSpritzen!.id },
    { name: 'Einmalspritzen 10 ml', unit: 'Stück', categoryId: catSpritzen!.id },
    { name: 'Kanülen 0,6x25 mm (23G)', unit: 'Stück', categoryId: catSpritzen!.id },
    { name: 'Kanülen 0,8x40 mm (21G)', unit: 'Stück', categoryId: catSpritzen!.id },
    
    // Handschuhe
    { name: 'Untersuchungshandschuhe S', unit: 'Box (100 Stk)', categoryId: catHandschuhe!.id },
    { name: 'Untersuchungshandschuhe M', unit: 'Box (100 Stk)', categoryId: catHandschuhe!.id },
    { name: 'Untersuchungshandschuhe L', unit: 'Box (100 Stk)', categoryId: catHandschuhe!.id },
    { name: 'Schutzmaske OP-Type IIR', unit: 'Stück', categoryId: catHandschuhe!.id }
  ]

  for (const prod of products) {
    const exists = await prisma.product.findFirst({ where: { name: prod.name } })
    if (!exists) {
      await prisma.product.create({ data: prod })
    }
  }
  console.log('Products created')

  // Create sample prices for some products
  const kompressen = await prisma.product.findFirst({ where: { name: 'Mullkompressen steril 10x10 cm' } })
  const spritzen5ml = await prisma.product.findFirst({ where: { name: 'Einmalspritzen 5 ml' } })
  const handschuheM = await prisma.product.findFirst({ where: { name: 'Untersuchungshandschuhe M' } })
  const sterillium = await prisma.product.findFirst({ where: { name: 'Sterillium 500 ml' } })

  const samplePrices = [
    // Mullkompressen
    { productId: kompressen!.id, pzn: '01234567', supplier: 'Apotheke am Park', price: 4.99, packSize: '50 Stück' },
    { productId: kompressen!.id, pzn: '12345678', supplier: 'MediMax GmbH', price: 4.49, packSize: '50 Stück' },
    { productId: kompressen!.id, pzn: '23456789', supplier: 'MediCare Plus', price: 3.99, packSize: '50 Stück' },
    { productId: kompressen!.id, pzn: '34567890', supplier: 'Sanitätshaus Schmidt', price: 5.29, packSize: '50 Stück' },
    
    // Spritzen
    { productId: spritzen5ml!.id, pzn: '45678901', supplier: 'Apotheke am Park', price: 0.15, packSize: '100 Stück' },
    { productId: spritzen5ml!.id, pzn: '56789012', supplier: 'MediMax GmbH', price: 0.12, packSize: '100 Stück' },
    { productId: spritzen5ml!.id, pzn: '67890123', supplier: 'MediCare Plus', price: 0.14, packSize: '100 Stück' },
    
    // Handschuhe
    { productId: handschuheM!.id, pzn: '78901234', supplier: 'Apotheke am Park', price: 8.99, packSize: '100 Stück' },
    { productId: handschuheM!.id, pzn: '89012345', supplier: 'MediMax GmbH', price: 7.99, packSize: '100 Stück' },
    { productId: handschuheM!.id, pzn: '90123456', supplier: 'Sanitätshaus Schmidt', price: 8.49, packSize: '100 Stück' },
    
    // Sterillium
    { productId: sterillium!.id, pzn: '11111111', supplier: 'Apotheke am Park', price: 12.99, packSize: '500 ml' },
    { productId: sterillium!.id, pzn: '22222222', supplier: 'MediCare Plus', price: 11.99, packSize: '500 ml' },
    { productId: sterillium!.id, pzn: '33333333', supplier: 'MediMax GmbH', price: 11.49, packSize: '500 ml' },
  ]

  for (const price of samplePrices) {
    try {
      await prisma.productPrice.create({ data: price })
    } catch (e) {
      // Price already exists, skip
    }
  }
  console.log('Sample prices created')

  console.log('\n✅ Seed completed!')
  console.log('\nLogin credentials:')
  console.log('  Admin: admin@praxis.de / admin123')
  console.log('  CareHome: demo@pflegeheim.de / demo123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
