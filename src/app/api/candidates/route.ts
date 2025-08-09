import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'candidates.json')
const TIME_SLOTS_FILE = path.join(process.cwd(), 'data', 'time-slots.json')

interface CandidateData {
  fullName: string
  email: string
  phone: string
  timezone: string
  experience: string
  motivation: string
  additionalNotes: string
  selectedSlots: string[]
  id: string
  createdAt: string
}

interface TimeSlot {
  id: string
  date: string
  time: string
  day: string
  taken: boolean
  takenBy: string | null
  takenAt: string | null
}

interface TimeSlotsData {
  timeSlots: TimeSlot[]
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read existing candidates
async function readCandidates(): Promise<CandidateData[]> {
  await ensureDataDirectory()
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Write candidates to file
async function writeCandidates(candidates: CandidateData[]): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(DATA_FILE, JSON.stringify(candidates, null, 2))
}

// Read time slots
async function readTimeSlots(): Promise<TimeSlotsData> {
  try {
    const data = await fs.readFile(TIME_SLOTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { timeSlots: [] }
  }
}

// Write time slots
async function writeTimeSlots(data: TimeSlotsData): Promise<void> {
  await fs.writeFile(TIME_SLOTS_FILE, JSON.stringify(data, null, 2))
}

export async function POST(request: NextRequest) {
  try {
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

    // Read existing candidates
    const candidates = await readCandidates()
    
    // Check for duplicate email
    const existingCandidate = candidates.find(c => c.email === body.email)
    if (existingCandidate) {
      return NextResponse.json(
        { error: 'A candidate with this email already exists' },
        { status: 409 }
      )
    }

    // Create candidate object first to get ID
    const candidate: CandidateData = {
      id: Date.now().toString(),
      fullName: body.fullName,
      email: body.email,
      phone: body.phone || '',
      timezone: body.timezone,
      experience: body.experience || '',
      motivation: body.motivation || '',
      additionalNotes: body.additionalNotes || '',
      selectedSlots: body.selectedSlots,
      createdAt: new Date().toISOString()
    }

    // Read time slots and check availability
    const timeSlotsData = await readTimeSlots()
    const availableSlots = timeSlotsData.timeSlots.filter(slot => !slot.taken)
    
    // Check if selected slots are available
    const selectedSlotIds = body.selectedSlots as string[]
    const unavailableSlots = selectedSlotIds.filter(slotId => 
      !availableSlots.some(slot => slot.id === slotId)
    )
    
    if (unavailableSlots.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some selected time slots are no longer available',
          unavailableSlots 
        },
        { status: 409 }
      )
    }

    // Mark selected slots as taken
    selectedSlotIds.forEach(slotId => {
      const slot = timeSlotsData.timeSlots.find(s => s.id === slotId)
      if (slot && !slot.taken) {
        slot.taken = true
        slot.takenBy = candidate.id
        slot.takenAt = new Date().toISOString()
      }
    })
    
    // Save updated time slots
    await writeTimeSlots(timeSlotsData)

    // Add candidate and save
    candidates.push(candidate)
    await writeCandidates(candidates)

    return NextResponse.json(
      { 
        message: 'Candidate created successfully',
        candidateId: candidate.id,
        bookedSlots: selectedSlotIds.length
      },
      { status: 201 }
    )
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
    const candidates = await readCandidates()
    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error reading candidates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}