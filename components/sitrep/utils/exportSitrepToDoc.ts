
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
  responseActions: Array<{ name: string; items: string[] }>;
  personnel: Array<{ role: string; detail: string }>;
  assets: string[];
}

export interface ExportOptions {
  userFullName?: string;
}

// Helper function to resize and compress image
const resizeImage = (file: Blob, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          // Clean up object URL
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
};

// Helper function to convert image URI to base64 data URI with resizing
const convertImageToBase64 = async (imageUri: string, maxWidth: number = 800, maxHeight: number = 600): Promise<string> => {
  // If already a data URI, we still need to resize it
  let blob: Blob;
  
  try {
    if (imageUri.startsWith('data:image/')) {
      // Convert data URI to blob
      const response = await fetch(imageUri);
      blob = await response.blob();
    } else {
      // Fetch the image
      const response = await fetch(imageUri);
      blob = await response.blob();
    }

    // Resize and compress the image
    const resizedBlob = await resizeImage(blob, maxWidth, maxHeight, 0.8);
    
    // Convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(resizedBlob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    // Return a placeholder or the original URI if conversion fails
    return imageUri;
  }
};

// Helper function to convert all images in an array to base64
const convertImagesToBase64 = async (images: Array<{ data: string; name: string }>): Promise<Array<{ data: string; name: string }>> => {
  const convertedImages = await Promise.all(
    images.map(async (img) => ({
      ...img,
      data: await convertImageToBase64(img.data)
    }))
  );
  return convertedImages;
};

// Helper function to escape HTML entities
const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Helper function to load logo image from Expo assets and convert to base64
// Uses require() to ensure Metro bundler includes the asset, then converts to base64
const loadLogoAsBase64 = async (
  logoModule: any, // The result of require() for the logo
  maxWidth: number = 120,
  maxHeight: number = 120
): Promise<string> => {
  try {
    // For web platform, require() typically returns a URL string
    // For native, it might return a number (asset ID) or object
    // Handle all possible formats
    let imageUri: string;
    
    if (typeof logoModule === 'string') {
      // Direct URL string (most common on web)
      imageUri = logoModule;
    } else if (typeof logoModule === 'number') {
      // Asset ID (native platforms) - would need expo-asset to resolve
      // For web export, this shouldn't happen, but handle gracefully
      console.warn('Received asset ID instead of URL - this may not work on web');
      return '';
    } else if (logoModule && typeof logoModule === 'object') {
      // Could be { uri: string }, { default: string }, or similar
      imageUri = logoModule.uri || logoModule.default || logoModule.src || String(logoModule);
    } else {
      console.warn('Invalid logo module format:', typeof logoModule);
      return '';
    }
    
    // Ensure we have a valid URI
    if (!imageUri || (typeof imageUri !== 'string')) {
      console.warn('Could not extract valid URI from logo module');
      return '';
    }

    // If it's already a data URI, return it (after resizing if needed)
    if (imageUri.startsWith('data:image/')) {
      // Resize the data URI image
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const resizedBlob = await resizeImage(blob, maxWidth, maxHeight, 0.9);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(resizedBlob);
      });
    }

    // Load image using Image object (works for web URLs)
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Could not get canvas context');
          resolve('');
          return;
        }

        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const aspectRatio = width / height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve(reader.result as string);
              };
              reader.onerror = () => {
                console.warn('Failed to read logo as base64');
                resolve('');
              };
              reader.readAsDataURL(blob);
            } else {
              console.warn('Failed to convert logo to blob');
              resolve('');
            }
          },
          'image/png',
          0.9
        );
      };
      
      img.onerror = () => {
        console.warn(`Failed to load logo from: ${imageUri}`);
        resolve(''); // Return empty string if logo can't be loaded
      };
      
      img.src = imageUri;
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    return ''; // Return empty string if logo can't be loaded
  }
};

