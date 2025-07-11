import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a sample user
  const user = await prisma.user.upsert({
    where: { email: 'demo@cruise.com' },
    update: {},
    create: {
      email: 'demo@cruise.com',
      name: 'Demo User',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
  })

  // Create sample trips
  const sampleTrips = [
    {
      userId: user.id,
      origin: 'San Francisco, CA',
      destination: '1600 Amphitheatre Parkway, Mountain View, CA',
      routeData: JSON.stringify({
        distance: '45.2 km',
        duration: '45 min',
        steps: [
          { instruction: 'Head south on US-101', distance: '25.3 km' },
          { instruction: 'Take exit 398 for CA-85', distance: '12.1 km' },
          { instruction: 'Turn right onto Amphitheatre Parkway', distance: '0.8 km' },
        ],
      }),
      status: 'COMPLETED' as const,
    },
    {
      userId: user.id,
      origin: 'Mountain View, CA',
      destination: 'Palo Alto, CA',
      routeData: JSON.stringify({
        distance: '8.5 km',
        duration: '12 min',
        steps: [
          { instruction: 'Head north on CA-85', distance: '5.2 km' },
          { instruction: 'Take exit 15 for El Camino Real', distance: '2.1 km' },
          { instruction: 'Turn left onto University Ave', distance: '1.2 km' },
        ],
      }),
      status: 'ACTIVE' as const,
    },
  ]

  for (const trip of sampleTrips) {
    await prisma.trip.upsert({
      where: { id: `trip-${trip.origin}-${trip.destination}` },
      update: {},
      create: trip,
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 