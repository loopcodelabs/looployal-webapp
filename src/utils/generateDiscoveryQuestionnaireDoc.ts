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

export async function generateDiscoveryQuestionnaireDocx(): Promise<Buffer> {
  const primaryColor = '0369A1'; // Sky Dark Blue
  const secondaryColor = '0F172A'; // Slate 900
  const lightBgColor = 'F8FAFC'; // Slate 50
  const accentBorder = 'CBD5E1'; // Slate 300
  const badgeBg = 'E0F2FE'; // Sky 100
  const badgeText = '0369A1';

  // Helper to format a Google Forms question block in the Word document
  const createQuestionBlock = (
    qNumber: string,
    title: string,
    type: string,
    isRequired: boolean,
    description?: string,
    options?: string[],
    conditionalLogic?: string,
    validation?: string
  ) => {
    const children: Paragraph[] = [];

    // Title line with Q# and Required badge
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 40 },
        children: [
          new TextRun({
            text: `${qNumber}. ${title} `,
            bold: true,
            size: 20,
            color: secondaryColor,
            font: 'Arial',
          }),
          new TextRun({
            text: isRequired ? ' [REQUIRED]' : ' [OPTIONAL]',
            bold: true,
            size: 16,
            color: isRequired ? 'DC2626' : '64748B',
            font: 'Arial',
          }),
        ],
      })
    );

    // Description text if present
    if (description) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: description,
              italics: true,
              size: 18,
              color: '475569',
              font: 'Arial',
            }),
          ],
        })
      );
    }

    // Question Type & Validation line
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'Google Forms Type: ',
            bold: true,
            size: 17,
            color: primaryColor,
            font: 'Arial',
          }),
          new TextRun({
            text: `${type}`,
            bold: true,
            size: 17,
            color: '0369A1',
            font: 'Arial',
          }),
          ...(validation
            ? [
                new TextRun({
                  text: '   |   Validation: ',
                  bold: true,
                  size: 17,
                  color: 'D97706',
                  font: 'Arial',
                }),
                new TextRun({
                  text: validation,
                  size: 17,
                  color: 'D97706',
                  font: 'Arial',
                }),
              ]
            : []),
        ],
      })
    );

    // Answer options if present
    if (options && options.length > 0) {
      options.forEach((opt) => {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 20 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: opt,
                size: 18,
                color: '334155',
                font: 'Arial',
              }),
            ],
          })
        );
      });
    }

    // Conditional Logic note if present
    if (conditionalLogic) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 80 },
          children: [
            new TextRun({
              text: '🔀 Conditional Logic: ',
              bold: true,
              size: 17,
              color: '7C3AED', // Violet
              font: 'Arial',
            }),
            new TextRun({
              text: conditionalLogic,
              size: 17,
              italics: true,
              color: '6D28D9',
              font: 'Arial',
            }),
          ],
        })
      );
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: lightBgColor, type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: accentBorder },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: accentBorder },
                left: { style: BorderStyle.SINGLE, size: 18, color: primaryColor },
                right: { style: BorderStyle.SINGLE, size: 4, color: accentBorder },
              },
              children: children,
            }),
          ],
        }),
      ],
    });
  };

  const sectionsList = [
    {
      num: '1',
      title: 'Business Information',
      desc: 'General contact and primary stakeholder details for initial onboarding and project communications.',
      questions: [
        {
          qNum: 'Q1.1',
          title: 'What is the registered name of your company or business entity?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Legal business name as it should appear on invoices and legal terms.',
          validation: 'Text string (Max 100 chars)',
        },
        {
          qNum: 'Q1.2',
          title: 'Who is the primary point of contact for this software project?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Provide full name and official designation (e.g. CEO, Operations Director).',
        },
        {
          qNum: 'Q1.3',
          title: 'What is your primary contact mobile phone number?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Used for project onboarding and urgent administrative SMS notifications.',
          validation: 'Mobile Phone Number format (10-15 digits)',
        },
        {
          qNum: 'Q1.4',
          title: 'What is your official business email address?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Official correspondence address.',
          validation: 'Valid Email Address format',
        },
      ],
    },
    {
      num: '2',
      title: 'Company Profile & Industry Scope',
      desc: 'Understanding your industry vertical, business model, and operational scale.',
      questions: [
        {
          qNum: 'Q2.1',
          title: 'Which industry sector best describes your business operations?',
          type: 'Dropdown',
          isRequired: true,
          description: 'Select the primary domain of your retail or service operations.',
          options: [
            'Fuel & Energy Stations (e.g. Petrol Bunks)',
            'Food & Beverage / Restaurant / Dining',
            'Supermarket / Grocery Retail',
            'Fashion / Apparel & Lifestyle',
            'Automobile Sales & After-Sales Service',
            'Healthcare / Pharmacy / Wellness',
            'Other Commercial Retail',
          ],
        },
        {
          qNum: 'Q2.2',
          title: 'Briefly describe your core products/services and customer transaction flow.',
          type: 'Paragraph',
          isRequired: false,
          description: 'How do customers currently purchase from your store? (e.g., Cashier counter billing, pump nozzle billing).',
        },
      ],
    },
    {
      num: '3',
      title: 'Branch & Location Structure',
      desc: 'Defining retail outlets, fuel stations, or physical store locations in your network.',
      questions: [
        {
          qNum: 'Q3.1',
          title: 'How many store branches or retail outlets do you currently operate?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['1 Branch (Single Outlet)', '2 to 5 Branches', '6 to 20 Branches', '20+ Enterprise Branches'],
          conditionalLogic: 'If 2+ branches selected, ask Q3.2 and Q3.3.',
        },
        {
          qNum: 'Q3.2',
          title: 'Do all branches follow uniform reward rules or can rules differ by location?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Uniform Rules Across All Branches (Recommended for MVP)',
            'Different Reward Rules per Branch/Location',
          ],
        },
        {
          qNum: 'Q3.3',
          title: 'Please list the names, cities, and store codes for your initial onboarding branches.',
          type: 'Paragraph',
          isRequired: true,
          description: 'Example: "Station 1: Koramangala Energy Outlet (Code: IO-KM-01), Bengaluru".',
        },
      ],
    },
    {
      num: '4',
      title: 'Customer Base & Demographics',
      desc: 'Information about your target audience and expected transaction velocity.',
      questions: [
        {
          qNum: 'Q4.1',
          title: 'What is your estimated total active customer base per month across all branches?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Under 500 Customers',
            '500 to 2,500 Customers',
            '2,500 to 10,000 Customers',
            '10,000+ High Volume Customers',
          ],
        },
        {
          qNum: 'Q4.2',
          title: 'How often does a typical repeat customer visit your business?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Daily / Multiple times a week (e.g., Fuel station, Coffee shop)',
            'Weekly (e.g., Supermarket, Grocery)',
            'Monthly (e.g., Specialty retail)',
            'Occasional / Quarterly',
          ],
        },
      ],
    },
    {
      num: '5',
      title: 'Loyalty Program Objectives & Model',
      desc: 'Defining the core purpose and customer incentive structure of your reward program.',
      questions: [
        {
          qNum: 'Q5.1',
          title: 'What is the primary commercial goal of implementing this loyalty SaaS platform?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Increase customer retention and repeat store visits',
            'Increase average bill value per transaction',
            'Capture verified customer mobile numbers for direct engagement',
            'Eliminate paper stamp cards and physical plastic cards with digital QR',
            'Track cashier billing performance and prevent fraud',
          ],
        },
        {
          qNum: 'Q5.2',
          title: 'What custom name should be given to your digital reward currency?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Examples: "Points", "Fuel Points", "Rewards", "Coins", "Stars".',
          validation: 'Text string (Max 30 chars)',
        },
      ],
    },
    {
      num: '6',
      title: 'Customer Registration & Onboarding',
      desc: 'How new customers register and claim their digital membership card.',
      questions: [
        {
          qNum: 'Q6.1',
          title: 'Should customers register using Mobile Number with mandatory 6-Digit SMS OTP verification?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Yes, Mobile Number + SMS OTP (MVP Standard & Highly Recommended)',
            'No, Mobile Number without OTP (Not recommended due to spam risks)',
          ],
        },
        {
          qNum: 'Q6.2',
          title: 'Can cashiers register new walk-in customers at the counter during checkout?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Yes, cashiers can enter customer mobile number at POS to auto-create membership',
            'No, customers must self-register on their own phones via web portal',
          ],
        },
        {
          qNum: 'Q6.3',
          title: 'Should new customers receive an initial welcome bonus point credit upon registration?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, award welcome bonus points', 'No welcome bonus'],
          conditionalLogic: 'If "Yes" selected, automatically ask: How many welcome bonus points should be awarded?',
        },
      ],
    },
    {
      num: '7',
      title: 'Wallet & Points Earning Rules',
      desc: 'Exact mathematical calculation rules for issuing loyalty points on purchases.',
      questions: [
        {
          qNum: 'Q7.1',
          title: 'What percentage of the total purchase bill should be credited as reward points?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Example: 5.0% means a ₹1,000 purchase awards 50 points. (e.g. 5.0, 10.0, 3.0)',
          validation: 'Numeric percentage value between 0.1% and 50.0%',
        },
        {
          qNum: 'Q7.2',
          title: 'What is the monetary monetary value of 1 Reward Point in local currency?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Standard MVP Default: 1 Point = ₹1.00 (or $1.00 local currency equivalent).',
          validation: 'Numeric currency value',
        },
        {
          qNum: 'Q7.3',
          title: 'Is there a minimum purchase bill amount required before points are earned?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Example: Enter "0" for no minimum, or "100" for minimum ₹100 bill.',
          validation: 'Non-negative integer',
        },
      ],
    },
    {
      num: '8',
      title: 'Redemption & Debit Governance Rules',
      desc: 'Controls and authorization workflows for spending accumulated points.',
      questions: [
        {
          qNum: 'Q8.1',
          title: 'What is the minimum wallet point balance required before a customer can redeem?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Example: 100 points minimum balance before first redemption.',
          validation: 'Positive integer',
        },
        {
          qNum: 'Q8.2',
          title: 'To prevent cashier fraud, must point redemptions require customer SMS OTP authorization?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Yes, Cashier enters redemption amount -> Customer receives 6-digit OTP -> Cashier enters OTP to confirm (Strict Governance)',
            'No OTP required (Less secure, faster counter throughput)',
          ],
        },
        {
          qNum: 'Q8.3',
          title: 'Do loyalty points expire if a customer remains inactive?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Points Never Expire', 'Points Expire After Inactivity'],
          conditionalLogic: 'If "Points Expire" selected, ask: After how many days of inactivity? Should an SMS warning be sent 7 days prior?',
        },
      ],
    },
    {
      num: '9',
      title: 'Branch Operations & POS Workflow',
      desc: 'Daily operational procedures at the cashier checkout counter.',
      questions: [
        {
          qNum: 'Q9.1',
          title: 'How will cashiers identify customers at the point of sale (POS)?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Scanning Customer QR Code on phone screen via Cashier Webcam / Camera Scanner',
            'Searching Customer Mobile Phone Number on Cashier Screen',
            'Entering Unique Customer Membership Code (e.g. MEM-BPCL-9876543210)',
          ],
        },
        {
          qNum: 'Q9.2',
          title: 'What devices will cashiers use to access the Cashier Portal?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Desktop Web Browser / POS Terminal Computer',
            'Tablet / iPad at billing counter',
            'Mobile Phone Browser (Android / iOS)',
          ],
        },
      ],
    },
    {
      num: '10',
      title: 'Employee & Role Access Management',
      desc: 'Managing staff permissions and branch-level assignments.',
      questions: [
        {
          qNum: 'Q10.1',
          title: 'Which organizational roles do you require in the Business Owner Portal?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Business Owner (Full analytics, branch creation, rule editing, ledger audits)',
            'Branch Manager (Branch performance views, cashier oversight)',
            'Cashier (Counter point credit and redemption terminal only)',
          ],
        },
        {
          qNum: 'Q10.2',
          title: 'Approximately how many cashiers and employees will be onboarded initially?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Total staff across all branches requiring cashier login access.',
          validation: 'Positive integer',
        },
      ],
    },
    {
      num: '11',
      title: 'QR Code Specification & Workflow',
      desc: 'Technical and operational expectations for customer QR codes.',
      questions: [
        {
          qNum: 'Q11.1',
          title: 'Where will customer membership QR codes be displayed and accessed?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Customer Mobile Web Portal (Digital Wallet Pass on smartphone screen)',
            'Printable PDF Membership Card (for customers without smartphones)',
            'SMS Link opening instant QR pass on browser without password',
          ],
        },
        {
          qNum: 'Q11.2',
          title: 'Does your cashier camera scanner require offline image file upload support?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Yes, support both live camera video scan and image file upload fallback',
            'Live webcam scanner only',
          ],
        },
      ],
    },
    {
      num: '12',
      title: 'SMS Notification Requirements',
      desc: 'Outbound transactional SMS messaging preferences.',
      questions: [
        {
          qNum: 'Q12.1',
          title: 'Which customer events MUST trigger an automated real-time SMS notification?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Login Verification OTP (6-digit code)',
            'Redemption Authorization OTP (6-digit code)',
            'Point Credit Confirmation Receipt (e.g., "You earned 250 Points at Indian Oil! New Balance: 850")',
            'Point Redemption Receipt (e.g., "500 Points redeemed at Paradise Biryani. Remaining Balance: 700")',
            'Welcome Membership SMS upon registration',
          ],
        },
        {
          qNum: 'Q12.2',
          title: 'What SMS Sender ID or Brand Name should appear on customer phones?',
          type: 'Short Answer',
          isRequired: true,
          description: '6-character alphabetic header registered with telecom provider (e.g., "INDLAB", "PARADI", "BPCLOY").',
          validation: 'Text string (Exactly 6 uppercase letters)',
        },
      ],
    },
    {
      num: '13',
      title: 'Dashboard & Reporting Needs',
      desc: 'Analytical metrics and reporting views required by Business Owners.',
      questions: [
        {
          qNum: 'Q13.1',
          title: 'Which business metrics are most critical on your Merchant Owner Dashboard?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Total Active Loyalty Customers & New Signups Trend',
            'Total Points Issued vs. Total Points Redeemed (Points Liability)',
            'Gross Bill Volume Generated Through Loyalty Members',
            'Branch-wise Comparison & Cashier Transaction Volumes',
            'Double-Entry Audit Ledger Export (CSV / Excel)',
          ],
        },
        {
          qNum: 'Q13.2',
          title: 'How frequently will management review analytical reports?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Real-Time Live Dashboard', 'Daily Summary Report', 'Weekly/Monthly PDF Audit'],
        },
      ],
    },
    {
      num: '14',
      title: 'Authentication & Tenant Isolation Expectations',
      desc: 'Security, privacy, and data separation standards.',
      questions: [
        {
          qNum: 'Q14.1',
          title: 'Are you aware that customer wallets are strictly tenant-isolated and cannot leak across businesses?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Understood & Agreed (A customer’s points at Store A are strictly independent from Store B)',
          ],
        },
        {
          qNum: 'Q14.2',
          title: 'Should cashiers automatically be logged out after a period of inactivity for counter security?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Yes, auto-logout cashier session after 15 minutes of inactivity',
            'Keep cashier session active during store operating hours',
          ],
        },
      ],
    },
    {
      num: '15',
      title: 'Business Policies & Fraud Prevention',
      desc: 'Operational safeguards against improper point issuance.',
      questions: [
        {
          qNum: 'Q15.1',
          title: 'Is there a maximum cap on points a cashier can credit in a single transaction?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Example: Maximum 5,000 points per bill to prevent cashier typing errors.',
          validation: 'Positive integer',
        },
        {
          qNum: 'Q15.2',
          title: 'How should cashiers handle returned goods or bill cancellations?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Business Owner handles manual adjustment via Owner Ledger Portal',
            'Cashiers can issue negative point adjustment with Manager PIN',
          ],
        },
      ],
    },
    {
      num: '16',
      title: 'Compliance & Data Privacy',
      desc: 'Meeting local data storage regulations and customer consent.',
      questions: [
        {
          qNum: 'Q16.1',
          title: 'In which geographic country or cloud region must customer database records reside?',
          type: 'Dropdown',
          isRequired: true,
          options: [
            'India Cloud Region (ap-south-1 / Mumbai - Mandatory for Indian Telecom/DPDP Act)',
            'US East (N. Virginia)',
            'EU Central (Frankfurt / GDPR Compliant)',
            'Singapore / Asia Pacific',
          ],
        },
        {
          qNum: 'Q16.2',
          title: 'Should customer registration include a explicit Terms & Conditions checkbox for SMS consent?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Yes, mandatory consent checkbox (DPDP / GDPR Compliant)',
            'Implicit consent on OTP entry',
          ],
        },
      ],
    },
    {
      num: '17',
      title: 'Performance & Scalability Expectations',
      desc: 'Speed and counter throughput response expectations.',
      questions: [
        {
          qNum: 'Q17.1',
          title: 'What is the maximum acceptable delay for a cashier to scan QR and process a bill at peak hours?',
          type: 'Linear Scale',
          isRequired: true,
          description: '1 = Instant (<1 second), 5 = Acceptable (Up to 5 seconds).',
          options: ['1 (Instant <1 sec)', '2', '3 (2-3 seconds max)', '4', '5 (Up to 5 seconds)'],
        },
        {
          qNum: 'Q17.2',
          title: 'What are your store peak operating hours with highest transaction velocity?',
          type: 'Short Answer',
          isRequired: false,
          description: 'Example: "6:00 PM - 9:00 PM daily" or "Weekend afternoons".',
        },
      ],
    },
    {
      num: '18',
      title: 'Infrastructure & Cloud Hosting Environment',
      desc: 'Preferences for cloud server hosting and database deployment.',
      questions: [
        {
          qNum: 'Q18.1',
          title: 'What is your preferred cloud hosting deployment target for production?',
          type: 'Dropdown',
          isRequired: true,
          options: [
            'Managed Cloud SaaS (Google Cloud Run + Cloud SQL MySQL Managed Service - Recommended)',
            'Amazon Web Services (AWS ECS / RDS MySQL)',
            'On-Premise Private Cloud Server / Self-Hosted VPS',
          ],
        },
        {
          qNum: 'Q18.2',
          title: 'Do you require automated daily MySQL database backups with 30-day retention?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, Automated Daily Backups + Point-in-Time Recovery', 'Standard Weekly Backups'],
        },
      ],
    },
    {
      num: '19',
      title: 'Project Timeline & Onboarding Target',
      desc: 'Target launch schedule and deployment milestones.',
      questions: [
        {
          qNum: 'Q19.1',
          title: 'When do you target launching the Loyalty Platform in your store outlets?',
          type: 'Date',
          isRequired: true,
          description: 'Target Go-Live Date.',
        },
        {
          qNum: 'Q19.2',
          title: 'Will you conduct a pilot run at 1 branch before deploying to all branches?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Yes, 1-week pilot test at 1 branch first',
            'Direct simultaneous rollout across all branches',
          ],
        },
      ],
    },
    {
      num: '20',
      title: 'Budget & Operational Cost Expectations',
      desc: 'Financial planning for setup and recurring API/cloud hosting costs.',
      questions: [
        {
          qNum: 'Q20.1',
          title: 'What is your allocated budget range for initial software deployment and onboarding?',
          type: 'Dropdown',
          isRequired: true,
          options: [
            'Starter SMB ($1,000 - $3,000 Setup + ~$50/mo Cloud/SMS)',
            'Mid-Market Growth ($3,000 - $10,000 Setup + ~$200/mo Cloud/SMS)',
            'Enterprise Custom ($10,000+ Setup + ~$500+/mo Cloud/SMS)',
          ],
        },
        {
          qNum: 'Q20.2',
          title: 'Are you prepared for usage-based third-party API costs (e.g. ~$0.005 per SMS sent)?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, understood and budgeted', 'Need prepaid SMS bundle included in invoice'],
        },
      ],
    },
    {
      num: '21',
      title: 'Additional Notes & Custom Business Rules',
      desc: 'Any unique operational workflows, special policies, or specific questions for our engineering team.',
      questions: [
        {
          qNum: 'Q21.1',
          title: 'Please share any specific business rules, store policies, or questions not covered above.',
          type: 'Paragraph',
          isRequired: false,
          description: 'Any special requirements unique to your business operations.',
        },
      ],
    },
  ];

  const sectionsDocChildren: any[] = [];

  // TITLE BLOCK
  sectionsDocChildren.push(
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: 'CLIENT DISCOVERY QUESTIONNAIRE',
          size: 32,
          bold: true,
          color: primaryColor,
          font: 'Arial',
        }),
      ],
    })
  );

  sectionsDocChildren.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'Google Forms Requirements Gathering Spec • Multi-Tenant Loyalty SaaS MVP Scope',
          size: 22,
          bold: true,
          color: secondaryColor,
          font: 'Arial',
        }),
      ],
    })
  );

  // SUMMARY NOTE BOX
  sectionsDocChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F0F9FF', type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: primaryColor },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: primaryColor },
                left: { style: BorderStyle.SINGLE, size: 24, color: primaryColor },
                right: { style: BorderStyle.SINGLE, size: 6, color: primaryColor },
              },
              children: [
                new Paragraph({
                  spacing: { before: 100, after: 60 },
                  children: [
                    new TextRun({
                      text: 'Purpose of this Questionnaire: ',
                      bold: true,
                      size: 19,
                      color: primaryColor,
                      font: 'Arial',
                    }),
                    new TextRun({
                      text: 'This document contains a non-technical, Google Forms formatted client discovery survey. It is specifically designed for business owners onboarding onto the Multi-Tenant Loyalty SaaS MVP platform. Answers collected through this questionnaire are used to prepare the Software Requirements Specification (SRS), finalize cloud infrastructure sizing (MySQL + Cloud Run), and calculate precise setup/API pricing.',
                      size: 18,
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  sectionsDocChildren.push(new Paragraph({ spacing: { after: 240 }, children: [] }));

  // RENDER ALL 21 SECTIONS
  sectionsList.forEach((sec) => {
    // Section Header
    sectionsDocChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 80 },
        children: [
          new TextRun({
            text: `Section ${sec.num}: ${sec.title}`,
            bold: true,
            size: 24,
            color: primaryColor,
            font: 'Arial',
          }),
        ],
      })
    );

    sectionsDocChildren.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: sec.desc,
            italics: true,
            size: 18,
            color: '64748B',
            font: 'Arial',
          }),
        ],
      })
    );

    // Questions in this section
    sec.questions.forEach((q) => {
      const qTable = createQuestionBlock(
        q.qNum,
        q.title,
        q.type,
        q.isRequired,
        q.description,
        q.options,
        q.conditionalLogic,
        q.validation
      );
      sectionsDocChildren.push(qTable);
      sectionsDocChildren.push(
        new Paragraph({ spacing: { after: 120 }, children: [] })
      );
    });
  });

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
                    text: 'Multi-Tenant Loyalty SaaS  |  Client Discovery Questionnaire (Google Forms Spec)',
                    size: 16,
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
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: '  |  Client Discovery & Requirements Gathering Instrument',
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        children: sectionsDocChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
