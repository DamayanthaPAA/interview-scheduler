import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { initializeDatabase, populateTimeSlots } from '@/lib/db'

interface TimeSlot {
  id: number
  slot_id: string
  date: string
  time: string
  day: string
  taken: boolean
  taken_by: string | null
  taken_at: string | null
}

// Initialize database on first API call
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    await populateTimeSlots()
    dbInitialized = true
  }
}

export async function GET() {
  try {
    await ensureDbInitialized()
    
    const result = await pool.query(`
      SELECT slot_id, date, time, day, taken, taken_by, taken_at
      FROM time_slots 
      WHERE taken = FALSE
      ORDER BY date, time
    `)
    
    const availableSlots = result.rows.map(row => ({
      id: row.slot_id,
      date: row.date,
      time: row.time,
      day: row.day,
      taken: row.taken,
      takenBy: row.taken_by,
      takenAt: row.taken_at
    }))

    const totalResult = await pool.query('SELECT COUNT(*) FROM time_slots')
    const totalSlots = parseInt(totalResult.rows[0].count)

    return NextResponse.json({
      availableSlots,
      totalAvailable: availableSlots.length,
      totalSlots
    })
  } catch (error) {
    console.error('Error reading time slots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const { slotId, candidateId } = await request.json()
    
    if (!slotId || !candidateId) {
      return NextResponse.json(
        { error: 'Slot ID and Candidate ID are required' },
        { status: 400 }
      )
    }

    // Start transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // Check if slot exists and is available
      const slotResult = await client.query(
        'SELECT slot_id, taken FROM time_slots WHERE slot_id = $1 FOR UPDATE',
        [slotId]
      )
      
      if (slotResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Time slot not found' },
          { status: 404 }
        )
      }
      
      if (slotResult.rows[0].taken) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Time slot is already taken' },
          { status: 409 }
        )
      }

      // Mark slot as taken
      await client.query(
        `UPDATE time_slots 
         SET taken = TRUE, taken_by = $1, taken_at = CURRENT_TIMESTAMP 
         WHERE slot_id = $2`,
        [candidateId, slotId]
      )

      await client.query('COMMIT')

      // Get updated slot info
      const updatedSlotResult = await client.query(
        'SELECT slot_id, date, time, day, taken, taken_by, taken_at FROM time_slots WHERE slot_id = $1',
        [slotId]
      )

      const slot = updatedSlotResult.rows[0]

      return NextResponse.json({
        message: 'Time slot booked successfully',
        slot: {
          id: slot.slot_id,
          date: slot.date,
          time: slot.time,
          day: slot.day,
          taken: slot.taken,
          takenBy: slot.taken_by,
          takenAt: slot.taken_at
        }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error booking time slot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}