import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

interface TimeSlotInfo {
  id: string
  date: string
  time: string
  day: string
  taken: boolean
  takenBy: string | null
  takenAt: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidate = await db.candidate.findUnique({
      where: { candidate_id: params.id },
      include: {
        candidate_slots: {
          include: {
            time_slot: true
          }
        }
      }
    })
    
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Format the response to match the expected interface
    const formattedCandidate: CandidateData = {
      id: candidate.candidate_id,
      fullName: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone,
      timezone: candidate.timezone,
      experience: candidate.experience,
      motivation: candidate.motivation,
      additionalNotes: candidate.additional_notes,
      selectedSlots: candidate.candidate_slots.map(cs => cs.slot_id),
      createdAt: candidate.created_at.toISOString()
    }

    // Include detailed time slot information
    const timeSlots: TimeSlotInfo[] = candidate.candidate_slots.map(cs => ({
      id: cs.time_slot.slot_id,
      date: cs.time_slot.date.toISOString().split('T')[0],
      time: cs.time_slot.time.toISOString().split('T')[1].substring(0, 5),
      day: cs.time_slot.day,
      taken: cs.time_slot.taken,
      takenBy: cs.time_slot.taken_by,
      takenAt: cs.time_slot.taken_at ? cs.time_slot.taken_at.toISOString() : null
    }))

    return NextResponse.json({
      candidate: formattedCandidate,
      timeSlots: timeSlots
    })
  } catch (error) {
    console.error('Error reading candidate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}