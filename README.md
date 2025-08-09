# Next.js Candidate Interview Scheduling System

A production-ready Next.js application for managing candidate interview scheduling with time slot selection.

## Features

- **Candidate Registration**: Collect candidate information including personal details, technical background, and motivation
- **Time Slot Selection**: Interactive time slot picker with specific availability (Monday-Friday, 16:00-18:00, 15-minute intervals)
- **Date Range**: Available slots from August 12-16, 2025
- **Candidate Management**: View all candidates and individual candidate details
- **Data Persistence**: Candidate data stored in JSON file
- **Responsive Design**: Mobile-friendly interface using shadcn/ui components

## Time Slot Configuration

- **Days**: Monday to Friday
- **Hours**: 16:00 to 18:00 (4:00 PM to 6:00 PM)
- **Duration**: 15-minute slots
- **Date Range**: August 12, 2025 to August 16, 2025

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── candidates/
│   │   │   ├── route.ts           # POST/GET all candidates
│   │   │   └── [id]/
│   │   │       └── route.ts       # GET single candidate
│   ├── candidates/
│   │   ├── page.tsx               # List all candidates
│   │   └── [id]/
│   │       └── page.tsx           # View candidate details
│   ├── page.tsx                   # Main candidate form
│   └── layout.tsx
├── components/
│   ├── candidates/
│   │   └── CandidateForm.tsx      # Candidate registration form
│   └── ui/                        # shadcn/ui components
├── data/                          # JSON data storage (created automatically)
└── lib/
    └── utils.ts
```

## Pages

### 1. Main Form (`/`)
- Candidate registration form
- Time slot selection interface
- Form validation and submission

### 2. Candidates List (`/candidates`)
- View all registered candidates
- Search functionality
- Quick access to candidate details

### 3. Candidate Details (`/candidates/[id]`)
- Detailed view of individual candidate
- All submitted information
- Selected time slots display

## API Endpoints

### `POST /api/candidates`
- Create a new candidate
- Validates required fields
- Prevents duplicate email submissions
- Returns candidate ID on success

### `GET /api/candidates`
- Retrieve all candidates
- Returns array of candidate objects

### `GET /api/candidates/[id]`
- Retrieve single candidate by ID
- Returns 404 if candidate not found

## Data Storage

Candidate data is stored in `data/candidates.json` with the following structure:

```json
[
  {
    "id": "unique_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "timezone": "UTC",
    "experience": "Technical experience details...",
    "motivation": "Motivation details...",
    "additionalNotes": "Additional notes...",
    "selectedSlots": ["2025-08-12-16:00", "2025-08-12-16:15"],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

## Technologies Used

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **File System API** for data persistence

## Getting Started

1. The application is ready to run
2. Navigate to the main page to register candidates
3. Use the "View All Candidates" button to see registered candidates
4. Click on any candidate to view their details

## Form Fields

### Required Fields
- Full Name
- Email Address
- Timezone
- At least one time slot selection

### Optional Fields
- Phone Number
- Technical Experience
- Motivation
- Additional Notes

## Time Slot Selection

The system generates time slots automatically based on the configured parameters:
- Only weekdays (Monday-Friday)
- Between 16:00 and 18:00
- 15-minute intervals
- Within the specified date range

## Error Handling

- Form validation with user-friendly error messages
- Duplicate email prevention
- API error handling
- 404 handling for non-existent candidates

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Security Considerations

- Input validation on both client and server
- Email format validation
- File system permissions handled automatically
- No sensitive data exposure

## Future Enhancements

- Email notifications for candidates
- Admin dashboard for slot management
- Calendar integration
- Interview status tracking
- Export functionality for candidate data