'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Search,
  ArrowLeft,
  BarChart3,
  Download,
  Filter
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

export default function CandidatesReportPage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [timezoneFilter, setTimezoneFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch('/api/slots/availability')
      if (response.ok) {
        const data = await response.json()
        return data.availableSlots.map((slot: any) => ({
          id: slot.id,
          date: slot.date,
          time: slot.time,
          day: slot.day,
          taken: slot.taken,
          takenBy: slot.takenBy,
          takenAt: slot.takenAt
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching time slots:', error)
      return []
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidatesResponse, slotsData] = await Promise.all([
          fetch('/api/candidates'),
          fetchTimeSlots()
        ])
        if (candidatesResponse.ok) {
          const candidatesData = await candidatesResponse.json()
          setCandidates(candidatesData)
          setTimeSlots(slotsData)
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

    // Apply search filter
    if (searchTerm !== '') {
      filtered = filtered.filter(candidate =>
        candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply timezone filter
    if (timezoneFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.timezone === timezoneFilter)
    }

    // Apply date filter (based on selected slots)
    if (dateFilter !== 'all') {
      filtered = filtered.filter(candidate => 
        candidate.selectedSlots.some((slotId: string) => {
          const slot = timeSlots.find(s => s.id === slotId)
          return slot && slot.date === dateFilter
        })
      )
    }

    setFilteredCandidates(filtered)
  }, [searchTerm, timezoneFilter, dateFilter, candidates, timeSlots])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getUniqueTimezones = () => {
    const timezones = [...new Set(candidates.map(c => c.timezone))]
    return timezones.sort()
  }

  const getUniqueDates = () => {
    const dates = [...new Set(timeSlots.map(s => s.date))]
    return dates.sort()
  }

  const getStats = () => {
    const totalCandidates = candidates.length
    const totalSlots = timeSlots.length
    const takenSlots = timeSlots.filter(s => s.taken).length
    const availableSlots = totalSlots - takenSlots
    const avgSlotsPerCandidate = totalCandidates > 0 ? (takenSlots / totalCandidates).toFixed(1) : '0'

    return {
      totalCandidates,
      totalSlots,
      takenSlots,
      availableSlots,
      avgSlotsPerCandidate
    }
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Timezone', 'Experience', 'Motivation', 'Selected Time Slots', 'Created At']
    const csvContent = [
      headers.join(','),
      ...filteredCandidates.map(candidate => {
        // Format time slots as a readable string
        const slotDetails = candidate.selectedSlots.map((slotId) => {
          const slot = timeSlots.find(s => s.id === slotId)
          return slot ? `${new Date(slot.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })} at ${slot.time}` : 'Unknown slot'
        }).join('; ')
        
        return [
          candidate.id,
          `"${candidate.fullName}"`,
          candidate.email,
          candidate.phone,
          candidate.timezone,
          `"${candidate.experience.replace(/"/g, '""')}"`,
          `"${candidate.motivation.replace(/"/g, '""')}"`,
          `"${slotDetails.replace(/"/g, '""')}"`,
          candidate.createdAt
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const stats = getStats()

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
              <Button 
                variant="ghost" 
                href="/candidates"
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Candidates
              </Button>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Candidates Report
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive analysis of candidate data and time slot usage
              </p>
            </div>
            <Button onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalCandidates}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalSlots}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taken Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.takenSlots}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Available Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.availableSlots}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Slots/Candidate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.avgSlotsPerCandidate}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <Select value={timezoneFilter} onValueChange={setTimezoneFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Timezones</SelectItem>
                    {getUniqueTimezones().map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    {getUniqueDates().map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates ({filteredCandidates.length})</CardTitle>
            <CardDescription>
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Time Slots</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{candidate.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{candidate.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {candidate.timezone}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {candidate.selectedSlots.length > 0 ? (
                            candidate.selectedSlots.map((slotId) => {
                              const slot = timeSlots.find(s => s.id === slotId)
                              return slot ? (
                                <div key={slotId} className="flex items-center gap-2 text-xs">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-600">
                                    {new Date(slot.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })} at {slot.time}
                                  </span>
                                </div>
                              ) : null
                            })
                          ) : (
                            <span className="text-xs text-gray-500">No slots selected</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDateTime(candidate.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/candidates/${candidate.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}