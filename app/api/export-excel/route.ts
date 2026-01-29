import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Dynamic import to handle missing xlsx package gracefully
    let XLSX: any
    try {
      XLSX = await import('xlsx')
    } catch (importError) {
      return NextResponse.json(
        { 
          error: 'xlsx package is not installed. Please run: npm install xlsx',
          details: 'The Excel export functionality requires the xlsx package to be installed.'
        },
        { status: 500 }
      )
    }
    const { issues, filename, groupBySeverity } = await request.json()

    if (!issues || !Array.isArray(issues)) {
      return NextResponse.json(
        { error: 'Invalid issues data' },
        { status: 400 }
      )
    }

    const mapIssueToRow = (issue: any) => ({
      Key: issue.key,
      Severity: issue.severity,
      Type: issue.type,
      Status: issue.status,
      Message: issue.message,
      File: issue.component?.split(':').pop() || issue.component,
      'Full Path': issue.component,
      Line: issue.line,
      'Start Line': issue.textRange?.startLine || issue.line,
      'End Line': issue.textRange?.endLine || issue.line,
      Rule: issue.rule,
      Effort: issue.effort,
      Debt: issue.debt,
      Author: issue.author || '',
      Tags: issue.tags?.join(', ') || '',
      'Created Date': issue.creationDate
        ? new Date(issue.creationDate).toLocaleString()
        : '',
      'Updated Date': issue.updateDate
        ? new Date(issue.updateDate).toLocaleString()
        : '',
      Scope: issue.scope || '',
      'Clean Code Attribute': issue.cleanCodeAttribute || '',
      Category: issue.cleanCodeAttributeCategory || '',
      'Issue Status': issue.issueStatus || '',
      'Linked Ticket': issue.linkedTicketStatus || '',
      'Quick Fix Available': issue.quickFixAvailable ? 'Yes' : 'No',
      Impacts: issue.impacts
        ?.map((i: any) => `${i.softwareQuality} (${i.severity})`)
        .join('; ') || '',
      'Flow Count': issue.flows?.length || 0,
    })

    const wb = XLSX.utils.book_new()

    if (groupBySeverity) {
      // Group issues by severity
      const severityOrder = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO']
      const groupedIssues: Record<string, any[]> = {}

      issues.forEach((issue: any) => {
        const severity = issue.severity || 'UNKNOWN'
        if (!groupedIssues[severity]) {
          groupedIssues[severity] = []
        }
        groupedIssues[severity].push(issue)
      })

      // Create summary sheet
      const summaryData = severityOrder
        .filter((sev) => groupedIssues[sev])
        .map((severity) => ({
          Severity: severity,
          Count: groupedIssues[severity].length,
          'Total Effort (min)': groupedIssues[severity].reduce(
            (sum, issue) => {
              const effort = issue.effort || '0min'
              const minutes = parseInt(effort.replace('min', '').replace('h', '')) || 0
              return sum + minutes
            },
            0
          ),
        }))

      if (summaryData.length > 0) {
        const summaryWs = XLSX.utils.json_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
        
        // Auto-size summary columns
        const summaryColWidths = Object.keys(summaryData[0]).map((key) => ({
          wch: Math.max(
            key.length,
            ...summaryData.map((row: any) => String(row[key] || '').length)
          ),
        }))
        summaryWs['!cols'] = summaryColWidths
      }

      // Create a sheet for each severity
      severityOrder.forEach((severity) => {
        if (groupedIssues[severity] && groupedIssues[severity].length > 0) {
          const dataToExport = groupedIssues[severity].map(mapIssueToRow)
          const ws = XLSX.utils.json_to_sheet(dataToExport)
          
          // Auto-size columns
          const colWidths = Object.keys(dataToExport[0] || {}).map((key) => ({
            wch: Math.max(
              key.length,
              ...dataToExport.map((row: any) =>
                String(row[key] || '').length
              )
            ),
          }))
          ws['!cols'] = colWidths
          
          // Sheet name must be <= 31 characters and can't contain certain characters
          const sheetName = severity.length > 31 ? severity.substring(0, 31) : severity
          XLSX.utils.book_append_sheet(wb, ws, sheetName)
        }
      })

      // Add any issues with unknown severity
      if (groupedIssues['UNKNOWN'] && groupedIssues['UNKNOWN'].length > 0) {
        const dataToExport = groupedIssues['UNKNOWN'].map(mapIssueToRow)
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        
        const colWidths = Object.keys(dataToExport[0] || {}).map((key) => ({
          wch: Math.max(
            key.length,
            ...dataToExport.map((row: any) =>
              String(row[key] || '').length
            )
          ),
        }))
        ws['!cols'] = colWidths
        
        XLSX.utils.book_append_sheet(wb, ws, 'UNKNOWN')
      }
    } else {
      // Original single sheet export
      const dataToExport = issues.map(mapIssueToRow)
      const ws = XLSX.utils.json_to_sheet(dataToExport)
      XLSX.utils.book_append_sheet(wb, ws, 'Issues')

      // Auto-size columns
      const colWidths = Object.keys(dataToExport[0] || {}).map((key) => ({
        wch: Math.max(
          key.length,
          ...dataToExport.map((row: any) =>
            String(row[key] || '').length
          )
        ),
      }))
      ws['!cols'] = colWidths
    }

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename || 'sonarqube-issues.xlsx'}"`,
      },
    })
  } catch (error) {
    console.error('Excel export error:', error)
    return NextResponse.json(
      { error: 'Failed to export Excel file', details: String(error) },
      { status: 500 }
    )
  }
}

