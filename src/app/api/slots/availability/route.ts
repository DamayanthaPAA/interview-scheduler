import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'candidates.json')

interface CandidateData {
  id: string
  fullName: string
  email: string
  phone: string
  timezone: string
  experience: string
  motivation: string
  additionalNotes: string
  selectedSlots: string[]
  createdAt: string
}

async function readCandidates(): Promise<CandidateData[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const candidates = await readCandidates()
    
    // Collect all booked slots
    const bookedSlots = new Set<string>()
    candidates.forEach(candidate => {
      candidate.selectedSlots.forEach(slot => {
        bookedSlots.add(slot)
      })
    })

    return NextResponse.json({
      bookedSlots: Array.from(bookedSlots),
      totalBooked: bookedSlots.size
    })
  } catch (error) {
    console.error('Error checking slot availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}