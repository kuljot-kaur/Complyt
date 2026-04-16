# Next.js Frontend Setup & Integration Guide

## 🎯 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your API endpoint:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`

---

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Root redirect
│   ├── layout.tsx                # Global layout with HTML setup
│   ├── globals.css               # Global styles (Tailwind, custom CSS)
│   ├── login/                    # Authentication
│   ├── dashboard/                # Home page with statistics
│   ├── upload/                   # Document upload interface
│   ├── processing/[id]/          # Processing status with progress
│   ├── results/[id]/             # Compliance report
│   ├── history/                  # Document history table
│   ├── document/[id]/            # Document detail page
│   └── settings/                 # Settings (placeholder)
│
├── components/                   # Reusable React components
│   ├── TopNavbar.tsx             # Navigation bar
│   ├── FileUploadZone.tsx        # Drag-and-drop upload
│   ├── ProcessingSteps.tsx       # Progress visualization
│   ├── ComplianceScoreMeter.tsx  # Score gauge (0-100)
│   ├── ComplianceReport.tsx      # Error/warning display
│   └── ExtractedFields.tsx       # 19-field form
│
├── lib/                          # Utilities and services
│   ├── api.ts                    # Axios API client
│   └── store.ts                  # Zustand state stores
│
├── hooks/                        # Custom React hooks
│   └── useDocument.ts            # Document upload & polling
│
├── types/                        # TypeScript definitions
│   └── index.ts                  # All type interfaces
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind setup with custom colors
├── postcss.config.js             # PostCSS config for Tailwind
├── next.config.js                # Next.js configuration
├── .env.local.example            # Environment template
└── README.md                     # This file
```

---

## 🎨 Design System

### Colors (Material Design 3)
All colors defined in `tailwind.config.ts`:
- **Primary**: `#004ac6` (Blue) - Main actions, highlights
- **Primary Container**: `#2563eb` (Lighter blue)
- **Secondary**: `#515f74` (Gray) - Secondary text/elements
- **Tertiary**: `#555744` (Brown) - Warnings, accent
- **Error**: `#ba1a1a` (Red) - Errors, critical
- **Surface Colors**: Light backgrounds for glassmorphism

### Typography
- **Headline Font**: Newsreader serif (Google Fonts)
- **Body Font**: Manrope sans-serif (Google Fonts)
- **Label Font**: Manrope sans-serif
- **Icons**: Material Symbols Outlined

