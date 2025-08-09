import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const TIME_SLOTS_FILE = path.join(process.cwd(), 'data', 'time-slots.json')

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

async function readTimeSlots(): Promise<TimeSlotsData> {
  try {
    const data = await fs.readFile(TIME_SLOTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { timeSlots: [] }
  }
}

async function writeTimeSlots(data: TimeSlotsData): Promise<void> {
  await fs.writeFile(TIME_SLOTS_FILE, JSON.stringify(data, null, 2))
}

export async function GET() {
  try {
    const data = await readTimeSlots()
    const availableSlots = data.timeSlots.filter(slot => !slot.taken)
    
    return NextResponse.json({
      availableSlots,
      totalAvailable: availableSlots.length,
      totalSlots: data.timeSlots.length
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
    const { slotId, candidateId } = await request.json()
    
    if (!slotId || !candidateId) {
      return NextResponse.json(
        { error: 'Slot ID and Candidate ID are required' },
        { status: 400 }
      )
    }

    const data = await readTimeSlots()
    const slot = data.timeSlots.find(s => s.id === slotId)
    
    if (!slot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      )
    }
    
    if (slot.taken) {
      return NextResponse.json(
        { error: 'Time slot is already taken' },
        { status: 409 }
      )
    }

    // Mark slot as taken
    slot.taken = true
    slot.takenBy = candidateId
    slot.takenAt = new Date().toISOString()
    
    await writeTimeSlots(data)
    
    return NextResponse.json({
      message: 'Time slot booked successfully',
      slot
    })
  } catch (error) {
    console.error('Error booking time slot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}