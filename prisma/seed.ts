import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.examResult.deleteMany({});
  await prisma.gallery.deleteMany({});
  await prisma.video.deleteMany({});
  await prisma.studentDemographic.deleteMany({});
  await prisma.contactCard.deleteMany({});
  await prisma.contactMessage.deleteMany({});
  await prisma.schoolSetting.deleteMany({});
  await prisma.admin.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create admin
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);
  await prisma.admin.create({
    data: {
      fullName: 'Super Admin',
      username: 'admin',
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
    },
  });
  console.log('✅ Admin created: admin@school.com / admin123');

  // Seed exam results — 6-year history (2020–2025) for all 3 categories
  const examData = [
    { examType: 'SCHOLARSHIP', year: 2020, totalSat: 49, totalPassed: 2, districtRank: '1st' },
    { examType: 'SCHOLARSHIP', year: 2021, totalSat: 52, totalPassed: 6, districtRank: '2nd' },
    { examType: 'SCHOLARSHIP', year: 2022, totalSat: 34, totalPassed: 6, districtRank: '3rd' },
    { examType: 'SCHOLARSHIP', year: 2023, totalSat: 42, totalPassed: 7, districtRank: '1st' },
    { examType: 'SCHOLARSHIP', year: 2024, totalSat: 44, totalPassed: 5, districtRank: '2nd' },
    { examType: 'SCHOLARSHIP', year: 2025, totalSat: 48, totalPassed: 6, districtRank: '1st' },
    { examType: 'O/L', year: 2020, totalSat: 35, totalPassed: 32, districtRank: '3rd' },
    { examType: 'O/L', year: 2021, totalSat: 39, totalPassed: 35, districtRank: '2nd' },
    { examType: 'O/L', year: 2022, totalSat: 26, totalPassed: 24, districtRank: '4th' },
    { examType: 'O/L', year: 2023, totalSat: 43, totalPassed: 36, districtRank: '5th' },
    { examType: 'O/L', year: 2024, totalSat: 38, totalPassed: 34, districtRank: '3rd' },
    { examType: 'O/L', year: 2025, totalSat: 38, totalPassed: 28, districtRank: '6th' },
    { examType: 'A/L', year: 2020, totalSat: 9, totalPassed: 5, districtRank: '7th' },
    { examType: 'A/L', year: 2021, totalSat: 13, totalPassed: 6, districtRank: '6th' },
    { examType: 'A/L', year: 2022, totalSat: 17, totalPassed: 10, districtRank: '5th' },
    { examType: 'A/L', year: 2023, totalSat: 6, totalPassed: 1, districtRank: '10th' },
    { examType: 'A/L', year: 2024, totalSat: 4, totalPassed: 1, districtRank: '12th' },
    { examType: 'A/L', year: 2025, totalSat: 8, totalPassed: 3, districtRank: '8th' },
  ];

  for (const item of examData) {
    const passPercentage = item.totalSat > 0
      ? parseFloat(((item.totalPassed / item.totalSat) * 100).toFixed(2))
      : 0;
    await prisma.examResult.create({ data: { ...item, passPercentage } });
  }
  console.log(`✅ Seeded ${examData.length} exam results`);

  // Seed gallery items — all photo categories with hosted image URLs
  const galleryData = [
    { title: 'Sports Day Sprint', category: 'Sports', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTg1dXwhS1JpDzVaMmrRnKYA3225JkxH07UrIz70ooewDYtV6wQ_hqFEXU&s=10', description: 'Students sprinting on the track during the annual sports meet.' },
    { title: 'Annual Sports Meet', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=600&h=400&fit=crop', description: 'Highlights from the school sports day ceremony.' },
    { title: 'Inter-House Cricket Match', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&h=400&fit=crop', description: 'Students competing in an inter-house cricket match.' },
    { title: 'Volleyball Tournament', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&h=400&fit=crop', description: 'Action from the school volleyball tournament.' },
    { title: 'Athletic Championship', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop', description: 'Students excelling at the athletic championship.' },
    { title: 'Football Training Session', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop', description: 'Afternoon football training with the school team.' },
    { title: 'Modern Classroom', category: 'Academics', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop', description: 'A modern, well-equipped classroom at our school.' },
    { title: 'Students Studying Together', category: 'Academics', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop', description: 'Students collaborating during a study session.' },
    { title: 'Computer Laboratory', category: 'Academics', imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop', description: 'State-of-the-art computer unit with 10 workstations.' },
    { title: 'Science Laboratory', category: 'Academics', imageUrl: 'https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=600&h=400&fit=crop', description: 'Modernized science laboratory with engaging educational displays.' },
    { title: 'Science Exhibition', category: 'Academics', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=400&fit=crop', description: 'Student projects showcased at the science exhibition.' },
    { title: 'Library Reading Session', category: 'Academics', imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop', description: 'Students enjoying reading time in the school library.' },
    { title: 'Graduation Ceremony', category: 'Events', imageUrl: 'https://media.istockphoto.com/id/1480277406/photo/graduation-group-and-back-view-of-students-celebrate-education-success-behind-of-excited.jpg?s=612x612&w=0&k=20&c=KRfzU9eeBsUdCNUXQSIx4yf6O2PlMD9XvckFgx-hndc=', description: 'Celebrating the success of our graduating students.' },
    { title: 'Cultural Day Performance', category: 'Events', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop', description: 'Traditional cultural performances at the school event.' },
    { title: 'Annual Festival', category: 'Events', imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop', description: 'The vibrant annual school festival celebration.' },
    { title: 'Music Performance', category: 'Events', imageUrl: 'https://t4.ftcdn.net/jpg/08/88/09/21/360_F_888092109_NgbtxV6c2Ms2Ea9r6wfTQavMQ4IxDFkz.jpg', description: 'Students performing at the school music recital.' },
    { title: 'Art Exhibition', category: 'Events', imageUrl: 'https://www.shutterstock.com/editorial/image-editorial/M5TaA4x7NbD1gaycMzg4MDY=/sri-lankan-school-children-viewing-paintings-during-440nw-10070753b.jpg', description: 'Students admiring artwork at the all-island art exhibition.' },
    { title: 'Morning School Assembly', category: 'Events', imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop', description: 'Students gathered for the morning school assembly.' },
  ];

  for (const item of galleryData) {
    await prisma.gallery.create({ data: item });
  }
  console.log(`✅ Seeded ${galleryData.length} gallery items`);

  // Seed videos / event highlights
  const videoData = [
    {
      title: 'School Sports Meet',
      videoUrl: 'https://www.youtube.com/watch?v=bEd39JYEB1c',
      description: 'Annual school sports meet — marching band and athletics highlights.',
      thumbnailUrl: 'https://img.youtube.com/vi/bEd39JYEB1c/maxresdefault.jpg',
    },
    {
      title: 'Prize Giving Ceremony',
      videoUrl: 'https://www.youtube.com/watch?v=1bEmkfLIGrQ',
      description: 'Annual prize giving ceremony and traditional cultural performances.',
      thumbnailUrl: 'https://img.youtube.com/vi/1bEmkfLIGrQ/maxresdefault.jpg',
    },
    {
      title: 'Inter-School Exhibition',
      videoUrl: 'https://www.youtube.com/watch?v=3snQH9HnMA8',
      description: 'Student projects and achievements displayed at the inter-school exhibition.',
      thumbnailUrl: 'https://img.youtube.com/vi/3snQH9HnMA8/maxresdefault.jpg',
    },
  ];

  for (const item of videoData) {
    await prisma.video.create({ data: item });
  }
  console.log(`✅ Seeded ${videoData.length} videos`);

  // Seed student demographics
  const demographicData = [
    { grade: '1', femaleCount: 14, maleCount: 15, section: 'Primary' },
    { grade: '2', femaleCount: 19, maleCount: 17, section: 'Primary' },
    { grade: '3A', femaleCount: 9, maleCount: 15, section: 'Primary' },
    { grade: '3B', femaleCount: 9, maleCount: 13, section: 'Primary' },
    { grade: '4', femaleCount: 15, maleCount: 10, section: 'Primary' },
    { grade: '5A', femaleCount: 13, maleCount: 10, section: 'Primary' },
    { grade: '5B', femaleCount: 13, maleCount: 10, section: 'Primary' },
    { grade: '6A', femaleCount: 10, maleCount: 13, section: 'Secondary' },
    { grade: '6B', femaleCount: 11, maleCount: 12, section: 'Secondary' },
    { grade: '7A', femaleCount: 10, maleCount: 12, section: 'Secondary' },
    { grade: '7B', femaleCount: 15, maleCount: 9, section: 'Secondary' },
    { grade: '8A', femaleCount: 10, maleCount: 13, section: 'Secondary' },
    { grade: '8B', femaleCount: 10, maleCount: 13, section: 'Secondary' },
    { grade: '9', femaleCount: 16, maleCount: 17, section: 'Secondary' },
    { grade: '10A', femaleCount: 16, maleCount: 11, section: 'Secondary' },
    { grade: '10B', femaleCount: 13, maleCount: 11, section: 'Secondary' },
    { grade: '11A', femaleCount: 12, maleCount: 17, section: 'Secondary' },
    { grade: '11B', femaleCount: 11, maleCount: 14, section: 'Secondary' },
    { grade: '12', femaleCount: 5, maleCount: 9, section: 'Secondary' },
    { grade: '13', femaleCount: 8, maleCount: 2, section: 'Secondary' },
  ];

  for (const item of demographicData) {
    const totalCount = item.femaleCount + item.maleCount;
    await prisma.studentDemographic.create({ data: { ...item, totalCount } });
  }
  console.log(`✅ Seeded ${demographicData.length} student demographics`);

  // Seed contact info cards
  const contactCardData = [
    { title: 'School Address', value: 'Bamunugama, Horapawita', icon: 'MapPin', order: 1 },
    { title: 'Principal', value: 'Mr. Chandika Jayawardena', icon: 'GraduationCap', order: 2 },
    { title: 'School Classification', value: '1C Mixed School', icon: 'Shield', order: 3 },
    { title: 'Established', value: 'May 9, 1913', icon: 'Calendar', order: 4 },
    { title: 'Identity Codes', value: 'Census no: 07230 | School no: 22028', icon: 'Award', order: 5 },
  ];

  for (const item of contactCardData) {
    await prisma.contactCard.create({ data: item });
  }
  console.log(`✅ Seeded ${contactCardData.length} contact cards`);

  // Seed school settings (map embed URL, school hours, footer contact info)
  const schoolSettingsData = [
    {
      key: 'google_map_url',
      value:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3967.064906502132!2d80.59037359999999!3d6.121966700000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae14502c340b65f%3A0x3af2502df58b54da!2sBamunugama%20Navodya%20School!5e0!3m2!1sen!2slk!4v1783256427052!5m2!1sen!2slk',
    },
    {
      key: 'school_hours',
      value:
        '[{"days":"Monday - Friday","time":"7:30 AM - 1:30 PM"},{"days":"Saturday","time":"7:30 AM - 12:00 PM"},{"days":"Sunday","time":"Closed"}]',
    },
    { key: 'footer_phone', value: '0413 001 026' },
    { key: 'footer_email', value: 'bmvmatara@gmail.com' },
    { key: 'footer_address', value: 'Bamunugama, Horapawita' },
  ];

  for (const item of schoolSettingsData) {
    await prisma.schoolSetting.create({ data: item });
  }
  console.log(`✅ Seeded ${schoolSettingsData.length} school settings`);

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin Login:');
  console.log('  Email:    admin@school.com');
  console.log('  Password: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });