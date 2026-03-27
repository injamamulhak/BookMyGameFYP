const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Seed Sports Categories
  console.log('\nSeeding Sports Categories...')
  const sports = await Promise.all([
    prisma.sport.upsert({
      where: { name: 'Football' },
      update: {},
      create: {
        name: 'Football',
        description:
          'Football and Futsal courts for competitive and recreational play',
        iconUrl: '/icons/football.svg',
        isActive: true,
      },
    }),
    prisma.sport.upsert({
      where: { name: 'Basketball' },
      update: {},
      create: {
        name: 'Basketball',
        description: 'Indoor and outdoor basketball courts',
        iconUrl: '/icons/basketball.svg',
        isActive: true,
      },
    }),
    prisma.sport.upsert({
      where: { name: 'Cricket' },
      update: {},
      create: {
        name: 'Cricket',
        description: 'Cricket grounds with nets and practice facilities',
        iconUrl: '/icons/cricket.svg',
        isActive: true,
      },
    }),
  ])

  console.log(`Created ${sports.length} sports categories`)

  // Optional: Seed a default admin user
  console.log('\n👤 Seeding Default Admin User...')
  const bcrypt = require('bcrypt')
  const adminPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookmygame.com' },
    update: {},
    create: {
      email: 'admin@bookmygame.com',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      phone: '9841234567',
      role: 'admin',
      isVerified: true,
    },
  })

  console.log(`Created admin user: ${admin.email}`)
  console.log('   Default password: admin123')

  console.log('\nDatabase seeding completed successfully!')
  console.log('\nSummary:')
  console.log(`   - Sports: ${sports.length}`)
  console.log(`   - Admin Users: 1`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
