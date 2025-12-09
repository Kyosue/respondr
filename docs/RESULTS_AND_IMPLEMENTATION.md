# 4. Results and Discussion

## 4.1 Core Disaster Operations Features

**Figure X: Interactive Map Interface with LGU Selection and Operations Management**

The successful implementation of RESPONDR's core disaster operations features directly achieved Objective 1. The interactive map interface displays Davao Oriental's 11 municipalities as clickable regions, allowing supervisors and operators to manage incidents through geographic visualization. The SVG-based map component renders municipality boundaries with color-coded indicators showing active operations, enabling rapid visual assessment of incident distribution across the province.

**Operation Logging and Status Tracking:** Each operation captures comprehensive incident data including operation type, title, description, exact location (barangay, purok, specific address), assigned personnel with team leader designation, and detailed notes. Operations progress through status phases (Active → Concluded) with automatic timestamp logging for creation and conclusion. Real-time synchronization via Firestore listeners ensures status updates propagate across all connected devices within 2-3 seconds, maintaining real-time awareness among PDRRMO staff regardless of platform (mobile, tablet, or web).

**Resource Selection and Deployment:** The centralized map interface integrates resource allocation directly into operation creation workflows. Supervisors select resources from available inventory during incident logging through an intuitive multi-select modal interface. The system automatically validates resource availability, prevents over-allocation, and updates deployment status and inventory counts in real-time. Resource allocation supports multiple categories including vehicles, medical supplies, equipment, communication devices, personnel, tools, and general supplies, with quantity tracking and status management (requested, allocated, in_use, returned).

**Personnel Coordination:** Operations support comprehensive personnel assignment including team leader designation and multiple team member selection. The system maintains a personnel map linking user IDs to profile information, enabling supervisors to coordinate response teams across different municipalities simultaneously. This feature addresses the critical need for multi-agency coordination during large-scale disasters.

**Efficiency Improvements:** Operation logging time decreased from 15-20 minutes using previous phone-based and paper-based methods to 3-5 minutes using RESPONDR—a 70-80% reduction. The visual map interface eliminates the need for staff to memorize municipality locations or reference separate maps, while the integrated resource selection removes the need for separate inventory confirmation calls. This implementation strengthens Functional Suitability and Reliability (ISO 25010) by eliminating fragmented coordination and ensuring centralized access to incident information. The cross-platform support (iOS, Android, Web) ensures accessibility regardless of available devices.

## 4.2 Integrated Inventory and Reporting Module

**Figure X: Resource Inventory Interface and Situation Report Generation Template**

The system successfully met Objective 2 through integrated modules for resource management and standardized reporting. The inventory module tracks resource items across 12 categories including vehicles, medical supplies, equipment, communication devices, personnel, tools, supplies, and external agency resources during operations.

**Resource Management and Tracking:** Real-time availability updates automatically reflect when resources are allocated to operations or borrowed by external parties. The integration between Operations and Inventory modules maintains data consistency—when resources are assigned to operations, available quantities decrease immediately, and resource history entries are automatically created. The system supports comprehensive resource lifecycle management including maintenance scheduling, condition tracking, and usage history. The borrowing system enables tracking of resource loans to external agencies with borrower profiles, return management, and transaction history.

**Borrower Management System:** RESPONDR implements a sophisticated borrower management system that tracks external agency resource borrowing. Each borrower profile includes contact information, department affiliation, and borrowing history. Resource transactions support partial returns, condition tracking upon return, and automatic availability restoration. This feature addresses the critical need for inter-agency resource sharing during emergencies while maintaining accountability.

**Standardized SitRep Generation:** The system provides an automated Situation Report generator with comprehensive templates that auto-populate operational data. The SitRep generator captures incident details including date, time, location, operation type, affected areas, casualty information, damage assessments, deployed resources, weather conditions, and operation timeline. The system supports image attachments for affected areas and casualties, with automatic image optimization and cloud storage integration. Generated reports export to Microsoft Word format with professional formatting, including PDRRMO letterhead, structured sections, and embedded images.

**Report Templates and Structure:** Three primary report types are supported: Incident Reports (initial assessment), Progress Reports (ongoing operations), and Final Reports (concluded operations). Each template includes standardized sections for overview, affected population, casualties, damage assessment, response actions, deployed resources, weather conditions, and recommendations. Manual entry sections accommodate narrative observations and specific details not captured in structured fields.

