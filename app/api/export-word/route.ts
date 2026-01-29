import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { issues, filename } = await request.json()

    if (!issues || !Array.isArray(issues)) {
      return NextResponse.json(
        { error: 'Invalid issues data' },
        { status: 400 }
      )
    }

    // Generate Word document content as HTML (which can be saved as .docx)
    // We'll use a simple HTML format that Word can open
    const formatDate = (dateString: string) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString()
    }

    const getFileName = (component: string) => {
      const parts = component.split(':')
      return parts[parts.length - 1] || component
    }

    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SonarQube Issues Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      line-height: 1.6;
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 10px;
    }
    h2 {
      color: #555;
      margin-top: 30px;
      border-bottom: 2px solid #ccc;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 11pt;
    }
    th {
      background-color: #0066cc;
      color: white;
      padding: 10px;
      text-align: left;
      border: 1px solid #ddd;
    }
    td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .severity-BLOCKER {
      background-color: #b91c1c;
      color: white;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
    }
    .severity-CRITICAL {
      background-color: #dc2626;
      color: white;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
    }
    .severity-MAJOR {
      background-color: #f97316;
      color: white;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
    }
    .severity-MINOR {
      background-color: #eab308;
      color: #000;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
    }
    .severity-INFO {
      background-color: #3b82f6;
      color: white;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
    }
    .summary {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .summary-item {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <h1>SonarQube Issues Report</h1>
  <div class="summary">
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Total Issues:</strong> ${issues.length}</p>
  </div>
  
  <h2>Issues Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Severity</th>
        <th>Type</th>
        <th>Status</th>
        <th>Message</th>
        <th>File</th>
        <th>Line</th>
        <th>Rule</th>
        <th>Effort</th>
        <th>Author</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>`

    issues.forEach((issue: any) => {
      htmlContent += `
      <tr>
        <td><span class="severity-${issue.severity}">${issue.severity}</span></td>
        <td>${issue.type || ''}</td>
        <td>${issue.status || ''}</td>
        <td>${(issue.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td>${getFileName(issue.component || '')}</td>
        <td>${issue.line || ''}</td>
        <td>${issue.rule || ''}</td>
        <td>${issue.effort || ''}</td>
        <td>${issue.author || '-'}</td>
        <td>${formatDate(issue.creationDate)}</td>
      </tr>`
    })

    htmlContent += `
    </tbody>
  </table>
  
  <h2>Detailed Issue Information</h2>`

    issues.forEach((issue: any, index: number) => {
      htmlContent += `
  <div style="margin: 30px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
    <h3 style="color: #0066cc; margin-top: 0;">Issue #${index + 1}: ${(issue.message || '').substring(0, 100)}</h3>
    <table style="width: 100%; margin: 10px 0;">
      <tr><td style="width: 200px; font-weight: bold;">Key:</td><td>${issue.key || ''}</td></tr>
      <tr><td style="font-weight: bold;">Severity:</td><td><span class="severity-${issue.severity}">${issue.severity}</span></td></tr>
      <tr><td style="font-weight: bold;">Type:</td><td>${issue.type || ''}</td></tr>
      <tr><td style="font-weight: bold;">Status:</td><td>${issue.status || ''}</td></tr>
      <tr><td style="font-weight: bold;">Component:</td><td>${issue.component || ''}</td></tr>
      <tr><td style="font-weight: bold;">File:</td><td>${getFileName(issue.component || '')}</td></tr>
      <tr><td style="font-weight: bold;">Line:</td><td>${issue.line || ''}${issue.textRange?.startLine !== issue.textRange?.endLine ? ` (${issue.textRange?.startLine}-${issue.textRange?.endLine})` : ''}</td></tr>
      <tr><td style="font-weight: bold;">Rule:</td><td>${issue.rule || ''}</td></tr>
      <tr><td style="font-weight: bold;">Message:</td><td>${(issue.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>
      <tr><td style="font-weight: bold;">Effort:</td><td>${issue.effort || ''}</td></tr>
      <tr><td style="font-weight: bold;">Debt:</td><td>${issue.debt || ''}</td></tr>
      <tr><td style="font-weight: bold;">Author:</td><td>${issue.author || '-'}</td></tr>
      <tr><td style="font-weight: bold;">Created:</td><td>${formatDate(issue.creationDate)}</td></tr>
      <tr><td style="font-weight: bold;">Updated:</td><td>${formatDate(issue.updateDate)}</td></tr>
      ${issue.tags && issue.tags.length > 0 ? `<tr><td style="font-weight: bold;">Tags:</td><td>${issue.tags.join(', ')}</td></tr>` : ''}
      ${issue.scope ? `<tr><td style="font-weight: bold;">Scope:</td><td>${issue.scope}</td></tr>` : ''}
      ${issue.cleanCodeAttribute ? `<tr><td style="font-weight: bold;">Clean Code Attribute:</td><td>${issue.cleanCodeAttribute}</td></tr>` : ''}
      ${issue.cleanCodeAttributeCategory ? `<tr><td style="font-weight: bold;">Category:</td><td>${issue.cleanCodeAttributeCategory}</td></tr>` : ''}
    </table>
    ${issue.impacts && issue.impacts.length > 0 ? `
    <p><strong>Impacts:</strong></p>
    <ul>
      ${issue.impacts.map((impact: any) => `<li>${impact.softwareQuality} (${impact.severity})</li>`).join('')}
    </ul>
    ` : ''}
    ${issue.flows && issue.flows.length > 0 ? `
    <p><strong>Flows (${issue.flows.length}):</strong></p>
    ${issue.flows.map((flow: any, flowIdx: number) => `
      <div style="margin-left: 20px; padding: 10px; background-color: #f9f9f9; margin-bottom: 10px;">
        ${flow.locations.map((location: any, locIdx: number) => `
          <p style="margin: 5px 0;">
            <strong>${getFileName(location.component)}</strong>:${location.textRange?.startLine || ''}
            ${location.msg ? ` - ${location.msg}` : ''}
          </p>
        `).join('')}
      </div>
    `).join('')}
    ` : ''}
  </div>`
    })

    htmlContent += `
</body>
</html>`

    // Convert HTML to Word-compatible format
    // Word can open HTML files, but we'll set the content type appropriately
    const buffer = Buffer.from(htmlContent, 'utf-8')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${filename || 'sonarqube-issues.doc'}"`,
      },
    })
  } catch (error) {
    console.error('Word export error:', error)
    return NextResponse.json(
      { error: 'Failed to export Word document', details: String(error) },
      { status: 500 }
    )
  }
}




