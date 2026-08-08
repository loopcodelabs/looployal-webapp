import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} from 'docx';

export async function generateArchitectureDocx(): Promise<Buffer> {
  const primaryColor = '4F46E5'; // Indigo/Purple
  const secondaryColor = '0F172A'; // Dark Slate
  const lightBgColor = 'F8FAFC'; // Off-white
  const accentColor = '059669'; // Emerald Green
  const borderColor = 'CBD5E1';

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Multi-Tenant Loyalty SaaS | Production Architecture Specification',
                    size: 18,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 18,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 18,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: '  |  Confidential & Proprietary Enterprise Systems Blueprint',
                    size: 18,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // TITLE COVER BLOCK
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'PRODUCTION SYSTEM ARCHITECTURE',
                size: 36,
                bold: true,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Multi-Tenant Loyalty & Rewards SaaS Platform (Enterprise Blueprint)',
                size: 26,
                bold: true,
                color: secondaryColor,
                font: 'Arial',
              }),
            ],
          }),

          // METADATA BOX
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: primaryColor },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: primaryColor },
                      left: { style: BorderStyle.SINGLE, size: 24, color: primaryColor },
                      right: { style: BorderStyle.SINGLE, size: 6, color: primaryColor },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 120, after: 60 },
                        children: [
                          new TextRun({ text: 'Version: ', bold: true, size: 20, font: 'Arial' }),
                          new TextRun({ text: '2.0.0 (Production Candidate)', size: 20, font: 'Arial' }),
                          new TextRun({ text: '    |    Date: ', bold: true, size: 20, font: 'Arial' }),
                          new TextRun({ text: 'August 2026', size: 20, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 60, after: 120 },
                        children: [
                          new TextRun({ text: 'Target Infrastructure: ', bold: true, size: 20, font: 'Arial' }),
                          new TextRun({ text: 'Google Cloud Platform (Cloud Run, PostgreSQL, Cloud Armor)', size: 20, font: 'Arial' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // SECTION 1: EXECUTIVE SUMMARY
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '1. Executive Summary & Core Objectives',
                bold: true,
                size: 28,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: 'The Multi-Tenant Loyalty & Rewards SaaS Platform is a high-concurrency, zero-trust cloud solution designed to enable retail networks, fuel station networks (e.g., Indian Oil, Bharat Petroleum), restaurant chains (e.g., Paradise Biryani), and supermarket groups (e.g., Reliance Smart) to operate secure, customer-centric loyalty reward engines.',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Key Production Requirements Met:',
                bold: true,
                size: 22,
                color: secondaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Zero-Trust Multi-Tenant Isolation: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Guarantees total data and balance isolation between distinct business tenants at API, middleware, and database queries.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Double-Entry Immutable Ledger: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'All point credits and point redemptions are recorded as financial-grade ledger entries with audit reference numbers.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'High-Speed Cashier POS Interface: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Optimized for <1 second QR code lookup and instant bill reward calculation.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'Dual-Key OTP Verification: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Protects customer point redemptions via an out-of-band 6-digit SMS OTP verification workflow.', size: 20, font: 'Arial' }),
            ],
          }),

          // SECTION 2: SYSTEM ARCHITECTURE
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '2. System Architecture Blueprint',
                bold: true,
                size: 28,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: 'The platform employs a decoupled full-stack architecture comprising a React 19 Single Page Application (SPA) on the frontend and an Express Node.js REST API service on the backend.',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),

          // ARCHITECTURE ILLUSTRATION / DIAGRAM (TEXT-SCHEMATIC BOX)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: '0F172A', type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 8, color: '334155' },
                      bottom: { style: BorderStyle.SINGLE, size: 8, color: '334155' },
                      left: { style: BorderStyle.SINGLE, size: 8, color: '334155' },
                      right: { style: BorderStyle.SINGLE, size: 8, color: '334155' },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 100, after: 60 },
                        children: [
                          new TextRun({
                            text: '  +-----------------------------------------------------------------------------------+',
                            size: 18,
                            color: '38BDF8',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  |                             PRESENTATION LAYER (SPA)                              |',
                            size: 18,
                            color: '38BDF8',
                            bold: true,
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  | [Customer Web/PWA]   [Cashier POS Interface]   [Merchant Admin]   [Super Admin]   |',
                            size: 18,
                            color: 'F1F5F9',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  +-----------------------------------------+-----------------------------------------+',
                            size: 18,
                            color: '38BDF8',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '                                            |  HTTPS (Bearer JWT / CORS / Rate-Limit)',
                            size: 18,
                            color: '94A3B8',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  +-----------------------------------------v-----------------------------------------+',
                            size: 18,
                            color: '34D399',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  |                             API & APPLICATION GATEWAY                             |',
                            size: 18,
                            color: '34D399',
                            bold: true,
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  | Node.js Express Server  *  JWT Auth & RBAC Guard  *  Tenant Resolver Middleware    |',
                            size: 18,
                            color: 'F1F5F9',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  +-------+---------------------------------+---------------------------------+-------+',
                            size: 18,
                            color: '34D399',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '          |                                 |                                 |',
                            size: 18,
                            color: '94A3B8',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  +-------v-------+                 +-------v-------+                 +-------v-------+',
                            size: 18,
                            color: 'F59E0B',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  | LEDGER ENGINE |                 | DATA STORE    |                 | SMS ENGINE    |',
                            size: 18,
                            color: 'F59E0B',
                            bold: true,
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  | Atomic Commit |                 | PostgreSQL /  |                 | Abstract Provider',
                            size: 18,
                            color: 'F1F5F9',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '  | Double-Entry  |                 | Spanner Store |                 | OTP Generator |',
                            size: 18,
                            color: 'F1F5F9',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 100 },
                        children: [
                          new TextRun({
                            text: '  +---------------+                 +---------------+                 +---------------+',
                            size: 18,
                            color: 'F59E0B',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // SECTION 3: API SPECIFICATION DOCUMENTATION
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '3. Production REST API Specification',
                bold: true,
                size: 28,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: 'All endpoints follow standard RESTful conventions, returning HTTP 200/201 on success and HTTP 400/401/403/404/500 on failure with structured JSON error responses.',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),

          // API TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header Row
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: secondaryColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Method & Endpoint', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
                  }),
                  new TableCell({
                    shading: { fill: secondaryColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Role Guard', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
                  }),
                  new TableCell({
                    shading: { fill: secondaryColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Description & Payload', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })],
                  }),
                ],
              }),
              // Row 1
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/auth/otp/request', bold: true, size: 18, font: 'Courier New' })] })],
                  }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Public', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Triggers customer login/redemption OTP to mobile number.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              // Row 2
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/auth/otp/verify', bold: true, size: 18, font: 'Courier New' })] })],
                  }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Public', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Verifies OTP, provisions customer/wallets, issues JWT.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              // Row 3
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'GET /api/v1/cashier/membership/scan/:code', bold: true, size: 18, font: 'Courier New' })] })],
                  }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASHIER, MANAGER', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Scans QR or mobile ID. Enforces strict tenant isolation!', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              // Row 4
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/cashier/points/credit', bold: true, size: 18, font: 'Courier New' })] })],
                  }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASHIER, MANAGER', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Calculates points based on tenant reward %, posts ledger entry.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              // Row 5
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/cashier/points/redeem', bold: true, size: 18, font: 'Courier New' })] })],
                  }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASHIER, MANAGER', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Verifies customer OTP, deducts points from wallet ledger.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              // Row 6
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'GET /api/v1/merchant/metrics', bold: true, size: 18, font: 'Courier New' })] })],
                  }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'BUSINESS_OWNER', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fetches sales, points issued/redeemed, wallet liability.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              // Row 7
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/admin/businesses', bold: true, size: 18, font: 'Courier New' })] })],
                  }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'PLATFORM_ADMIN', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Onboards new tenant business (e.g. Bharat Petroleum).', size: 18, font: 'Arial' })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // SECTION 4: WORKFLOW DOCUMENTATION
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '4. End-to-End Operational Workflows',
                bold: true,
                size: 28,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),

          // Workflow 1
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: 'Workflow A: Cashier Point Issuance & Ledger Commit',
                bold: true,
                size: 22,
                color: secondaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Step 1: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Cashier scans customer QR code (e.g., MEM-BPCL-9876543210) or enters 10-digit mobile.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Step 2: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'System checks tenant context. If cashier belongs to Bharat Petroleum, only BPCL membership balance is returned.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Step 3: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Cashier enters bill amount (e.g., ₹10,333). Backend applies tenant reward percentage (6%) to calculate +620 Points.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Step 4: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Double-entry transaction is written to the immutable ledger with reference code BILL-BPCL-4091. SMS sent to customer.', size: 20, font: 'Arial' }),
            ],
          }),

          // Workflow 2
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: 'Workflow B: Dual-Key Point Redemption via Out-of-Band OTP',
                bold: true,
                size: 22,
                color: secondaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Step 1: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Customer requests point redemption at checkout.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Step 2: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Cashier enters points to redeem. Cashier clicks "Request Verification OTP".', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Step 3: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Abstract SMS engine dispatches 6-digit OTP to customer mobile.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Step 4: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Customer dictates OTP to Cashier. Cashier enters OTP and submits. System validates OTP, verifies minimum threshold, deducts points from ledger, and logs audit record.', size: 20, font: 'Arial' }),
            ],
          }),

          // SECTION 5: SECURITY & PRODUCTION DEPLOYMENT
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '5. Production Infrastructure & Security',
                bold: true,
                size: 28,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Containerization: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'Runs as a Cloud Run container listening strictly on port 3000 behind NGINX proxy.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'JWT Security: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'HMAC-SHA256 signed tokens carrying user role and user ID. Short-lived tokens with 7-day refresh lifecycle.', size: 20, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Cross-Tenant Protection: ', bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: 'All cashier requests validate businessId against decoded JWT employee claim before querying memberships.', size: 20, font: 'Arial' }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