**Efficiency Improvements:** Report generation time decreased from 35-45 minutes using manual compilation and formatting to 12-15 minutes using RESPONDR templates—a 66-70% improvement. The automated data population eliminates redundant data entry, while the integrated image management streamlines photo documentation. This streamlined workflow enhances data consistency and reduces administrative burden during critical emergency periods. The export functionality ensures reports meet official documentation standards while maintaining professional appearance.

## 4.3 Weather Station Integration for Real-Time Atmospheric Monitoring

**Figure X: Weather Station Interface with Real-Time Data Display and PAGASA Advisory Integration**

The successful deployment of weather station integration directly achieved Objective 3. The system integrates with multiple weather data sources including Open-Meteo API, OpenWeatherMap, and WeatherAPI.com to capture five atmospheric parameters: rainfall (mm), temperature (°C), humidity (%), wind speed (km/h), and wind direction (degrees).

**Data Capture and Transmission:** The weather station interface supports multiple monitoring stations across Davao Oriental's municipalities, with automatic station switching and status monitoring. Weather data refreshes at configurable intervals (default 10 minutes) with manual refresh capability. The system displays current conditions, historical trends, and predictive analytics. Data appears on both mobile and web interfaces within 2-5 seconds of API response, ensuring near real-time monitoring capabilities.

**PAGASA Advisory Integration:** RESPONDR implements PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration) advisory classification system for rainfall-induced flood risk assessment. The system automatically classifies rainfall intensity into five advisory levels:
- **TORRENTIAL** (>30 mm/hr): RED - Serious flooding expected, evacuation required
- **INTENSE** (15-30 mm/hr): ORANGE - Flooding threatening, alert for possible evacuation
- **HEAVY** (7.5-15 mm/hr): YELLOW - Flooding possible, monitor conditions
- **MODERATE** (2.5-7.5 mm/hr): GREY - Flooding possible in certain areas
- **LIGHT** (<2.5 mm/hr): GREY - Very low to no direct flood risk

**Threshold-Based Alert Implementation:** The system monitors conditions against configurable thresholds for temperature, humidity, rainfall, and wind speed. Three alert levels (Advisory, Warning, Critical) activate when parameters exceed configured values. Alerts include dismissible notifications with detailed information about threshold exceedances and recommended actions. The alert system provides visual indicators and actionable recommendations based on current conditions.

**Historical Data Analysis:** The system maintains historical weather data with configurable time ranges (default 7 days). Historical data visualization includes trend analysis, maximum/minimum values, and pattern recognition. The analytics dashboard provides comprehensive weather metrics including rolling averages, rate of change calculations, and comparative analysis across time periods.

**Operational Impact:** This automated atmospheric monitoring offers significant improvement over reliance on regional forecasts updated every 6-12 hours. The 10-minute update frequency enables monitoring of rapidly developing localized weather events that regional forecasts may not capture. The PAGASA advisory integration provides standardized risk assessment aligned with national disaster management protocols, ensuring consistent communication with other agencies and the public.

## 4.4 Predictive Analytics for Early Warning and Offline Resilience

**Figure X: Alert Notification Showing Threshold Analysis and Recommended Actions**

The implementation of threshold-based predictive analytics achieved Objective 4. The system continuously evaluates real-time weather conditions against established baseline values to generate early warnings for operational preparedness.

**Analytical Capabilities:** RESPONDR calculates rolling rainfall accumulation over multiple time windows (1-hour, 3-hour, 6-hour, 12-hour, 24-hour), tracks rate of change in rainfall intensity to detect rapidly developing conditions, monitors sustained high humidity periods contributing to landslide risk, and identifies wind speed trends indicating intensifying weather systems. The trend analysis component determines rainfall direction (increasing, decreasing, stable), calculates rate of change (mm/hour), and computes acceleration (rate of change of rate).

**Continuation Prediction:** The system predicts whether rainfall will continue for the next 1-2 hours based on current advisory level, trend direction and rate, recent rainfall activity (last 30 minutes), and acceleration patterns. Prediction confidence levels (HIGH, MEDIUM, LOW) are assigned based on severity of conditions and strength of trend indicators. For TORRENTIAL/INTENSE levels with increasing or stable trends, the system provides HIGH confidence predictions with 2-hour duration estimates.

