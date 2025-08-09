import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { initializeDatabase, populateTimeSlots } from '@/lib/db'

interface CandidateData {
  candidate_id: string
  full_name: string
  email: string
  phone: string | null
  timezone: string
  experience: string | null
  motivation: string | null
  additional_notes: string | null
  created_at: string
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

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'timezone', 'selectedSlots']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Start transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // Check for duplicate email
      const existingCandidate = await client.query(
        'SELECT candidate_id FROM candidates WHERE email = $1',
        [body.email]
      )
      
      if (existingCandidate.rows.length > 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'A candidate with this email already exists' },
          { status: 409 }
        )
      }

      // Check if selected slots are available
      const selectedSlotIds = body.selectedSlots as string[]
      const slotCheckQuery = `
        SELECT slot_id, taken 
        FROM time_slots 
        WHERE slot_id = ANY($1::text[])
        FOR UPDATE
      `
      
      const slotResult = await client.query(slotCheckQuery, [selectedSlotIds])
      
      if (slotResult.rows.length !== selectedSlotIds.length) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Some selected time slots do not exist' },
          { status: 400 }
        )
      }

      const unavailableSlots = slotResult.rows.filter(row => row.taken)
      if (unavailableSlots.length > 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { 
            error: 'Some selected time slots are no longer available',
            unavailableSlots: unavailableSlots.map(row => row.slot_id)
          },
          { status: 409 }
        )
      }

      // Generate candidate ID
      const candidateId = Date.now().toString()

      // Insert candidate
      await client.query(`
        INSERT INTO candidates (
          candidate_id, full_name, email, phone, timezone, 
          experience, motivation, additional_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        candidateId,
        body.fullName,
        body.email,
        body.phone || null,
        body.timezone,
        body.experience || null,
        body.motivation || null,
        body.additionalNotes || null
      ])

      // Insert candidate-slot relationships and mark slots as taken
      for (const slotId of selectedSlotIds) {
        await client.query(
          'INSERT INTO candidate_slots (candidate_id, slot_id) VALUES ($1, $2)',
          [candidateId, slotId]
        )
        
        await client.query(
          `UPDATE time_slots 
           SET taken = TRUE, taken_by = $1, taken_at = CURRENT_TIMESTAMP 
           WHERE slot_id = $2`,
          [candidateId, slotId]
        )
      }

      await client.query('COMMIT')

      return NextResponse.json(
        { 
          message: 'Candidate created successfully',
          candidateId: candidateId,
          bookedSlots: selectedSlotIds.length
        },
        { status: 201 }
      )
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await ensureDbInitialized()
    
    const result = await pool.query(`
      SELECT 
        c.candidate_id as id,
        c.full_name as fullName,
        c.email,
        c.phone,
        c.timezone,
        c.experience,
        c.motivation,
        c.additional_notes as additionalNotes,
        c.created_at as createdAt,
        COALESCE(
          ARRAY_AGG(ts.slot_id) FILTER (WHERE ts.slot_id IS NOT NULL),
          ARRAY[]::text[]
        ) as selectedSlots
      FROM candidates c
      LEFT JOIN candidate_slots cs ON c.candidate_id = cs.candidate_id
      LEFT JOIN time_slots ts ON cs.slot_id = ts.slot_id
      GROUP BY c.candidate_id, c.full_name, c.email, c.phone, c.timezone, 
               c.experience, c.motivation, c.additional_notes, c.created_at
      ORDER BY c.created_at DESC
    `)

    const candidates = result.rows.map(row => ({
      id: row.id,
      fullName: row.fullname,
      email: row.email,
      phone: row.phone,
      timezone: row.timezone,
      experience: row.experience,
      motivation: row.motivation,
      additionalNotes: row.additionalnotes,
      selectedSlots: row.selectedslots,
      createdAt: row.createdat
    }))

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error reading candidates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}