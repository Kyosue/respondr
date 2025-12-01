
export interface SitrepData {
  operation: string;
  date: string;
  time: string;
  reportingOffice: string;
  overview: string;
  affectedImages: Array<{ data: string; name: string }>;
  casualtyImages: Array<{ data: string; name: string }>;
  affectedAreas: Array<{ municipality: string; details: string }>;
  totalBarangays: string;
  casualties: {
    injured: string;
    injuredNotes: string;
    missing: string;
    fatalities: string;
    evacuatedFamilies: string;
    individuals: string;
  };
  evacuationCenters: string[];
  responseActions: {
    operations: string[];
    medical: string[];
    logistics: string[];
    coordination: string[];
  };
  personnel: Array<{ role: string; detail: string }>;
  assets: string[];
}

export const exportSitrepToDoc = async (sitrep: SitrepData) => {
  // Create HTML content for Word document with robust formatting
  let html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word">
  <meta name="Originator" content="Microsoft Word">
  <title>SITREP - ${sitrep.operation}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1in 1in 1in 1in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    
    .document-wrapper {
      width: 100%;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
    }
    
    /* Header Styles */
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
    }
    
    .header .republic {
      font-size: 10pt;
      font-style: italic;
      margin: 0 0 8px 0;
    }
    
    .header .province {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 8px 0;
      letter-spacing: 0.5pt;
    }
    
    .header .office {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 8px 0;
      letter-spacing: 0.5pt;
    }
    
    .header .address {
      font-size: 10pt;
      font-style: italic;
      margin: 8px 0;
    }
    
    .header .contact {
      font-size: 9pt;
      margin: 8px 0;
      line-height: 1.4;
    }
    
    .header .divider {
      border-top: 1px solid #000;
      margin: 12px 0;
    }
    
    .header .emergency {
      font-size: 9pt;
      margin: 8px 0;
      line-height: 1.4;
    }
    
    .header .operation-name {
      font-size: 12pt;
      font-weight: bold;
      margin: 20px 0 10px 0;
      color: #c00;
      text-transform: uppercase;
    }
    
    .header .meta-info {
      font-size: 10pt;
      margin: 5px 0;
      line-height: 1.3;
    }
    
    .header .meta-info strong {
      font-weight: bold;
    }
    
    /* Section Styles */
    .section {
      margin: 25px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: bold;
      margin: 20px 0 12px 0;
      padding: 5px 0;
      border-bottom: 2px solid #000;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    
    .subsection-title {
      font-size: 12pt;
      font-weight: bold;
      margin: 15px 0 8px 0;
      padding-left: 10px;
      border-left: 4px solid #c00;
    }
    
    /* Text Styles */
    p {
      margin: 8px 0;
      text-align: justify;
      text-indent: 0;
    }
    
    .overview-text {
      text-align: justify;
      line-height: 1.6;
      margin: 10px 0;
    }
    
    /* List Styles */
    ul {
      margin: 10px 0;
      padding-left: 30px;
      list-style-type: disc;
    }
    
    ul ul {
      margin: 5px 0;
      padding-left: 25px;
      list-style-type: circle;
    }
    
    li {
      margin: 6px 0;
      line-height: 1.4;
    }
    
    li strong {
      font-weight: bold;
    }
    
    /* Table Styles for Statistics */
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 11pt;
    }
    
    .stats-table td {
      padding: 8px 12px;
      border: 1px solid #333;
    }
    
    .stats-table td:first-child {
      font-weight: bold;
      width: 40%;
      background-color: #f5f5f5;
    }
    
    /* Header Info Table */
    .header-info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10pt;
      border: 1px solid #000;
    }
    
    .header-info-table td {
      padding: 4px 8px;
      border: 1px solid #000;
      vertical-align: top;
      line-height: 1.3;
    }
    
    .header-info-table td:first-child {
      font-weight: bold;
      width: 25%;
      background-color: #ffffff;
    }
    
    .header-info-table td:last-child {
      width: 75%;
    }
    
    /* Image Styles */
    .image-section {
      margin: 20px 0;
      page-break-inside: avoid;
      border: 1px solid #ddd;
      padding: 15px;
      background-color: #fafafa;
    }
    
    .image-section-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 10px;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    
    .image-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 10px 0;
    }
    
    .image-item {
      page-break-inside: avoid;
      text-align: center;
      border: 1px solid #ccc;
      padding: 10px;
      background: white;
    }
    
    .image-item img {
      width: 100%;
      height: 300px;
      object-fit: contain;
      display: block;
      margin: 0 auto 8px auto;
      border: 2px solid #333;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
      background: white;
    }
    
    .image-caption {
      font-size: 10pt;
      font-style: italic;
      text-align: center;
      color: #555;
      margin-top: 5px;
      word-wrap: break-word;
    }
    
    /* Response Actions Numbering */
    .response-item {
      margin: 15px 0;
    }
    
    .response-number {
      font-weight: bold;
      font-size: 12pt;
      margin: 12px 0 8px 0;
    }
    
    /* Resources Table */
    .resource-category {
      font-weight: bold;
      font-size: 12pt;
      margin: 15px 0 8px 0;
      text-decoration: underline;
    }
    
    /* Print Optimization */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .image-item {
        page-break-inside: avoid;
      }
    }
    
    /* Additional utility classes */
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .underline { text-decoration: underline; }
    .text-center { text-align: center; }
    .highlight { background-color: #ffff99; }
    
    /* Emergency status indicators */
    .status-red { color: #c00; font-weight: bold; }
    .status-yellow { color: #ff9900; font-weight: bold; }
    .status-green { color: #090; font-weight: bold; }
  </style>
</head>
<body>
  <div class="document-wrapper">
    <!-- HEADER SECTION -->
    <div class="header">
      <div class="republic">Republic of the Philippines</div>
      <div class="province">PROVINCE OF DAVAO ORIENTAL</div>
      <div class="office">PROVINCIAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE</div>
      <div class="address">Government Center, Brgy. Dahican City of Mati</div>
      <div class="contact">Tel. No. (087) 3883-611: Email Add: pdrrmodavaooriental@gmail.com</div>
      <div class="divider"></div>
      <div class="emergency">Emergency Hotline Nos.: Tel. No. (087) 3884-911/ 09488386060 (TNT)/09535583598(TM) Email Add: opcendavor14@gmail.com</div>
      <div style="margin-top: 25px; border-top: 3px double #000; padding-top: 15px;">
        <h1 style="font-size: 14pt; font-weight: bold; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1pt;">SITUATION REPORT (SITREP)</h1>
        <table class="header-info-table">
          <tr>
            <td>Date of Incident:</td>
            <td>${sitrep.date}</td>
          </tr>
          <tr>
            <td>Time of Incident:</td>
            <td>${sitrep.time}</td>
          </tr>
          <tr>
            <td>Date Issued:</td>
            <td>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td>Time Issued:</td>
            <td>${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}H</td>
          </tr>
          <tr>
            <td>Overview:</td>
            <td>${sitrep.overview || 'No overview provided.'}</td>
          </tr>
          <tr>
            <td>Source:</td>
            <td>${sitrep.reportingOffice || 'PDRRMO'}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <!-- I. SITUATION OVERVIEW -->
    <div class="section">
      <div class="section-title">I. SITUATION OVERVIEW</div>
      <div class="overview-text">${sitrep.overview.replace(/\n\n/g, '</p><p class="overview-text">').replace(/\n/g, '<br>')}</div>
    </div>
    
    <!-- II. AFFECTED AREAS -->
    <div class="section">
      <div class="section-title">II. AFFECTED AREAS</div>
      <ul>
        ${sitrep.affectedAreas.map(area => `<li><strong>Municipality of ${area.municipality}</strong> – ${area.details}</li>`).join('')}
        <li class="bold">Total Affected Barangays: ${sitrep.totalBarangays}</li>
      </ul>
      
      ${sitrep.affectedImages.length > 0 ? `
      <div class="image-section">
        <div class="image-section-title">📸 Affected Areas - Visual Documentation</div>
        <div class="image-grid">
          ${sitrep.affectedImages.map((img, idx) => `
          <div class="image-item">
            <img src="${img.data}" alt="Affected Area ${idx + 1}" />
            <div class="image-caption">Figure ${idx + 1}: ${img.name}</div>
          </div>
          `).join('')}
        </div>
      </div>` : ''}
    </div>
    
    <!-- III. CASUALTIES & VICTIMS -->
    <div class="section">
      <div class="section-title">III. CASUALTIES & VICTIMS (as of reporting)</div>
      
      <table class="stats-table">
        <tr>
          <td>Injured</td>
          <td>${sitrep.casualties.injured} (${sitrep.casualties.injuredNotes})</td>
        </tr>
        <tr>
          <td>Missing</td>
          <td>${sitrep.casualties.missing}</td>
        </tr>
        <tr>
          <td>Fatalities</td>
          <td>${sitrep.casualties.fatalities}</td>
        </tr>
        <tr>
          <td>Evacuated Families</td>
          <td>${sitrep.casualties.evacuatedFamilies}</td>
        </tr>
        <tr>
          <td>Individuals in Evacuation Centers</td>
          <td>${sitrep.casualties.individuals}</td>
        </tr>
      </table>
      
      <div class="subsection-title">Evacuation Centers Activated:</div>
      <ul>
        ${sitrep.evacuationCenters.map(center => `<li>${center}</li>`).join('')}
      </ul>
      
      ${sitrep.casualtyImages.length > 0 ? `
      <div class="image-section">
        <div class="image-section-title">📸 Casualties & Evacuation - Visual Documentation</div>
        <div class="image-grid">
          ${sitrep.casualtyImages.map((img, idx) => `
          <div class="image-item">
            <img src="${img.data}" alt="Casualty Documentation ${idx + 1}" />
            <div class="image-caption">Figure ${idx + 1}: ${img.name}</div>
          </div>
          `).join('')}
        </div>
      </div>` : ''}
    </div>
    
    <!-- IV. RESPONSE ACTIONS -->
    <div class="section">
      <div class="section-title">IV. RESPONSE ACTIONS BY PDRRMO</div>
      
      <div class="response-item">
        <div class="response-number">1. Operations</div>
        <ul>
          ${sitrep.responseActions.operations.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
      
      <div class="response-item">
        <div class="response-number">2. Emergency Medical Response</div>
        <ul>
          ${sitrep.responseActions.medical.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
      
      <div class="response-item">
        <div class="response-number">3. Logistics & Relief</div>
        <p><strong>Distributed first wave of relief:</strong></p>
        <ul style="margin-left: 40px;">
          ${sitrep.responseActions.logistics.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      
      <div class="response-item">
        <div class="response-number">4. Coordination</div>
        <p><strong>Continuous communication with:</strong></p>
        <ul style="margin-left: 40px;">
          ${sitrep.responseActions.coordination.map(org => `<li>${org}</li>`).join('')}
        </ul>
      </div>
    </div>
    
    <!-- V. RESOURCES DEPLOYED -->
    <div class="section">
      <div class="section-title">V. RESOURCES DEPLOYED</div>
      
      <div class="resource-category">Personnel</div>
      <ul>
        ${sitrep.personnel.map(p => `<li>${p.role}${p.detail ? ` <span class="italic">(${p.detail})</span>` : ''}</li>`).join('')}
      </ul>
      
      <div class="resource-category">Assets</div>
      <ul>
        ${sitrep.assets.map(asset => `<li>${asset}</li>`).join('')}
      </ul>
    </div>
    
    <!-- FOOTER -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #000; text-align: center; font-size: 10pt;">
      <p><em>End of Situation Report</em></p>
      <p>Document generated on ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Create blob with proper Word MIME type
  const blob = new Blob(['\ufeff', html], { 
    type: 'application/msword' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SITREP_${sitrep.operation.replace(/[^a-zA-Z0-9]/g, '_')}_${sitrep.date.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

