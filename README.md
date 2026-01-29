# SonarQube Issues Viewer

A Next.js web application to view and manage SonarQube code quality issues.

## Features

- 📊 **Excel-style Table View**: View issues in a spreadsheet-like table format
- 📥 **Excel Export**: Export all or selected issues to Excel (.xlsx) format
- 📊 **Summary Dashboard**: View total issues, effort, and breakdown by severity and type
- 🔍 **Advanced Filtering**: Filter issues by severity and type
- 🔄 **Sortable Columns**: Click column headers to sort by severity, type, status, file, line, message, or date
- ✅ **Row Selection**: Select individual rows or all rows with checkbox
- 📝 **Expandable Details**: Click "Show" to expand row and view full issue details
- 🎨 **Color-coded Severity**: Visual indicators for issue severity levels
- 📄 **Pagination**: Navigate through large issue lists
- 🔄 **Real-time Updates**: Fetch latest issues from SonarQube API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- SonarQube server running on `http://localhost:9004`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

The application is configured to proxy requests to your SonarQube API. The API endpoint is configured in `next.config.js`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/sonarqube/:path*',
      destination: 'http://localhost:9004/api/:path*',
    },
  ];
}
```

If your SonarQube server is running on a different host or port, update the `destination` URL accordingly.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page with data fetching
│   └── globals.css         # Global styles
├── components/
│   ├── IssuesList.tsx      # Issues list with filtering
│   ├── IssuesSummary.tsx    # Summary dashboard
│   ├── IssueCard.tsx       # Individual issue card
│   └── LoadingSpinner.tsx  # Loading indicator
└── package.json
```

## Usage

1. The application automatically fetches issues from the SonarQube API on load
2. **Table View**: Issues are displayed in an Excel-style table format
3. **Filtering**: Use the dropdown filters to narrow down issues by severity or type
4. **Sorting**: Click any column header to sort (click again to reverse order)
5. **Row Selection**: Check the boxes to select rows for export
6. **View Details**: Click "Show" in the Details column to expand and see full issue information
7. **Export to Excel**: 
   - Click "Export All to Excel" to export all filtered issues
   - Click "Export Selected" to export only the selected rows
8. **Pagination**: Use pagination controls to navigate through pages of issues

## API Endpoint

The application fetches data from:
```
GET /api/sonarqube/issues/search?projectKeys=gbsp-p&p={page}&ps={pageSize}
```

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- xlsx (SheetJS) - For Excel export functionality

