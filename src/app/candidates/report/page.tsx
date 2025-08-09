'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Users, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  Search,
  Filter,
  Download,
  ArrowLeft,
  User,
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

interface ReportData {
  candidate: CandidateData
  slots: TimeSlotData[]
}

export default function CandidatesReportPage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [timezoneFilter, setTimezoneFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidatesResponse, slotsResponse] = await Promise.all([
          fetch('/api/candidates'),
          fetch('/api/time-slots')
        ])

        if (candidatesResponse.ok && slotsResponse.ok) {
          const candidatesData = await candidatesResponse.json()
          const slotsData = await slotsResponse.json()
          
          setCandidates(candidatesData)
          setTimeSlots(slotsData.timeSlots || [])
          setFilteredCandidates(candidatesData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = candidates

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Timezone filter
    if (timezoneFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.timezone === timezoneFilter)
    }

    // Date filter (based on creation date)
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(candidate => 
            new Date(candidate.createdAt) >= filterDate
          )
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(candidate => 
            new Date(candidate.createdAt) >= filterDate
          )
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(candidate => 
            new Date(candidate.createdAt) >= filterDate
          )
          break
      }
    }

    setFilteredCandidates(filtered)
  }, [candidates, searchTerm, timezoneFilter, dateFilter])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSlotTime = (slotId: string) => {
    try {
      // Parse the slot ID which is in format "YYYY-MM-DD-HH:mm"
      const parts = slotId.split('-')
      if (parts.length < 3) return slotId
      
      // Extract date parts (YYYY-MM-DD)
      const datePart = parts.slice(0, 3).join('-')
      // Extract time part (HH:mm)
      const timePart = parts.slice(3).join(':')
      
      const year = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1 // JavaScript months are 0-indexed
      const day = parseInt(parts[2])
      
      let hour = 0
      let minute = 0
      
      if (timePart.includes(':')) {
        const timeParts = timePart.split(':')
        hour = parseInt(timeParts[0])
        minute = parseInt(timeParts[1])
      } else {
        // Handle case where time might be in format "HHmm"
        hour = parseInt(timePart.substring(0, 2))
        minute = parseInt(timePart.substring(2, 4))
      }
      
      const dateObj = new Date(year, month, day, hour, minute)
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return slotId // Return original if parsing fails
      }
      
      return dateObj.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (error) {
      console.error('Error formatting slot time:', slotId, error)
      return slotId // Return original slot ID if parsing fails
    }
  }

  const getSlotDetails = (slotId: string) => {
    return timeSlots.find(slot => slot.id === slotId)
  }

  const getTimezones = () => {
    const timezones = [...new Set(candidates.map(c => c.timezone))]
    return timezones.sort()
  }

  const getReportStats = () => {
    const totalCandidates = candidates.length
    const totalSlotsBooked = candidates.reduce((sum, candidate) => sum + candidate.selectedSlots.length, 0)
    const availableSlots = timeSlots.filter(slot => !slot.taken).length
    const totalSlots = timeSlots.length

    return {
      totalCandidates,
      totalSlotsBooked,
      availableSlots,
      totalSlots,
      bookingRate: totalSlots > 0 ? Math.round((totalSlotsBooked / totalSlots) * 100) : 0
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Candidate ID',
      'Full Name',
      'Email',
      'Phone',
      'Timezone',
      'Selected Slots',
      'Experience',
      'Motivation',
      'Additional Notes',
      'Applied On'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredCandidates.map(candidate => [
        candidate.id,
        `"${candidate.fullName}"`,
        candidate.email,
        candidate.phone || '',
        candidate.timezone,
        `"${candidate.selectedSlots.map(formatSlotTime).join('; ')}"`,
        `"${candidate.experience.replace(/"/g, '""')}"`,
        `"${candidate.motivation.replace(/"/g, '""')}"`,
        `"${candidate.additionalNotes.replace(/"/g, '""')}"`,
        formatDateTime(candidate.createdAt)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = getReportStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <Link href="/" passHref>
                <Button 
                  variant="ghost"
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-600" />
                Candidates Report
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive view of all candidates and their time slot bookings
              </p>
            </div>
            <Button onClick={exportToCSV} className="whitespace-nowrap">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalCandidates}</p>
                    <p className="text-sm text-gray-600">Total Candidates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalSlotsBooked}</p>
                    <p className="text-sm text-gray-600">Slots Booked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stats.availableSlots}</p>
                    <p className="text-sm text-gray-600">Available Slots</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-600">%</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stats.bookingRate}%</p>
                    <p className="text-sm text-gray-600">Booking Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalSlots}</p>
                    <p className="text-sm text-gray-600">Total Slots</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search candidates by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Select value={timezoneFilter} onValueChange={setTimezoneFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Timezones</SelectItem>
                      {getTimezones().map(timezone => (
                        <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-40">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Candidate Details ({filteredCandidates.length})
            </CardTitle>
            <CardDescription>
              Complete overview of all registered candidates and their interview time slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No candidates found</h3>
                <p className="text-gray-600">
                  {searchTerm || timezoneFilter !== 'all' || dateFilter !== 'all' 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No candidates have been registered yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Timezone</TableHead>
                      <TableHead>Selected Slots</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{candidate.fullName}</p>
                              <p className="text-sm text-gray-500">ID: {candidate.id.slice(-6)}</p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">{candidate.email}</span>
                            </div>
                            {candidate.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{candidate.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <Badge variant="outline" className="text-xs">
                              {candidate.timezone}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {candidate.selectedSlots.length > 0 ? (
                              candidate.selectedSlots.slice(0, 2).map((slotId, index) => {
                                const slot = getSlotDetails(slotId)
                                return (
                                  <Badge key={slotId} variant="secondary" className="text-xs mr-1 mb-1">
                                    {formatSlotTime(slotId)}
                                  </Badge>
                                )
                              })
                            ) : (
                              <span className="text-gray-500 text-sm">No slots selected</span>
                            )}
                            {candidate.selectedSlots.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.selectedSlots.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(candidate.createdAt)}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/candidates/${candidate.id}`}>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Slots Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Time Slots Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(
                timeSlots.reduce((acc, slot) => {
                  const day = slot.day
                  if (!acc[day]) {
                    acc[day] = { total: 0, taken: 0 }
                  }
                  acc[day].total++
                  if (slot.taken) acc[day].taken++
                  return acc
                }, {} as Record<string, { total: number; taken: number }>)
              ).map(([day, stats]) => (
                <div key={day} className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">{day}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-medium text-green-600">{stats.total - stats.taken}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Booked:</span>
                      <span className="font-medium text-red-600">{stats.taken}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}