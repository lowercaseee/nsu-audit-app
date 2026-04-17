require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('./models/Program');

const programs = [
  {
    name: 'Computer Science & Engineering',
    degree: 'Bachelor of Science (BS)',
    totalCredits: 130,
    mandatoryGed: ['ENG102', 'ENG103', 'HIS103', 'PHI101'],
    coreMath: ['MAT116', 'MAT120', 'MAT250', 'MAT350', 'MAT361'],
    majorCore: ['CSE115', 'CSE173', 'CSE215', 'CSE225', 'CSE231', 'CSE311', 'CSE323', 'CSE327', 'CSE331', 'CSE332', 'CSE425']
  },
  {
    name: 'Business Administration',
    degree: 'Bachelor of Business Administration (BBA)',
    totalCredits: 124,
    mandatoryGed: ['ENG102', 'ENG103', 'HIS103', 'PHI101', 'ENV203'],
    coreBusiness: ['ACT201', 'ACT202', 'FIN254', 'MGT210', 'MGT314', 'MGT368', 'MKT202'],
    majorCore: ['BUS101', 'BUS112', 'BUS134', 'MIS205', 'QM212']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
    
    await Program.deleteMany({});
    console.log('Cleared existing programs');
    
    await Program.insertMany(programs);
    console.log('Programs seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
