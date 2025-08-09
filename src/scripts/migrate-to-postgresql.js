const fs = require('fs').promises;
const path = require('path');

async function migrateData() {
  try {
    // Read existing JSON files
    const candidatesPath = path.join(process.cwd(), 'data', 'candidates.json');
    const timeSlotsPath = path.join(process.cwd(), 'data', 'time-slots.json');
    
    let candidates = [];
    let timeSlots = [];
    
    try {
      const candidatesData = await fs.readFile(candidatesPath, 'utf-8');
      candidates = JSON.parse(candidatesData);
    } catch (error) {
      console.log('No existing candidates.json file found');
    }
    
    try {
      const timeSlotsData = await fs.readFile(timeSlotsPath, 'utf-8');
      const slotsData = JSON.parse(timeSlotsData);
      timeSlots = slotsData.timeSlots || [];
    } catch (error) {
      console.log('No existing time-slots.json file found');
    }

    console.log(`Found ${candidates.length} candidates and ${timeSlots.length} time slots to migrate`);

    // Here you would add PostgreSQL insertion logic
    // This is just a template - you'll need to implement the actual database insertion
    
    console.log('Migration script template created');
    console.log('Please implement the actual database insertion logic');
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateData();