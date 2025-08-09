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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidates = await readCandidates()
    const candidate = candidates.find(c => c.id === params.id)
    
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(candidate)
  } catch (error) {
    console.error('Error reading candidate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}