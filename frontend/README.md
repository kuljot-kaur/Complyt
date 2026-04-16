# Complyt AI Frontend

Modern, responsive Next.js frontend for the Complyt AI autonomous document compliance platform.

## Features

- **Material Design 3** styling with custom color palette
- **TypeScript** for type-safe code
- **Next.js 14** with App Router
- **Tailwind CSS** for utility-first styling
- **Responsive Design** for all screen sizes
- **7 Core Pages** for complete workflow:
  1. **Login** - JWT authentication
  2. **Dashboard** - Document statistics and overview
  3. **Upload** - Drag-and-drop file upload with AI pipeline info
  4. **Processing** - Real-time processing status with progress tracking
  5. **Results** - Comprehensive compliance report with score meter
  6. **History** - Searchable document history with filters
  7. **Document Details** - Full document analysis with timeline

## Pages Structure

```
app/
├── page.tsx                    # Root redirect (login/dashboard)
├── layout.tsx                  # Global layout
├── globals.css                 # Global styles
├── login/page.tsx              # Login page
├── dashboard/page.tsx          # Dashboard (home)
├── upload/page.tsx             # Document upload
├── processing/[id]/page.tsx    # Processing status
├── results/[id]/page.tsx       # Results & compliance report
├── history/page.tsx            # Document history
├── document/[id]/page.tsx      # Document details
└── settings/page.tsx           # Settings (placeholder)
```

## Components

- **TopNavbar** - Sticky navigation bar with user menu
- **FileUploadZone** - Drag-and-drop file upload with validation
- **ProcessingSteps** - Visual processing pipeline with progress
- **ComplianceScoreMeter** - Circular compliance score gauge (0-100)
- **ComplianceReport** - Error and warning cards with details
- **ExtractedFields** - Editable form for 19 extracted fields

## Type System

Comprehensive TypeScript types in `types/index.ts`:
- `Document` - Document metadata and status
- `ExtractedData` - 19 extracted customs fields
- `ProcessingResponse` - API response structure from backend
- `DashboardStats` - Statistics data
- `User` - User authentication data

## State Management

Zustand stores in `lib/store.ts`:
- `useDocumentStore` - Document state and operations
- `useUserStore` - User authentication state

## API Integration

Axios client in `lib/api.ts` with endpoints:
- `POST /auth/login` - User login
- `POST /documents/upload` - Upload document for processing
- `GET /documents` - List all documents
- `GET /documents/{id}` - Get document details
- `GET /documents/stats` - Dashboard statistics
- `GET /documents/{id}/status` - Check processing status

## Custom Hooks

- `useDocumentUpload()` - Handle file upload with loading/error states
- `usePollingStatus()` - Poll backend for processing status

## Design System

### Colors (Material Design 3)
- Primary: `#004ac6`
- Error: `#ba1a1a`
- Tertiary: `#555744`
- Custom surface colors for glassmorphism effect

### Typography
- **Headline**: Newsreader serif (brand headlines)
- **Body**: Manrope sans-serif (content)
- **Label**: Manrope sans-serif (UI labels)

### Icons
Material Symbols Outlined from Google Fonts

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

```bash
cp .env.local.example .env.local
```

Configure in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Complyt AI
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Integration Points

### Backend API Contract

The frontend expects the backend (`process_document()` from Person A) to return:

```typescript
{
  "status": "success" | "error",
  "data": {
    // 19 extracted fields
    "exporterName": "...",
    "importerName": "...",
    "invoiceNumber": "...",
    // ... 16 more fields
  } | null,
  "errors": [
    {
      "code": "ERROR_CODE",
      "field": "fieldName",
      "message": "Error description",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "code": "WARNING_CODE",
      "field": "fieldName",
      "message": "Warning description",
      "severity": "warning"
    }
  ],
  "score": 0-100 | null,
  "message": "Summary message"
}
```

### File Upload Flow

1. User uploads file via drag-drop or click in `/upload`
2. File validated (format, size)
3. POST to `/documents/upload` with FormData
4. Backend runs `process_document()` and returns result
5. Frontend redirects to `/processing/[id]`
6. Polls `/documents/[id]/status` for progress
7. On completion, shows `/results/[id]`

## Key Features

### Security
- JWT token storage in localStorage
- Authorization headers on all API requests
- HTTPS ready for production

### Performance
- Lazy-loaded components
- Optimized images with Next.js Image
- Server-side rendering for SEO
- Incremental static generation

### Accessibility
- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance

### User Experience
- Responsive design (mobile-first)
- Loading states and spinners
- Error boundaries and error messages
- Real-time progress tracking
- Search and filter functionality

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Advanced document comparison
- [ ] Real-time collaboration
- [ ] Document versioning
- [ ] Custom compliance rule builder
- [ ] Audit trail logging
- [ ] WebSocket for live processing updates

## License

Proprietary - Complyt AI

## Support

For issues or questions, contact Person A (backend) for integration issues or the frontend team for UI/UX improvements.
