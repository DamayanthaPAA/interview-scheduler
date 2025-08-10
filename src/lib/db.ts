import { Pool } from 'pg';

const pool = new Pool({
  user: 'avnadmin',
  user: 'AVNS_te8ruMzMCOYjk5tYke8',
  host: 'pg-1dd676ae-anura-2218.j.aivencloud.com',
  port: 11962,
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: true,
    ca: `
-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUPznStfgCJZUPHmlD9b2ZNP/jyi4wDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1YWU4NmVhYzktNjIyYS00MGM5LThlNDYtY2IzYjkyNmY5
OGVkIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwNjI4MDk1OTM5WhcNMzUwNjI2MDk1
OTM5WjBAMT4wPAYDVQQDDDVhZTg2ZWFjOS02MjJhLTQwYzktOGU0Ni1jYjNiOTI2
Zjk4ZWQgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAMUDQ1ByhuSa2184zf8g9iEPwSUKnlW1nwczEBE8T3ivIR+qi7OH8ci6
/Db9rpW/wUyxlo24+wu+waDEBrJaGg6O3JTxow8mvI6XA7/Y8/wYuPGReajkgiGb
PDsCcqvUf8lZKoxyhHSjvkhdJrYJldL5jNnFfWMkDBSNvdOiWubcd7minI6M2/7H
/tVevJzdjfkZoDX5ZC0gr8HfzapHLh3MrnoFgEnkdMuO+MYXI4CZD4UMl9rJADZZ
zcwnsz6vxbSa0Yku7dFJQyD6StmAKTTPNznCsUDeW3U5mSvkYULvWV8mQs8U5cNW
MmxbvhTuz9hHX3nLh4rg8ollow0edRflalNYsO4nc9GjnrEY6kFB4Pqe+yFNbV+x
IkFmgDOSc6FxHC2x3JoA/KUMYkYf7AL0mP1HmsuWAhd47aqKvXTjpftULpOTuM3Z
meYhYspSVMouucPkMPdbTWs9VG/uL6viCfgSPR7PUfc2typz6sLPc+Zv/JUPnBXV
X2Egir1+0wIDAQABo0IwQDAdBgNVHQ4EFgQUJPUWi99d9T3sKHE4IkXufnUTHYgw
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBADmH54Fl9aCVWyghZZ/JhyDZvWMXHy8zHNV3M0f6/Rt20Hxei4SDRSPP8PI8
KbnDklAvlaaBUCoro8moogAIOXZuGaqbWhc4JvgW76Gpf+nXKgARsmjCQe0tT32P
C8a34zvn6ReCnBggQFuKe8an9ri2KzxZ1GxlUe9f9GjbqclaxyRlkAUS9+oUqGKi
YJDXv01nPJk1FfsaEI6M647a06O5mhWYQPYHn26zsUc5eHdHM0YzZ0uH2fDzYCyW
r2V6A2q9ofozKPNvJ/KJ7JRA9hS+uelUkwYdI1xVGwUSzOIG57R+2ZBYPAtmYb5u
Fcb1HSKvpxaN7sHmBtD8FHHJa9CjFd/heQ+rLtrI3nY0XlQt16z1eO9tc5gVVISJ
dvP1I7+HLuyDkjygoQMOf24hZgUB9vCckvQCu7E0BbeuvFbhNN08gU278f/xuB+e
v2Gh8RkJJWaLquc75Iwj48dkHt4oDIX4tKDkc9ncVNKAjlY5kiYNiO9Y9z19d2bp
AKXfmQ==
-----END CERTIFICATE-----
    `.trim(),
  },
});

// Database initialization functions
export const initializeDatabase = async () => {
  try {
    // Create candidates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        candidate_id VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        timezone VARCHAR(100) NOT NULL,
        experience TEXT,
        motivation TEXT,
        additional_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create time_slots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        slot_id VARCHAR(255) UNIQUE NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        day VARCHAR(50) NOT NULL,
        taken BOOLEAN DEFAULT FALSE,
        taken_by VARCHAR(255),
        taken_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create candidate_slots junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_slots (
        id SERIAL PRIMARY KEY,
        candidate_id VARCHAR(255) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
        slot_id VARCHAR(255) REFERENCES time_slots(slot_id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(candidate_id, slot_id)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Function to populate initial time slots
export const populateTimeSlots = async () => {
  try {
    // Check if time slots already exist
    const existingSlots = await pool.query('SELECT COUNT(*) FROM time_slots');
    if (parseInt(existingSlots.rows[0].count) > 0) {
      console.log('Time slots already populated');
      return;
    }

    const timeSlots = [];
    const startDate = new Date('2025-08-12');
    const endDate = new Date('2025-08-16');
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Only Monday to Friday (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateString = date.toISOString().split('T')[0];
        const dayName = daysOfWeek[dayOfWeek];
        
        // Generate time slots from 16:00 to 18:00 with 15-minute intervals
        for (let hour = 16; hour < 18; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const slotId = `${dateString}-${timeString}`;
            
            timeSlots.push({
              slot_id: slotId,
              date: dateString,
              time: timeString,
              day: dayName,
              taken: false,
              taken_by: null,
              taken_at: null
            });
          }
        }
      }
    }

    // Insert all time slots
    for (const slot of timeSlots) {
      await pool.query(`
        INSERT INTO time_slots (slot_id, date, time, day, taken, taken_by, taken_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [slot.slot_id, slot.date, slot.time, slot.day, slot.taken, slot.taken_by, slot.taken_at]);
    }

    console.log(`Successfully populated ${timeSlots.length} time slots`);
  } catch (error) {
    console.error('Error populating time slots:', error);
    throw error;
  }
};

export default pool;