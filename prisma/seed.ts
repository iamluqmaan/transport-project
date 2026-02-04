
import { PrismaClient, VehicleType, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Cleanup existing data
  await prisma.booking.deleteMany()
  await prisma.route.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.transportCompany.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create Users
  const password = await bcrypt.hash('password123', 10)
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@transportng.com',
      password,
      role: Role.SUPER_ADMIN
    }
  })

  const customer = await prisma.user.create({
    data: {
      name: 'John Traveler',
      email: 'john@example.com',
      password,
      role: Role.CUSTOMER
    }
  })

  // 2. Create Transport Companies
  const gig = await prisma.transportCompany.create({
    data: {
      name: 'GIG Motors',
      description: 'The most technologically advanced transport company in Nigeria.',
      contactInfo: '08139851110',
      isActive: true,
    }
  })

  const abc = await prisma.transportCompany.create({
    data: {
      name: 'ABC Transport',
      description: 'Safety and comfort on wheels.',
      contactInfo: '0800ABC',
      isActive: true,
    }
  })

  const guo = await prisma.transportCompany.create({
    data: {
      name: 'GUO Transport',
      description: 'Your reliable travel partner.',
      contactInfo: '0800GUO',
      isActive: true,
    }
  })

  // 3. Create Vehicles
  const gigVehicle1 = await prisma.vehicle.create({
    data: {
      companyId: gig.id,
      plateNumber: 'GIG-101',
      type: VehicleType.SIENNA,
      capacity: 7
    }
  })

  const gigVehicle2 = await prisma.vehicle.create({
    data: {
      companyId: gig.id,
      plateNumber: 'GIG-202',
      type: VehicleType.BUS,
      capacity: 14
    }
  })

  const abcVehicle1 = await prisma.vehicle.create({
    data: {
      companyId: abc.id,
      plateNumber: 'ABC-505',
      type: VehicleType.LUXURY_COACH,
      capacity: 50
    }
  })
   const guoVehicle1 = await prisma.vehicle.create({
    data: {
      companyId: guo.id,
      plateNumber: 'GUO-707',
      type: VehicleType.SIENNA,
      capacity: 7
    }
  })

  // 4. Create Routes
  // Lagos -> Abuja
  await prisma.route.createMany({
    data: [
      {
        originState: 'Lagos',
        originCity: 'Jibowu',
        destinationState: 'Abuja',
        destinationCity: 'Utako',
        price: 35000,
        departureTime: new Date(new Date().setHours(7, 0, 0, 0)), // Today 7am
        estimatedDuration: 600, // 10 hours
        companyId: gig.id,
        vehicleId: gigVehicle1.id
      },
      {
        originState: 'Lagos',
        originCity: 'Iyana Ipaja',
        destinationState: 'Abuja',
        destinationCity: 'Utako',
        price: 32000,
        departureTime: new Date(new Date().setHours(8, 30, 0, 0)), 
        estimatedDuration: 630, 
        companyId: guo.id,
        vehicleId: guoVehicle1.id
      }
    ]
  })

  // Lagos -> Port Harcourt
  await prisma.route.create({
    data: {
        originState: 'Lagos',
        originCity: 'Amuwo Odofin',
        destinationState: 'Rivers',
        destinationCity: 'Port Harcourt',
        price: 28500,
        departureTime: new Date(new Date().setHours(7, 30, 0, 0)), 
        estimatedDuration: 540, 
        companyId: abc.id,
        vehicleId: abcVehicle1.id
    }
  })

  // Abuja -> Jos
   await prisma.route.create({
    data: {
        originState: 'Abuja',
        originCity: 'Mararaba',
        destinationState: 'Plateau',
        destinationCity: 'Jos',
        price: 5000,
        departureTime: new Date(new Date().setHours(14, 0, 0, 0)), 
        estimatedDuration: 180, // 3 hours
        companyId: gig.id,
        vehicleId: gigVehicle2.id
    }
  })


  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
