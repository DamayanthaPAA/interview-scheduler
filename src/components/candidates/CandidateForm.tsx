'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Users } from 'lucide-react'

interface TimeSlot {
  id: string
  date: string
  time: string
  day: string
  taken: boolean
  takenBy: string | null
  takenAt: string | null
}

interface CandidateFormData {
  fullName: string
  email: string
  phone: string
  timezone: string
  experience: string
  motivation: string
  additionalNotes: string
  selectedSlots: string[]
}

export default function CandidateForm() {
  const [formData, setFormData] = useState<CandidateFormData>({
    fullName: '',
    email: '',
    phone: '',
    timezone: '',
    experience: '',
    motivation: '',
    additionalNotes: '',
    selectedSlots: []
  })
  
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(true)

  // Fetch available time slots on component mount
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        const response = await fetch('/api/time-slots')
        if (response.ok) {
          const data = await response.json()
          setAvailableSlots(data.availableSlots)
        }
      } catch (error) {
        console.error('Error fetching available slots:', error)
        setSubmitError('Failed to load available time slots')
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchAvailableSlots()
  }, [])

  const handleInputChange = (field: keyof CandidateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTimeSlotToggle = (slotId: string) => {
    // Check if slot is still available
    const isSlotAvailable = availableSlots.some(slot => slot.id === slotId)
    
    if (!isSlotAvailable && !formData.selectedSlots.includes(slotId)) {
      setSubmitError('This time slot is no longer available. Please select a different slot.')
      return
    }

    setFormData(prev => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slotId)
        ? prev.selectedSlots.filter(id => id !== slotId)
        : [...prev.selectedSlots, slotId]
    }))
    
    // Clear any previous slot-related errors
    if (submitError.includes('no longer available')) {
      setSubmitError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.timezone) {
      setSubmitError('Please fill in all required fields')
      return
    }
    
    if (formData.selectedSlots.length === 0) {
      setSubmitError('Please select at least one time slot')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (responseData.error === 'Some selected time slots are no longer available') {
          setSubmitError('Some of your selected time slots are no longer available. Please refresh and select different slots.')
          // Refresh available slots
          const slotsResponse = await fetch('/api/time-slots')
          if (slotsResponse.ok) {
            const slotsData = await slotsResponse.json()
            setAvailableSlots(slotsData.availableSlots)
          }
        } else {
          setSubmitError(responseData.error || 'Failed to submit candidate data')
        }
        return
      }

      setSubmitSuccess(true)
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        timezone: '',
        experience: '',
        motivation: '',
        additionalNotes: '',
        selectedSlots: []
      })
      
      // Refresh available slots
      const slotsResponse = await fetch('/api/time-slots')
      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        setAvailableSlots(slotsData.availableSlots)
      }
    } catch (error) {
      setSubmitError('Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-4">Submission Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your submission! We have received your candidate details and will contact you soon to confirm your interview time.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setSubmitSuccess(false)}>
              Submit Another Candidate
            </Button>
            {/* <Link href="/candidates">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                View All Candidates
              </Button>
            </Link> */}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start mb-4">
            {/* <Link href="/candidates">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                View All Candidates
              </Button>
            </Link> */}
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <User className="w-8 h-8 text-blue-600" />
            Candidate Interview Scheduling
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Please fill in your details and select your preferred interview time slots
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem> */}
                      <SelectItem  value="Europe/Helsinki">Europe/Helsinki (EET/EEST)</SelectItem>
                      {/* <SelectItem value="Europe/Berlin">Europe/Berlin (CET/CEST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                      <SelectItem value="Asia/Colombo">Asia/Colombo (IST)</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Technical Background Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Technical Background
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="experience">Technical Experience</Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  placeholder="Tell us about your technical experience and skills..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="motivation">Motivation</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  placeholder="What motivates you to join our team?"
                  rows={3}
                />
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Available Time Slots
              </h3>
              
              <p className="text-sm text-gray-600">
                Select your preferred interview time slots (August 12-16, 2025, Monday-Friday, 16:00-18:00)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {loadingSlots ? (
                  // Loading state
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))
                ) : availableSlots.length === 0 ? (
                  // No available slots
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No time slots available at the moment.</p>
                  </div>
                ) : (
                  // Available time slots
                  availableSlots.map((slot) => {
                    const isSelected = formData.selectedSlots.includes(slot.id)
                    
                    return (
                      <div
                        key={slot.id}
                        onClick={() => handleTimeSlotToggle(slot.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{slot.day}</p>
                            <p className="text-xs text-gray-600">{slot.date}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{slot.time}</span>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Selected slots: {formData.selectedSlots.length}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span>Available slots: {availableSlots.length}</span>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Any additional information or scheduling preferences..."
                rows={3}
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting || availableSlots.length === 0}
                className="px-8 py-3 text-lg"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  )
}