### Component Styles
Custom Tailwind classes in `globals.css`:
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.btn-outline` - Outlined button
- `.card` - Reusable card component
- `.input-field` - Form input styling
- `.paper-fold` - Paper corner fold effect
- `.whisper-shadow` - Subtle shadow
- `.ruled-line-bg` - Lined background pattern

---

## 🔧 Configuration

### Tailwind CSS
Custom configuration in `tailwind.config.ts`:
- Material Design 3 color palette
- Custom border radius values
- Font family definitions
- Animation additions
- Form plugins enabled

### TypeScript
Strict mode enabled in `tsconfig.json`:
- `strict: true` - Strict type checking
- `noImplicitAny: true` - No implicit any
- Path aliases for clean imports (`@/components/*`, `@/lib/*`)

---

## 📱 Page Reference

### 1. Login Page (`/login`)
**Purpose**: JWT authentication

**Components**:
- Glassmorphism auth card
- Email/password fields
- "Remember me" checkbox
- "Forgot password" link
- Animated loading state

**Mock Data**: Any email/password works (demo mode)

---

### 2. Dashboard (`/dashboard`)
**Purpose**: Statistics and document overview

**Features**:
- 4 KPI cards: Total, Avg Score, Pending, Flagged
- Recent documents table with status badges
- Quick access to upload new document
- Search bar (functional)
- Profile menu with logout

**Data**: Mock stats and 4 sample documents

---

### 3. Upload (`/upload`)
**Purpose**: File upload and processing

**Features**:
- Drag-and-drop zone with hover effects
- File format validation (PDF, PNG, JPG, DOCX)
- 25MB file size limit
- File preview after selection
- Upload & Analyze button
- Right sidebar with AI pipeline info (5 items)

**Flow**: 
1. Select/drop file
2. Click "Upload & Analyze"
3. Redirects to `/processing/[id]`

---

### 4. Processing (`/processing/[id]`)
**Purpose**: Real-time processing status

**Features**:
- 5 processing steps with status (completed/in-progress/pending)
- Animated progress bar (0-100%)
- Step descriptions and timings
- Automatic redirect to `/results` on completion
- Metadata panel with document ID

**Simulation**: Steps complete over 12 seconds

---

### 5. Results (`/results/[id]`)
**Purpose**: Compliance report and extracted data

**Features**:
- 4 summary cards: Score, Errors, Warnings, Status
- Split layout:
  - LEFT: Extracted 19 fields (editable form)
  - RIGHT: Score meter gauge + compliance issues
- Download/Share/Reprocess buttons
- Color-coded badge system

**Data**: Mock compliance result with errors/warnings

---

### 6. History (`/history`)
**Purpose**: Document history with search/filter

**Features**:
- Search bar (by filename/ID)
- 4 filter buttons: All, Compliant, Flagged, Pending
- Table with 7 columns (ID, Filename, Status, Score, Date, Actions)
- Status badges with icons
- Pagination controls
- Document count display

**Data**: 7 mock documents

---

### 7. Document Details (`/document/[id]`)
**Purpose**: Comprehensive document analysis

**Features**:
- Document preview panel
- Processing timeline (5 steps)
- Compliance score meter
- Extracted fields (read-only)
- Compliance issues (errors/warnings)
- Edit & re-validate button

**Data**: Complete mock document with full timeline

---

## 🔌 API Integration

### Backend Endpoints Required

**Authentication**:
- `POST /auth/login` → Returns JWT token
- `POST /auth/logout` → Clears session

**Documents**:
- `POST /documents/upload` → Upload file, returns `ProcessingResponse`
- `GET /documents` → List all user documents
- `GET /documents/{id}` → Get single document
- `GET /documents/{id}/status` → Poll processing status
- `GET /documents/stats` → Dashboard statistics

### Response Contract

```typescript
// Success response
{
  "status": "success",
  "data": {
    "exporterName": "ABC Inc.",
    "importerName": "XYZ Corp.",
    // ... 17 more fields
  },
  "errors": [],
  "warnings": [],
  "score": 92,
  "message": "Document processed successfully"
}

// Error response
{
  "status": "error",
  "data": null,
  "errors": [
    {
      "code": "FILE_NOT_FOUND",
      "field": null,
      "message": "File not found",
      "severity": "error"
    }
  ],
  "warnings": [],
  "score": null,
  "message": "File not found"
}
```

### API Client Usage

```typescript
import { apiClient } from '@/lib/api';

// Upload document
const result = await apiClient.uploadDocument(file);

// Get documents
const docs = await apiClient.getDocuments();

// Get single document
const doc = await apiClient.getDocument('DOC001');

// Get processing status
const status = await apiClient.getProcessingStatus('DOC001');
```

---

## 🎯 Features Implemented

### Core Pages
- ✅ Login page with form validation
- ✅ Dashboard with KPI cards and table
- ✅ Upload with drag-drop and format validation
- ✅ Processing with animated progress
- ✅ Results with score meter and compliance report
- ✅ History with search and filters
- ✅ Document detail with timeline

### Components
- ✅ Top navbar with profile menu
- ✅ File upload zone (reusable)
- ✅ Processing steps visualization
- ✅ Compliance score meter (circular gauge)
- ✅ Compliance report (errors/warnings)
- ✅ Extracted fields form (19 fields)

### State Management
- ✅ Zustand store for documents
- ✅ Zustand store for user authentication
- ✅ Custom hooks for upload and polling

### Styling
- ✅ Material Design 3 color palette
- ✅ Tailwind CSS utility framework
- ✅ Custom Tailwind config with brand colors
- ✅ Responsive design (mobile-first)
- ✅ Glassmorphism effect cards
- ✅ Paper fold visual accent

---

## 🚀 Development Workflow

### Running Locally

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Format code with Prettier
npm run format

# TypeScript type checking (if added)
npm run type-check
```

### Making Changes

1. **Edit components**: Update `.tsx` files in `components/`
2. **Update pages**: Modify `.tsx` files in `app/`
3. **Modify styles**: Edit `globals.css` or add Tailwind classes
4. **Change API calls**: Update `lib/api.ts`
5. **Update types**: Modify `types/index.ts`

All changes auto-refresh in browser (Hot Module Replacement).

---

## 🔐 Authentication Flow

1. User enters credentials on `/login`
2. Submit calls `apiClient.login(email, password)`
3. Backend returns JWT token
4. Token saved to `localStorage` as `auth_token`
5. Token automatically added to all API requests via interceptor
6. On logout, token removed and redirect to `/login`
7. Root page (`/`) redirects based on token presence

---

## 📊 Data Flow

### File Upload Flow
```
Upload Page
    ↓ (select file)
FileUploadZone (validate)
    ↓ (user clicks Upload)
API: POST /documents/upload
    ↓ (returns ProcessingResponse)
Redirect to /processing/[id]
    ↓ (poll status)
API: GET /documents/[id]/status
    ↓ (when complete)
Redirect to /results/[id]
    ↓ (display results)
Results Page (show compliance report)
```

### State Management Flow
```
React Component
    ↓ (call hook or store)
Zustand Store (useDocumentStore)
    ↓ (persist in memory)
Component Re-renders
    ↓ (with new state)
Display Updated UI
```

---

## 🐛 Debugging

### Enable Network Logging
Add to `lib/api.ts`:
```typescript
this.client.interceptors.response.use(
  (response) => {
    console.log('✓ API Response:', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('✗ API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);
```

### Debug Zustand Store
```typescript
import { useDocumentStore } from '@/lib/store';

const instance = useDocumentStore.getState();
console.log('Current documents:', instance.documents);
```

### Check TypeScript Errors
```bash
# Visual Studio Code will show errors in editor
# Or run:
npx tsc --noEmit
```

---

## 📦 Deployment

### Vercel (Recommended for Next.js)
```bash
npm i -g vercel
vercel login
vercel
```

**Environment Variables** on Vercel:
```
NEXT_PUBLIC_API_URL=https://api.complyt.com
```

### Docker
```bash
docker build -t complyt-frontend .
docker run -p 3000:3000 complyt-frontend
```

### Traditional Node Server
```bash
npm run build
npm start
```

---

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **React Hooks**: https://react.dev/reference/react/hooks
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zustand**: https://github.com/pmndrs/zustand

---

## 📝 Checklist for Integration

Before deploying with backend:

- [ ] Verify API endpoints match `/documents` endpoints
- [ ] Test authentication flow (login/logout)
- [ ] Confirm file upload and FormData handling
- [ ] Verify ProcessingResponse structure matches contract
- [ ] Test polling mechanism on `/documents/[id]/status`
- [ ] Validate error handling and user messages
- [ ] Set correct `NEXT_PUBLIC_API_URL` for environment
- [ ] Add CORS headers on backend if needed
- [ ] Test with actual OCR/Gemini results
- [ ] Verify extracted 19 fields display correctly

---

## 🤝 Integration with Backend (Person A)

The frontend is fully ready to integrate with Person A's `process_document()` function.

**Key Integration Points**:
1. File upload endpoint sends file to backend
2. Backend runs `process_document(file_path)` 
3. Returns standardized response with 6 keys
4. Frontend displays results in Results page

**No frontend code changes needed** - just configure API URL and test!

---

## 📄 License

Proprietary - Complyt AI Platform

---

**Status**: ✅ Ready for Integration (Waiting for Backend API)