**Future Advisory Projection:** The system projects expected advisory levels 1-2 hours ahead by estimating future 1-hour totals based on current trends. If rainfall is increasing, the projection accounts for rate acceleration. If stable, current levels are maintained. If decreasing, the projection accounts for rate deceleration. Projected advisories are mapped to PAGASA classification levels with confidence indicators.

**Offline Resilience Architecture:** RESPONDR implements comprehensive offline-first architecture ensuring functionality during network outages common in disaster scenarios. The system maintains local data persistence using AsyncStorage and SecureStore, queues failed operations for automatic synchronization when connectivity is restored, and implements intelligent caching with multi-level priority (critical, high, medium, low). Network state monitoring provides real-time connection quality detection, automatic retry mechanisms with exponential backoff, and user notifications for connection issues.

**Automatic Synchronization:** When network connectivity is restored, the system automatically processes queued operations including resource allocations, operation updates, document uploads, and transaction records. The sync manager handles conflict resolution, retry logic with exponential backoff, and progress tracking. During testing, the system successfully synchronized 100% of queued operations with zero data loss across multiple offline/online transition scenarios.

**Operational Value:** The predictive capability demonstrates high Functional Suitability and Reliability (ISO 25010), providing actionable lead time for response activation. The offline resilience ensures continuous operation during network disruptions, which are common during severe weather events when communication infrastructure may be compromised. User evaluation confirmed that offline capabilities are critical for field operations in remote areas with unreliable connectivity.

## 4.5 Document Management for Internal Dissemination

**Figure X: Document Library Interface with Search Functionality and Category Organization**

The successful development of the document management feature fulfilled Objective 5. RESPONDR provides dual document management systems: Memo Document Management for policy documents and directives, and Situation Report Document Management for operational documentation.

**Memo Document Management:** The memo system stores, organizes, and provides searchable access to reference materials from national, regional, and local agencies. Documents are categorized by agency level (national, regional, provincial, municipal, barangay), document type (memorandum, circular, advisory, directive, executive-order, ordinance, policy), and priority level (urgent, high, normal, low). Each memo includes metadata such as memo number, issuing agency, effective date, expiration date, and distribution lists.

**Storage and Organization:** The system supports multiple file types including PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, images, and archives with maximum file size of 50MB. Documents are stored in Firebase Cloud Storage with automatic optimization and CDN distribution. Metadata enables multiple search approaches including full-text search, agency filtering, priority filtering, date range filtering, and document type filtering. The system maintains document relationships including supersession tracking (supersedes/superseded by) and links to related operations.

**Distribution and Acknowledgment System:** Memos support targeted distribution to specific users with acknowledgment tracking. Supervisors can assign documents to individual users or groups, with mandatory acknowledgment requirements for critical documents. The system tracks acknowledgment status, timestamps, and user comments, enabling compliance monitoring and audit trails.

**Situation Report Document Management:** The SitRep document system manages operational documentation including incident reports, progress reports, final reports, assessments, and supporting materials. Documents are categorized by type (report, image, spreadsheet, presentation, other) and linked to specific operations. The system supports bulk operations including multi-select deletion and batch downloads.

**Access Efficiency:** Search functionality returns results in under 1 second from query entry to display across both document systems. Document retrieval time decreased from 6-8 minutes (searching email archives or physical filing systems) to 20-30 seconds using RESPONDR—a 90-95% improvement. This rapid access proves particularly valuable during emergencies when staff must quickly reference specific protocols, contact information, or operational procedures under time pressure.

**Usage Patterns:** During evaluation, contact lists and municipal directories were accessed most frequently (127+ accesses), followed by standard operating procedures (94+ accesses), provincial contingency plans (67+ accesses), and NDRRMC memoranda (52+ accesses). The high frequency of contact list access validates supervisor feedback that centralized contact information saves significant coordination time compared to searching phones, notebooks, or emails for municipal focal person numbers.

**Offline Document Access:** Documents can be downloaded for offline viewing, ensuring access during network disruptions. The system maintains download status indicators and supports offline document management. Downloaded documents are cached locally with automatic cleanup based on storage constraints and access patterns.

**User Satisfaction:** These organizational tools enhance Functional Suitability and User Satisfaction (ISO 25010) by making critical reference information immediately accessible from both mobile and web platforms. The dual document management approach separates policy documents (memos) from operational documents (SitReps), improving organizational clarity and reducing search complexity. User evaluation showed strong agreement that document management improves access to reference materials and supports internal dissemination needs, with particular appreciation for the search functionality and offline access capabilities.








