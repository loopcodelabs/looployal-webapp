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

export async function generateCostAndApiDocx(): Promise<Buffer> {
  const primaryColor = '0284C7'; // Sky / Blue
  const secondaryColor = '0F172A'; // Dark Slate
  const lightBgColor = 'F8FAFC'; // Light Slate
  const accentGreen = '059669'; // Emerald
  const accentAmber = 'D97706'; // Amber

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
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
                    text: 'Multi-Tenant Loyalty SaaS | API Inventory & Production Cost Analysis',
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
                    text: '  |  Financial & API Inventory Model Specification',
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
          // COVER TITLE BLOCK
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'API INVENTORY & PRODUCTION COST ESTIMATION',
                size: 34,
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
                text: 'Multi-Tenant Loyalty & Rewards SaaS (1 Tenant / 2 Branches / 500 Customers Baseline)',
                size: 24,
                bold: true,
                color: secondaryColor,
                font: 'Arial',
              }),
            ],
          }),

          // METADATA SUMMARY TABLE
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
                          new TextRun({ text: 'Onboarding Scope: ', bold: true, size: 20, font: 'Arial' }),
                          new TextRun({ text: '1 Enterprise Tenant (e.g. Bharat Petroleum), 2 Retail Fuel Branches, 500 Customers', size: 20, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 60, after: 120 },
                        children: [
                          new TextRun({ text: 'Estimated Initial Monthly Cost: ', bold: true, size: 20, font: 'Arial' }),
                          new TextRun({ text: '$54.50 USD / month (~₹4,500 INR / month)', size: 20, bold: true, color: accentGreen, font: 'Arial' }),
                          new TextRun({ text: '  |  Target Cloud: ', bold: true, size: 20, font: 'Arial' }),
                          new TextRun({ text: 'GCP / AWS / Cloud Run + MySQL', size: 20, font: 'Arial' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // SECTION 1: INTERNAL REST APIS
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '1. Internal System REST APIs',
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
                text: 'The application backend exposes standard REST API endpoints. All cashier, merchant, and customer operations are secured via Bearer JWT tokens and scoped to the active tenant.',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),

          // INTERNAL API TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Method & Path', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Auth Guard', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Purpose & Subsystem', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/auth/otp/request', bold: true, size: 18, font: 'Courier New' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Public', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Customer Login: Dispatches 6-digit SMS OTP to customer mobile.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/auth/otp/verify', bold: true, size: 18, font: 'Courier New' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Public', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Verifies login OTP, provisions tenant wallets, returns JWT.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'GET /api/v1/cashier/membership/scan/:code', bold: true, size: 18, font: 'Courier New' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASHIER, OWNER', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'POS Scanner: Scans QR code or mobile ID. Enforces tenant scope.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/cashier/points/credit', bold: true, size: 18, font: 'Courier New' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASHIER, OWNER', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Point Credit Engine: Posts double-entry credit entry to wallet ledger.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/cashier/redemption/request-otp', bold: true, size: 18, font: 'Courier New' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASHIER, OWNER', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Redemption Guard: Generates out-of-band 6-digit redemption OTP.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'POST /api/v1/cashier/points/redeem', bold: true, size: 18, font: 'Courier New' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASHIER, OWNER', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Point Debit Engine: Validates OTP & deducts points from ledger.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'GET /api/v1/health', bold: true, size: 18, font: 'Courier New' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Public', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'System Telemetry: Checks MySQL connection pool and app health.', size: 18, font: 'Arial' })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // SECTION 2: EXTERNAL APIS & SERVICES
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '2. External APIs & Third-Party Integration Inventory',
                bold: true,
                size: 28,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),

          // EXTERNAL API TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'External API Service', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Integration Purpose', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Pricing Model', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Transactional SMS Gateway (SMSLocal / DLT)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dispatches OTP verification codes & real-time transaction SMS receipts.', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$0.005 / SMS (India)\n$0.0079 / SMS (US/EU)', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Google Gemini AI API (@google/genai)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Automated fraud anomaly detection & personalized promo generator.', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$0.00001875 / 1K tokens (Flash 1.5/2.0)', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Managed MySQL Database (Cloud SQL / AWS RDS)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Persistent storage for users, businesses, wallets, and double-entry ledger.', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'db.t3.micro / db-f1-micro (~$25/mo)', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Serverless App Hosting (Cloud Run / AWS Fargate)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Runs containerized Node.js Express server on Port 3000 behind reverse proxy.', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$0.00002400 / vCPU-sec (~$12 - $20/mo)', size: 18, font: 'Arial' })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // SECTION 3: COST ESTIMATION FOR ONBOARDING 1 TENANT
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '3. Detailed Cost Model: 1 Tenant (2 Branches, 500 Customers)',
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
                text: 'Operational Volume Assumptions for 1 Tenant (e.g. Bharat Petroleum with 2 Fuel Stations and 500 Active Customers per month):',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: 'Customer Registrations & Logins: ', bold: true, size: 20, font: 'Arial' }), new TextRun({ text: '500 initial OTPs + 200 re-logins = 700 Login OTP SMS.', size: 20, font: 'Arial' })] }),
          new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: 'Fuel Refill Transactions: ', bold: true, size: 20, font: 'Arial' }), new TextRun({ text: 'Avg 4 visits/month x 500 customers = 2,000 credit transactions -> 2,000 Transaction SMS Receipts.', size: 20, font: 'Arial' })] }),
          new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: 'Point Redemptions: ', bold: true, size: 20, font: 'Arial' }), new TextRun({ text: '10% redemption rate = 200 redemptions -> 200 Redemption OTP SMS.', size: 20, font: 'Arial' })] }),
          new Paragraph({ bullet: { level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: 'Total Monthly SMS Volume: ', bold: true, size: 20, font: 'Arial' }), new TextRun({ text: '700 + 2,000 + 200 = 2,900 SMS messages / month.', size: 20, bold: true, color: accentAmber, font: 'Arial' })] }),

          // MONTHLY BREAKDOWN TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Component / Resource', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Monthly Volume / Spec', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Est. Monthly Cost ($ USD)', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Transactional SMS (SMSLocal / DLT)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '2,900 SMS @ $0.005 / SMS', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$14.50 / mo', bold: true, size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'App Container (Google Cloud Run / AWS Fargate)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1 Instance (0.5 vCPU, 1 GB RAM)', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$12.00 / mo', bold: true, size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Managed MySQL DB (Cloud SQL db-f1-micro)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1 vCPU, 1 GB RAM, 10 GB SSD', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$25.00 / mo', bold: true, size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Gemini AI API (Fraud & Promo Engine)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '500 API calls / mo', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$1.00 / mo', bold: true, size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Domain, SSL & CDN (Cloudflare)', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Free SSL + DNS Protection', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$2.00 / mo', bold: true, size: 18, font: 'Arial' })] })] }),
                ],
              }),
              // TOTAL ROW
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: 'E0F2FE', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL ESTIMATED MONTHLY COST (1 TENANT)', bold: true, size: 18, color: primaryColor, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: 'E0F2FE', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: '2 Branches / 500 Customers', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: 'E0F2FE', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: '$54.50 / mo (~₹4,500 INR)', bold: true, size: 20, color: accentGreen, font: 'Arial' })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // SECTION 4: SCALED PRODUCTION TIERS
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 120 },
            children: [
              new TextRun({
                text: '4. Production Scaling Tiered Cost Projection',
                bold: true,
                size: 28,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Scale Tier', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Tenants & Customers', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ shading: { fill: secondaryColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Monthly Cost (USD)', bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Starter Production Tier', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1 - 5 Tenants (2,500 Customers)', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$150 - $220 / mo', bold: true, size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Mid-Market Growth Tier', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '25 Tenants (25,000 Customers)', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$650 - $900 / mo', bold: true, size: 18, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: lightBgColor, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Enterprise Scale Tier', bold: true, size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '100 Tenants (100,000+ Customers)', size: 18, font: 'Arial' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '$2,500 - $3,800 / mo', bold: true, size: 18, font: 'Arial' })] })] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
