'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  MessageSquare, 
  ArrowLeft,
  MapPin,
  FileText
} from 'lucide-react'

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

interface TimeSlotData {
  id: string
  date: string
  time: string
  day: string
  taken: boolean
  takenBy: string | null
  takenAt: string | null
}

interface ApiResponse {
  candidate: CandidateData
  timeSlots: TimeSlotData[]
}

export default function CandidateDetailPage() {
  const [candidate, setCandidate] = useState<CandidateData | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const response = await fetch(`/api/candidates/${candidateId}`)
        if (!response.ok) {
          throw new Error('Candidate not found')
        }
        const data: ApiResponse = await response.json()
        setCandidate(data.candidate)
        setTimeSlots(data.timeSlots)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch candidate')
      } finally {
        setLoading(false)
      }
    }

    fetchCandidate()
  }, [candidateId])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSlotTime = (slot: TimeSlotData) => {
    const dateObj = new Date(slot.date)
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    return `${dayName}, ${formattedDate} at ${slot.time}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate details...</p>
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <User className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Candidate Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The candidate you are looking for does not exist.'}</p>
            <Button onClick={() => router.push('/candidates')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Candidates
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/candidates')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{candidate.fullName}</h1>
              <p className="text-gray-600">Candidate ID: {candidate.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">{candidate.email}</p>
                </div>
              </div>
              
              {candidate.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-gray-600">{candidate.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Timezone</p>
                  <p className="text-gray-600">{candidate.timezone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Applied On</p>
                  <p className="text-gray-600">{formatDateTime(candidate.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Background */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Technical Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.experience ? (
                <div>
                  <p className="font-medium mb-2">Experience</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{candidate.experience}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No experience information provided</p>
              )}
              
              {candidate.motivation && (
                <div>
                  <p className="font-medium mb-2">Motivation</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{candidate.motivation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Time Slots */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Selected Interview Time Slots
              </CardTitle>
              <CardDescription>
                {timeSlots.length} time slot(s) selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {timeSlots.map((slot, index) => (
                  <div key={slot.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Badge variant="secondary" className="mb-2">
                      Slot {index + 1}
                    </Badge>
                    <p className="text-sm font-medium text-blue-800">
                      {formatSlotTime(slot)}
                    </p>
                    {slot.takenAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Booked on {new Date(slot.takenAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {candidate.additionalNotes && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{candidate.additionalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}