export const exportSitrepToDoc = async (sitrep: SitrepData, options?: ExportOptions) => {
  // Convert all images to base64 before embedding in the document
  const affectedImages = await convertImagesToBase64(sitrep.affectedImages);
  const casualtyImages = await convertImagesToBase64(sitrep.casualtyImages);
  
  // Load logos using require() so Metro bundler can include them
  // This ensures the assets are properly bundled at build time
  let davorLogoBase64 = '';
  let pdrrmoLogoBase64 = '';
  
  try {
    const davorLogoModule = require('@/assets/images/davor-logo.png');
    davorLogoBase64 = await loadLogoAsBase64(davorLogoModule, 120, 120);
  } catch (error) {
    console.warn('Could not load Davao Oriental logo:', error);
  }
  
  try {
    const pdrrmoLogoModule = require('@/assets/images/pdrrmo-logo.png');
    pdrrmoLogoBase64 = await loadLogoAsBase64(pdrrmoLogoModule, 120, 120);
  } catch (error) {
    console.warn('Could not load PDRRMO logo:', error);
  }
  
  // Create HTML content for Word document (Word 97-2003 HTML format - compatible with modern Word)
  // This format is more reliable than trying to create a true .docx ZIP structure
  let html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:v="urn:schemas-microsoft-com:vml" xmlns="http://www.w3.org/TR/REC-html40">
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
      <w:ValidateAgainstSchemas/>
      <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
      <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
      <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
      <w:Compatibility>
        <w:BreakWrappedTables/>
        <w:SnapToGridInCell/>
        <w:WrapTextWithPunct/>
        <w:UseAsianBreakRules/>
      </w:Compatibility>
      <w:AttachedTemplate>
      </w:AttachedTemplate>
      <w:EnvelopeVis/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <!--[if gte mso 9]>
  <style>
    v\\:* { behavior: url(#default#VML); }
    o\\:* { behavior: url(#default#VML); }
    w\\:* { behavior: url(#default#VML); }
    .shape { behavior: url(#default#VML); }
  </style>
  <![endif]-->
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1in 1in 1in 1in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
    }
    
    body {
      font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      color: #333;
    }
    
    .document-wrapper {
      width: 100%;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
    }
    
    /* Header Styles */
    .header {
      margin-bottom: 30px;
      padding-bottom: 15px;
    }
    
    .header-top-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .header-logo-left,
    .header-logo-right {
      width: 120px;
      vertical-align: top;
      padding: 0 10px;
    }
    
    .header-logo-left img,
    .header-logo-right img {
      max-width: 120px;
      max-height: 120px;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    }
    
    .header-content {
      vertical-align: top;
      text-align: center;
      padding: 0 15px;
    }
    
    .header .republic {
      font-size: 10pt;
      font-style: italic;
      margin: 0 0 10px 0;
      color: #555;
      letter-spacing: 0.3pt;
    }
    
    .header .province {
      font-size: 14pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 10px 0;
      letter-spacing: 1pt;
      color: #1a1a1a;
    }
    
    .header .office {
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 10px 0;
      letter-spacing: 0.8pt;
      color: #2c2c2c;
    }
    
    .header .address {
      font-size: 10pt;
      font-style: italic;
      margin: 8px 0;
      color: #666;
    }
    
    .header .contact {
      font-size: 9.5pt;
      margin: 8px 0;
      line-height: 1.5;
      color: #555;
    }
    
    .header .divider {
      border-top: 1px solid #000;
      margin: 12px 0;
    }
    
    .header .emergency {
      font-size: 9.5pt;
      margin: 10px 0;
      line-height: 1.5;
      color: #555;
    }
    
    .header .operation-name {
      font-size: 13pt;
      font-weight: 700;
      margin: 20px 0 12px 0;
      color: #c00;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    
    .header .meta-info {
      font-size: 10.5pt;
      margin: 6px 0;
      line-height: 1.5;
      color: #333;
    }
    
    .header .meta-info strong {
      font-weight: bold;
    }
    
    .title-section {
      margin: 20px 0 22px 0;
      text-align: center;
    }
    
    .title-section h1 {
      font-size: 15pt;
      font-weight: 700;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1.2pt;
      color: #1a1a1a;
      font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
    }
    
    /* Section Styles */
    .section {
      margin: 25px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      margin: 24px 0 14px 0;
      padding: 6px 0;
      border-bottom: 2.5px solid #000;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
      color: #1a1a1a;
    }
    
    .subsection-title {
      font-size: 12.5pt;
      font-weight: 700;
      margin: 18px 0 10px 0;
      padding-left: 12px;
      border-left: 4px solid #c00;
      color: #2c2c2c;
    }
    
    /* Text Styles */
    p {
      margin: 10px 0;
      text-align: justify;
      text-indent: 0;
      color: #333;
    }
    
    .overview-text {
      text-align: justify;
      line-height: 1.7;
      margin: 12px 0;
      color: #333;
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
      margin: 8px 0;
      line-height: 1.6;
      color: #333;
    }
    
    li strong {
      font-weight: 700;
      color: #1a1a1a;
    }
    
    /* Table Styles for Statistics */
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 11pt;
    }
    
    .stats-table td {
      padding: 10px 14px;
      border: 1px solid #333;
      color: #333;
    }
    
    .stats-table td:first-child {
      font-weight: 700;
      width: 40%;
      background-color: #f8f8f8;
      color: #1a1a1a;
    }
    
    /* Header Info Table */
    .header-info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 10.5pt;
      border: 1.5px solid #000;
    }
    
    .header-info-table td {
      padding: 6px 10px;
      border: 1px solid #000;
      vertical-align: top;
      line-height: 1.5;
      color: #333;
    }
    
    .header-info-table td:first-child {
      font-weight: 700;
      width: 25%;
      background-color: #f8f8f8;
      color: #1a1a1a;
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
      font-weight: 700;
      font-size: 12pt;
      margin-bottom: 12px;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
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
      max-width: 400px;
      max-height: 300px;
      width: auto;
      height: auto;
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
      color: #666;
      margin-top: 8px;
      word-wrap: break-word;
      line-height: 1.4;
    }
    
    /* Response Actions Numbering */
    .response-item {
      margin: 15px 0;
    }
    
    .response-number {
      font-weight: 700;
      font-size: 12.5pt;
      margin: 14px 0 10px 0;
      color: #1a1a1a;
      letter-spacing: 0.3pt;
    }
    
    /* Resources Table */
    .resource-category {
      font-weight: 700;
      font-size: 12.5pt;
      margin: 18px 0 10px 0;
      text-decoration: underline;
      color: #1a1a1a;
      letter-spacing: 0.3pt;
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
    .bold { font-weight: 700; color: #1a1a1a; }
    .italic { font-style: italic; }
    .underline { text-decoration: underline; }
    .text-center { text-align: center; }
    .highlight { background-color: #ffff99; }
    
    /* Emergency status indicators */
    .status-red { color: #c00; font-weight: 700; }
    .status-yellow { color: #ff9900; font-weight: 700; }
    .status-green { color: #090; font-weight: 700; }
  </style>
</head>
<body>
  <div class="document-wrapper">
    <!-- HEADER SECTION -->
    <div class="header">
      <!-- Header with logos on sides using table for proper Word rendering -->
      <table class="header-top-table">
        <tr>
          <td class="header-logo-left">
            ${davorLogoBase64 ? `<img src="${davorLogoBase64}" alt="Davao Oriental Logo" style="width:120px;height:auto;display:block;" />` : '<div style="width:120px;"></div>'}
          </td>
          <td class="header-content">
            <div class="republic">Republic of the Philippines</div>
            <div class="province">PROVINCE OF DAVAO ORIENTAL</div>
            <div class="office">PROVINCIAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE</div>
            <div class="address">Government Center, Brgy. Dahican City of Mati</div>
            <div class="contact">Tel. No. (087) 3883-611: Email Add: pdrrmodavaooriental@gmail.com</div>
            <div class="divider"></div>
            <div class="emergency">Emergency Hotline Nos.: Tel. No. (087) 3884-911/ 09488386060 (TNT)/09535583598(TM) Email Add: opcendavor14@gmail.com</div>
          </td>
          <td class="header-logo-right">
            ${pdrrmoLogoBase64 ? `<img src="${pdrrmoLogoBase64}" alt="PDRRMO Logo" style="width:120px;height:auto;display:block;" />` : '<div style="width:120px;"></div>'}
          </td>
        </tr>
      </table>
      
      <div style="margin-top: 15px;">
        <div style="margin-bottom: 12px;">
          <div style="margin-bottom: 4px;"><strong>FOR :</strong> HON. NIÑO SOTERO L. UY, JR</div>
          <div style="margin-bottom: 4px; padding-left: 60px;">Governor/PDRRMC Chairperson Davao Oriental</div>
          <div style="margin-bottom: 4px;"><strong>THRU :</strong> ENGR. JESUSA C. TIMBANG</div>
          <div style="margin-bottom: 12px; padding-left: 60px;">PGDH - PDRRMO</div>
        </div>
        
        <div style="margin-bottom: 15px; font-size: 13pt; font-weight: 700;">
          ${sitrep.operation ? `Initial report re: ${escapeHtml(sitrep.operation)}` : 'Initial Report'}
        </div>
        
        <table class="header-info-table">
          <tr>
            <td>Date of Incident</td>
            <td>${escapeHtml(sitrep.date || '')}</td>
          </tr>
          <tr>
            <td>Time of Incident</td>
            <td>${escapeHtml(sitrep.time || '')}</td>
          </tr>
          <tr>
            <td>Date Issued</td>
            <td>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td>Time Issued</td>
            <td>${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}H</td>
          </tr>
          <tr>
            <td>Overview</td>
            <td>${escapeHtml(sitrep.overview || 'No overview provided.')}</td>
          </tr>
          <tr>
            <td>Source</td>
            <td></td>
          </tr>
        </table>
        
        <div style="margin-top: 20px;">
          <div style="margin-bottom: 3px;"><strong>Prepared by:</strong> ${escapeHtml(options?.userFullName || '')}</div>
          <div style="margin-bottom: 12px; margin-left: 20px;">Operations and Warning Section</div>
          <div style="margin-bottom: 3px;"><strong>Reviewed by:</strong> Francis Jason J. Bendulo, MCDRM</div>
          <div style="margin-left: 20px;">PGADH-PDRRMO</div>
        </div>
      </div>
    </div>
    
    <!-- I. SITUATION OVERVIEW -->
    <div class="section">
      <div class="section-title">I. SITUATION OVERVIEW</div>
      <p class="overview-text">${escapeHtml(sitrep.overview || 'No overview provided.').replace(/\n\n/g, '</p><p class="overview-text">').replace(/\n/g, '<br>')}</p>
    </div>
    
    <!-- II. AFFECTED AREAS -->
    <div class="section">
      <div class="section-title">II. AFFECTED AREAS</div>
      <ul>
        ${sitrep.affectedAreas.map(area => `<li><strong>Municipality of ${escapeHtml(area.municipality)}</strong> – ${escapeHtml(area.details)}</li>`).join('')}
        <li class="bold">Total Affected Barangays: ${sitrep.totalBarangays}</li>
      </ul>
      
      ${affectedImages.length > 0 ? `
      <div class="image-section">
        <div class="image-section-title">📸 Affected Areas - Visual Documentation</div>
        <div class="image-grid">
          ${affectedImages.map((img, idx) => `
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
      
      ${casualtyImages.length > 0 ? `
      <div class="image-section">
        <div class="image-section-title">📸 Casualties & Evacuation - Visual Documentation</div>
        <div class="image-grid">
          ${casualtyImages.map((img, idx) => `
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
      
      ${sitrep.responseActions.map((section, idx) => `
      <div class="response-item">
        <div class="response-number">${idx + 1}. ${section.name || 'Untitled Section'}</div>
        <ul>
          ${section.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      `).join('')}
      
      ${sitrep.responseActions.length === 0 ? '<p><em>No response actions documented.</em></p>' : ''}
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
    <div style="margin-top: 40px; padding-top: 22px; border-top: 2px solid #000; text-align: center; font-size: 10pt; color: #666; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">
      <p style="margin: 8px 0; font-style: italic; color: #555;"><em>End of Situation Report</em></p>
      <p style="margin: 8px 0; color: #666;">Document generated on ${new Date().toLocaleString('en-US', { 
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

  // Create blob with Word HTML format
  // Note: True .docx requires a ZIP archive with XML files (complex)
  // HTML-based .doc format is more reliable and works with modern Word
  // The BOM (\ufeff) ensures proper UTF-8 encoding recognition by Word
  const htmlContent = html.trim();
  const blob = new Blob(['\ufeff', htmlContent], { 
    type: 'application/msword' 
  });
  
  const fileName = `SITREP_${sitrep.operation.replace(/[^a-zA-Z0-9]/g, '_')}_${sitrep.date.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
  
  // Download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Return blob and filename for saving to database
  return { blob, fileName };
};
