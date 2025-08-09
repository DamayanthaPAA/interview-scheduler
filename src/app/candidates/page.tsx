'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Search,
  Plus,
  ArrowLeft,
  Users
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

export default function CandidatesListPage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch('/api/candidates')
        if (response.ok) {
          const data = await response.json()
          setCandidates(data)
          setFilteredCandidates(data)
        }
      } catch (error) {
        console.error('Error fetching candidates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [])

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCandidates(candidates)
    } else {
      const filtered = candidates.filter(candidate =>
        candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCandidates(filtered)
    }
  }, [searchTerm, candidates])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
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
                href="/"
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-600" />
                All Candidates
              </h1>
              <p className="text-gray-600 mt-1">
                {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} registered
              </p>
            </div>
            <Button href="/">
              <Plus className="w-4 h-4 mr-2" />
              Add New Candidate
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
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

        {/* Candidates Grid */}
        {filteredCandidates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchTerm ? 'No candidates found' : 'No candidates registered yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Start by adding your first candidate.'
                }
              </p>
              {!searchTerm && (
                <Button href="/">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Candidate
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{candidate.fullName}</CardTitle>
                        <CardDescription className="text-sm">
                          ID: {candidate.id.slice(-6)}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(candidate.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{candidate.selectedSlots.length} slot(s)</span>
                  </div>
                  
                  <div className="pt-2">
                    <Badge variant="secondary" className="text-xs">
                      {candidate.timezone}
                    </Badge>
                  </div>
                  
                  <div className="pt-2">
                    <Link href={`/candidates/${candidate.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}