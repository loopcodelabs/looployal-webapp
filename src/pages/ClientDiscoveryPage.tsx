import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Copy,
  Send,
  HelpCircle,
  Building2,
  Users,
  CreditCard,
  QrCode,
  ShieldCheck,
  Calendar,
  Layers,
  Zap,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Info,
  Check,
  Sparkles,
} from 'lucide-react';

interface QuestionOption {
  label: string;
  value: string;
}

interface QuestionDef {
  id: string;
  qNum: string;
  title: string;
  description?: string;
  type: 'Short Answer' | 'Paragraph' | 'Multiple Choice' | 'Checkboxes' | 'Dropdown' | 'Linear Scale' | 'Date' | 'Time';
  isRequired: boolean;
  options?: string[];
  validation?: string;
  conditionalOn?: { field: string; value: string };
  conditionalText?: string;
}

interface SectionDef {
  id: string;
  num: string;
  title: string;
  description: string;
  questions: QuestionDef[];
}

export const ClientDiscoveryPage: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({
    companyName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    industry: 'Fuel & Energy Stations (e.g. Petrol Bunks)',
    businessDesc: '',
    branchCount: '2 to 5 Branches',
    uniformRules: 'Uniform Rules Across All Branches (Recommended for MVP)',
    branchList: '',
    customerBase: '500 to 2,500 Customers',
    visitFrequency: 'Daily / Multiple times a week (e.g., Fuel station, Coffee shop)',
    primaryGoals: ['Increase customer retention and repeat store visits', 'Capture verified customer mobile numbers for direct engagement'],
    currencyName: 'Points',
    otpRegistration: 'Yes, Mobile Number + SMS OTP (MVP Standard & Highly Recommended)',
    cashierRegister: 'Yes, cashiers can enter customer mobile number at POS to auto-create membership',
    welcomeBonus: 'Yes, award welcome bonus points',
    welcomeBonusPoints: '100',
    rewardPercentage: '5.0',
    pointMonetaryValue: '1.00',
    minPurchase: '0',
    minRedeemBalance: '100',
    redemptionOtp: 'Yes, Cashier enters redemption amount -> Customer receives 6-digit OTP -> Cashier enters OTP to confirm (Strict Governance)',
    pointsExpire: 'Points Never Expire',
    expiryDays: '365',
    posIdentification: ['Scanning Customer QR Code on phone screen via Cashier Webcam / Camera Scanner', 'Searching Customer Mobile Phone Number on Cashier Screen'],
    posDevices: ['Desktop Web Browser / POS Terminal Computer', 'Tablet / iPad at billing counter'],
    rolesNeeded: ['Business Owner (Full analytics, branch creation, rule editing, ledger audits)', 'Cashier (Counter point credit and redemption terminal only)'],
    initialCashierCount: '5',
    qrDisplay: ['Customer Mobile Web Portal (Digital Reward Pass on smartphone screen)'],
    qrCameraSupport: 'Yes, support both live camera video scan and image file upload fallback',
    smsTriggers: ['Login Verification OTP (6-digit code)', 'Redemption Authorization OTP (6-digit code)', 'Point Credit Confirmation Receipt', 'Point Redemption Receipt'],
    smsSenderId: 'LOYALT',
    dashboardMetrics: ['Total Active Loyalty Customers & New Signups Trend', 'Total Points Issued vs. Total Points Redeemed (Points Liability)', 'Gross Bill Volume Generated Through Loyalty Members'],
    reportFrequency: 'Real-Time Live Dashboard',
    isolationAcknowledged: 'Understood & Agreed (A customer’s points at Store A are strictly independent from Store B)',
    cashierAutoLogout: 'Yes, auto-logout cashier session after 15 minutes of inactivity',
    maxPointCreditCap: '5000',
    cancellationPolicy: 'Business Owner handles manual adjustment via Owner Ledger Portal',
    dataRegion: 'India Cloud Region (ap-south-1 / Mumbai - Mandatory for Indian Telecom/DPDP Act)',
    privacyConsent: 'Yes, mandatory consent checkbox (DPDP / GDPR Compliant)',
    counterSpeed: '3 (2-3 seconds max)',
    peakHours: '6:00 PM - 9:00 PM daily',
    cloudTarget: 'Managed Cloud SaaS (Google Cloud Run + Cloud SQL MySQL Managed Service - Recommended)',
    autoBackups: 'Yes, Automated Daily Backups + Point-in-Time Recovery',
    targetLaunchDate: '2026-09-01',
    pilotRun: 'Yes, 1-week pilot test at 1 branch first',
    budgetRange: 'Starter SMB ($1,000 - $3,000 Setup + ~$50/mo Cloud/SMS)',
    smsCostPrepared: 'Yes, understood and budgeted',
    additionalNotes: '',
  });

  const sections: SectionDef[] = [
    {
      id: 'sec1',
      num: '1',
      title: 'Business Information',
      description: 'Primary contact and company stakeholder details for project onboarding.',
      questions: [
        { id: 'companyName', qNum: 'Q1.1', title: 'What is the registered name of your company or business entity?', type: 'Short Answer', isRequired: true, description: 'Legal business name as it should appear on terms and billing.', validation: 'Text string' },
        { id: 'contactName', qNum: 'Q1.2', title: 'Who is the primary point of contact for this project?', type: 'Short Answer', isRequired: true, description: 'Full name and designation (e.g. Operations Director, Managing Partner).' },
        { id: 'contactPhone', qNum: 'Q1.3', title: 'What is your primary contact mobile phone number?', type: 'Short Answer', isRequired: true, validation: 'Mobile Phone format (10-15 digits)', description: 'For urgent project onboarding updates and administrative SMS alerts.' },
        { id: 'contactEmail', qNum: 'Q1.4', title: 'What is your official business email address?', type: 'Short Answer', isRequired: true, validation: 'Valid Email Address' },
      ],
    },
    {
      id: 'sec2',
      num: '2',
      title: 'Company Profile & Industry Scope',
      description: 'Understanding your commercial domain and store transaction flow.',
      questions: [
        {
          id: 'industry',
          qNum: 'Q2.1',
          title: 'Which industry sector best describes your business operations?',
          type: 'Dropdown',
          isRequired: true,
          options: [
            'Fuel & Energy Stations (e.g. Petrol Bunks)',
            'Food & Beverage / Restaurant / Dining',
            'Supermarket / Grocery Retail',
            'Fashion / Apparel & Lifestyle',
            'Automobile Sales & Service',
            'Healthcare / Pharmacy / Wellness',
            'Other Commercial Retail',
          ],
        },
        { id: 'businessDesc', qNum: 'Q2.2', title: 'Briefly describe your core products and counter transaction flow.', type: 'Paragraph', isRequired: false, description: 'How do customers currently purchase from your store? (e.g., Cashier billing counter, fuel pump nozzle).' },
      ],
    },
    {
      id: 'sec3',
      num: '3',
      title: 'Branch & Location Structure',
      description: 'Defining physical outlets, fuel stations, or retail store branches.',
      questions: [
        {
          id: 'branchCount',
          qNum: 'Q3.1',
          title: 'How many store branches or outlets do you currently operate?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['1 Branch (Single Outlet)', '2 to 5 Branches', '6 to 20 Branches', '20+ Enterprise Branches'],
        },
        {
          id: 'uniformRules',
          qNum: 'Q3.2',
          title: 'Do all branches follow uniform reward rules or differ by location?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Uniform Rules Across All Branches (Recommended for MVP)', 'Different Reward Rules per Branch/Location'],
        },
        {
          id: 'branchList',
          qNum: 'Q3.3',
          title: 'Please list store names, cities, and codes for initial onboarding.',
          type: 'Paragraph',
          isRequired: true,
          description: 'Example: "Outlet 1: Koramangala Station (Code: IO-KM-01), Bengaluru".',
        },
      ],
    },
    {
      id: 'sec4',
      num: '4',
      title: 'Customer Base & Demographics',
      description: 'Transaction frequency and active user expectations.',
      questions: [
        {
          id: 'customerBase',
          qNum: 'Q4.1',
          title: 'What is your estimated total active customer base per month across branches?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Under 500 Customers', '500 to 2,500 Customers', '2,500 to 10,000 Customers', '10,000+ High Volume Customers'],
        },
        {
          id: 'visitFrequency',
          qNum: 'Q4.2',
          title: 'How often does a typical repeat customer visit your business?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Daily / Multiple times a week (e.g., Fuel station, Coffee shop)', 'Weekly (e.g., Supermarket, Grocery)', 'Monthly (e.g., Specialty retail)', 'Occasional / Quarterly'],
        },
      ],
    },
    {
      id: 'sec5',
      num: '5',
      title: 'Loyalty Program Objectives & Model',
      description: 'Defining core business incentives and reward currency branding.',
      questions: [
        {
          id: 'primaryGoals',
          qNum: 'Q5.1',
          title: 'What are the primary goals of implementing this loyalty SaaS platform?',
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
          id: 'currencyName',
          qNum: 'Q5.2',
          title: 'What custom name should be given to your digital reward points?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Examples: "Points", "Fuel Points", "Rewards", "Coins", "Stars".',
          validation: 'Max 30 characters',
        },
      ],
    },
    {
      id: 'sec6',
      num: '6',
      title: 'Customer Registration & Onboarding',
      description: 'Customer registration workflow and welcome rewards.',
      questions: [
        {
          id: 'otpRegistration',
          qNum: 'Q6.1',
          title: 'Should customers register using Mobile Number + 6-Digit SMS OTP verification?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, Mobile Number + SMS OTP (MVP Standard & Highly Recommended)', 'No, Mobile Number without OTP (Not recommended due to spam risks)'],
        },
        {
          id: 'cashierRegister',
          qNum: 'Q6.2',
          title: 'Can cashiers register new walk-in customers at the counter during checkout?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, cashiers can enter customer mobile number at POS to auto-create membership', 'No, customers must self-register on their own phones via web portal'],
        },
        {
          id: 'welcomeBonus',
          qNum: 'Q6.3',
          title: 'Should new customers receive a welcome bonus point credit upon registration?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, award welcome bonus points', 'No welcome bonus'],
        },
        {
          id: 'welcomeBonusPoints',
          qNum: 'Q6.4',
          title: 'How many welcome bonus points should be awarded to new signups?',
          type: 'Short Answer',
          isRequired: false,
          conditionalOn: { field: 'welcomeBonus', value: 'Yes, award welcome bonus points' },
          conditionalText: 'Required if Welcome Bonus is enabled.',
          validation: 'Positive integer (e.g. 100)',
        },
      ],
    },
    {
      id: 'sec7',
      num: '7',
      title: 'Rewards & Points Earning Rules',
      description: 'Exact mathematical calculation for issuing points on purchases.',
      questions: [
        {
          id: 'rewardPercentage',
          qNum: 'Q7.1',
          title: 'What percentage of the total purchase bill should be credited as reward points?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Example: Enter 5.0 for 5% reward rate (₹1,000 bill earns 50 points).',
          validation: 'Percentage (0.1% to 50.0%)',
        },
        {
          id: 'pointMonetaryValue',
          qNum: 'Q7.2',
          title: 'What is the monetary redemption value of 1 Reward Point in local currency?',
          type: 'Short Answer',
          isRequired: true,
          description: 'MVP Standard: 1 Point = ₹1.00 (or $1.00 local currency equivalent).',
          validation: 'Currency value',
        },
        {
          id: 'minPurchase',
          qNum: 'Q7.3',
          title: 'Is there a minimum purchase bill required before points are earned?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Enter "0" for no minimum, or e.g. "100" for minimum ₹100 bill.',
          validation: 'Non-negative integer',
        },
      ],
    },
    {
      id: 'sec8',
      num: '8',
      title: 'Redemption & Governance Rules',
      description: 'Controls and authorization workflows for point spending.',
      questions: [
        {
          id: 'minRedeemBalance',
          qNum: 'Q8.1',
          title: 'What is the minimum reward point balance required before a customer can redeem?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Example: 100 points minimum balance before first redemption.',
          validation: 'Positive integer',
        },
        {
          id: 'redemptionOtp',
          qNum: 'Q8.2',
          title: 'Must point redemptions require customer 6-digit SMS OTP authorization?',
          type: 'Multiple Choice',
          isRequired: true,
          options: [
            'Yes, Cashier enters redemption amount -> Customer receives 6-digit OTP -> Cashier enters OTP to confirm (Strict Governance)',
            'No OTP required (Less secure, faster counter throughput)',
          ],
        },
        {
          id: 'pointsExpire',
          qNum: 'Q8.3',
          title: 'Do loyalty points expire if a customer remains inactive?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Points Never Expire', 'Points Expire After Inactivity'],
        },
        {
          id: 'expiryDays',
          qNum: 'Q8.4',
          title: 'After how many days of inactivity should unused points expire?',
          type: 'Short Answer',
          isRequired: false,
          conditionalOn: { field: 'pointsExpire', value: 'Points Expire After Inactivity' },
          conditionalText: 'Required if Points Expire is selected.',
          validation: 'Days (e.g. 365)',
        },
      ],
    },
    {
      id: 'sec9',
      num: '9',
      title: 'Branch Operations & POS Workflow',
      description: 'Daily operational procedures at the cashier checkout counter.',
      questions: [
        {
          id: 'posIdentification',
          qNum: 'Q9.1',
          title: 'How will cashiers identify customers at the billing counter?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Scanning Customer QR Code on phone screen via Cashier Webcam / Camera Scanner',
            'Searching Customer Mobile Phone Number on Cashier Screen',
            'Entering Unique Customer Membership Code (e.g. MEM-BPCL-9876543210)',
          ],
        },
        {
          id: 'posDevices',
          qNum: 'Q9.2',
          title: 'What devices will cashiers use to access the Cashier Portal?',
          type: 'Checkboxes',
          isRequired: true,
          options: ['Desktop Web Browser / POS Terminal Computer', 'Tablet / iPad at billing counter', 'Mobile Phone Browser (Android / iOS)'],
        },
      ],
    },
    {
      id: 'sec10',
      num: '10',
      title: 'Employee Management & Permissions',
      description: 'User access levels and staff onboarding.',
      questions: [
        {
          id: 'rolesNeeded',
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
          id: 'initialCashierCount',
          qNum: 'Q10.2',
          title: 'Approximately how many cashiers and staff will be onboarded initially?',
          type: 'Short Answer',
          isRequired: true,
          validation: 'Positive integer',
        },
      ],
    },
    {
      id: 'sec11',
      num: '11',
      title: 'QR Code Specification & Workflow',
      description: 'Customer digital pass rendering and camera scanning.',
      questions: [
        {
          id: 'qrDisplay',
          qNum: 'Q11.1',
          title: 'Where will customer membership QR codes be displayed and accessed?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Customer Mobile Web Portal (Digital Reward Pass on smartphone screen)',
            'Printable PDF Membership Card (for customers without smartphones)',
            'SMS Link opening instant QR pass on browser without password',
          ],
        },
        {
          id: 'qrCameraSupport',
          qNum: 'Q11.2',
          title: 'Does your cashier camera scanner require offline image file upload support?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, support both live camera video scan and image file upload fallback', 'Live webcam scanner only'],
        },
      ],
    },
    {
      id: 'sec12',
      num: '12',
      title: 'Notification & SMS Preferences',
      description: 'Transactional SMS triggers and telecom brand headers.',
      questions: [
        {
          id: 'smsTriggers',
          qNum: 'Q12.1',
          title: 'Which customer events MUST trigger an automated real-time SMS receipt?',
          type: 'Checkboxes',
          isRequired: true,
          options: [
            'Login Verification OTP (6-digit code)',
            'Redemption Authorization OTP (6-digit code)',
            'Point Credit Confirmation Receipt',
            'Point Redemption Receipt',
            'Welcome Membership SMS upon registration',
          ],
        },
        {
          id: 'smsSenderId',
          qNum: 'Q12.2',
          title: 'What 6-character SMS Sender ID should appear on customer phones?',
          type: 'Short Answer',
          isRequired: true,
          description: '6-letter alphabetic header registered with telecom regulatory authority (e.g. "BPCLOY", "PARADI").',
          validation: 'Exactly 6 uppercase letters',
        },
      ],
    },
    {
      id: 'sec13',
      num: '13',
      title: 'Dashboard & Reporting Requirements',
      description: 'Analytical dashboards and merchant audit needs.',
      questions: [
        {
          id: 'dashboardMetrics',
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
          id: 'reportFrequency',
          qNum: 'Q13.2',
          title: 'How frequently will management review analytical reports?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Real-Time Live Dashboard', 'Daily Summary Report', 'Weekly/Monthly PDF Audit'],
        },
      ],
    },
    {
      id: 'sec14',
      num: '14',
      title: 'Authentication & Security Standard',
      description: 'Tenant isolation and account security expectations.',
      questions: [
        {
          id: 'isolationAcknowledged',
          qNum: 'Q14.1',
          title: 'Are you aware that customer reward accounts are strictly tenant-isolated and cannot leak across businesses?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Understood & Agreed (A customer’s points at Store A are strictly independent from Store B)'],
        },
        {
          id: 'cashierAutoLogout',
          qNum: 'Q14.2',
          title: 'Should cashier sessions automatically log out after inactivity for counter security?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, auto-logout cashier session after 15 minutes of inactivity', 'Keep cashier session active during store operating hours'],
        },
      ],
    },
    {
      id: 'sec15',
      num: '15',
      title: 'Business Policies & Fraud Safeguards',
      description: 'Operational guardrails against cashier typing mistakes or abuse.',
      questions: [
        {
          id: 'maxPointCreditCap',
          qNum: 'Q15.1',
          title: 'What is the maximum point cap a cashier can credit in a single transaction?',
          type: 'Short Answer',
          isRequired: true,
          description: 'Example: Maximum 5,000 points per bill to prevent cashier error.',
          validation: 'Positive integer',
        },
        {
          id: 'cancellationPolicy',
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
      id: 'sec16',
      num: '16',
      title: 'Compliance & Data Privacy',
      description: 'Data residency and customer terms agreement.',
      questions: [
        {
          id: 'dataRegion',
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
          id: 'privacyConsent',
          qNum: 'Q16.2',
          title: 'Should customer registration include a explicit Terms & Conditions checkbox for SMS consent?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, mandatory consent checkbox (DPDP / GDPR Compliant)', 'Implicit consent on OTP entry'],
        },
      ],
    },
    {
      id: 'sec17',
      num: '17',
      title: 'Performance & Speed Expectations',
      description: 'Counter throughput velocity and peak store hours.',
      questions: [
        {
          id: 'counterSpeed',
          qNum: 'Q17.1',
          title: 'What is the maximum acceptable delay for a cashier to scan QR and process a bill at peak hours?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['1 (Instant <1 second)', '2 (1-2 seconds)', '3 (2-3 seconds max)', '4', '5 (Up to 5 seconds)'],
        },
        {
          id: 'peakHours',
          qNum: 'Q17.2',
          title: 'What are your store peak operating hours with highest transaction volume?',
          type: 'Short Answer',
          isRequired: false,
          description: 'Example: "6:00 PM - 9:00 PM daily" or "Weekend afternoons".',
        },
      ],
    },
    {
      id: 'sec18',
      num: '18',
      title: 'Infrastructure & Deployment Model',
      description: 'Cloud hosting preference and automated backup retention.',
      questions: [
        {
          id: 'cloudTarget',
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
          id: 'autoBackups',
          qNum: 'Q18.2',
          title: 'Do you require automated daily MySQL database backups with 30-day retention?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, Automated Daily Backups + Point-in-Time Recovery', 'Standard Weekly Backups'],
        },
      ],
    },
    {
      id: 'sec19',
      num: '19',
      title: 'Project Timeline & Go-Live Schedule',
      description: 'Onboarding target date and pilot testing plan.',
      questions: [
        { id: 'targetLaunchDate', qNum: 'Q19.1', title: 'When do you target launching the Loyalty Platform in your store outlets?', type: 'Date', isRequired: true },
        {
          id: 'pilotRun',
          qNum: 'Q19.2',
          title: 'Will you conduct a pilot run at 1 branch before deploying across all branches?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, 1-week pilot test at 1 branch first', 'Direct simultaneous rollout across all branches'],
        },
      ],
    },
    {
      id: 'sec20',
      num: '20',
      title: 'Budget & Operational Cost Expectations',
      description: 'Budget allocation for setup and recurring API/cloud hosting costs.',
      questions: [
        {
          id: 'budgetRange',
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
          id: 'smsCostPrepared',
          qNum: 'Q20.2',
          title: 'Are you prepared for usage-based third-party API costs (e.g. ~$0.005 per SMS sent)?',
          type: 'Multiple Choice',
          isRequired: true,
          options: ['Yes, understood and budgeted', 'Need prepaid SMS bundle included in invoice'],
        },
      ],
    },
    {
      id: 'sec21',
      num: '21',
      title: 'Additional Notes & Custom Requirements',
      description: 'Any unique store policies, custom rules, or specific consultant notes.',
      questions: [
        {
          id: 'additionalNotes',
          qNum: 'Q21.1',
          title: 'Please share any specific business rules, store policies, or questions not covered above.',
          type: 'Paragraph',
          isRequired: false,
          description: 'Optional notes for solution architects prior to SRS generation.',
        },
      ],
    },
  ];

  const currentSection = sections[activeSectionIndex];

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxToggle = (fieldId: string, option: string) => {
    setFormData((prev) => {
      const currentList: string[] = prev[fieldId] || [];
      if (currentList.includes(option)) {
        return { ...prev, [fieldId]: currentList.filter((item) => item !== option) };
      } else {
        return { ...prev, [fieldId]: [...currentList, option] };
      }
    });
  };

  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/v1/download/discovery-questionnaire-doc');
      if (!response.ok) throw new Error('Failed to generate document');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Client_Discovery_Questionnaire_Google_Forms_Spec.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Error downloading Discovery Questionnaire document. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyShareLink = () => {
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || formData.companyName.trim() === '') {
      alert('Please fill out Q1.1 (Registered Company Name) in Section 1 before submitting.');
      setActiveSectionIndex(0);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/discovery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();
      if (resData.success) {
        setSubmitted(resData);
      } else {
        alert(`Submission failed: ${resData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to submit discovery survey. Please check network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TOP HEADER BLOCK */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Google Forms Client Discovery Survey
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Client Discovery Questionnaire
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
                Fill out this non-technical requirements questionnaire to define your project scope, business rules, loyalty mechanics, and get an accurate technical estimate and Software Requirements Specification (SRS).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                id="share-survey-url-btn"
                onClick={handleCopyShareLink}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'URL Copied to Clipboard!' : 'Copy Shareable Link'}</span>
              </button>

              <button
                id="download-discovery-docx-btn"
                onClick={handleDownloadDocx}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download .DOCX Spec</span>
              </button>
            </div>
          </div>
        </div>

        {/* SUBMISSION SUCCESS MODAL */}
        {submitted && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 p-6 sm:p-8 rounded-3xl text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                Discovery Questionnaire Submitted!
              </h2>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Thank you! Your responses have been recorded. Our solution architect team will review your business requirements and generate your SRS document and cost estimation proposal.
              </p>
            </div>
            <div className="inline-block bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-emerald-300 dark:border-emerald-700">
              Reference ID: {submitted.submissionId} • Submitted: {new Date(submitted.timestamp).toLocaleString()}
            </div>
            <div>
              <button
                onClick={() => setSubmitted(null)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
              >
                Edit or Submit Another Response
              </button>
            </div>
          </div>
        )}

        {/* MAIN QUESTIONNAIRE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SECTION NAVIGATION SIDEBAR */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 sticky top-20 max-h-[80vh] overflow-y-auto">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sections ({activeSectionIndex + 1} of {sections.length})
              </span>
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                {Math.round(((activeSectionIndex + 1) / sections.length) * 100)}% Complete
              </span>
            </div>

            <div className="space-y-1">
              {sections.map((sec, idx) => {
                const isActive = activeSectionIndex === idx;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-semibold transition flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-white text-sky-700'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sec.num}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SECTION FORM DISPLAY */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            
            {/* SECTION TITLE HEADER */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Section {currentSection.num} of 21
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {currentSection.title}
              </h2>
              <p className="text-xs text-slate-500 italic">
                {currentSection.description}
              </p>
            </div>

            {/* QUESTIONS LIST */}
            <form onSubmit={handleSubmitForm} className="space-y-8">
              {currentSection.questions.map((q) => {
                // Check conditional rendering
                if (q.conditionalOn) {
                  const parentVal = formData[q.conditionalOn.field];
                  if (parentVal !== q.conditionalOn.value) {
                    return null; // Skip rendering if condition not met
                  }
                }

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    {/* QUESTION TITLE & BADGES */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {q.qNum}. {q.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {q.isRequired ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] font-extrabold">
                              REQUIRED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">
                              OPTIONAL
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px] font-mono font-semibold">
                            {q.type}
                          </span>
                        </div>
                      </div>

                      {q.description && (
                        <p className="text-xs text-slate-500 italic">{q.description}</p>
                      )}

                      {q.validation && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                          Validation: {q.validation}
                        </div>
                      )}

                      {q.conditionalText && (
                        <div className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold italic">
                          🔀 {q.conditionalText}
                        </div>
                      )}
                    </div>

                    {/* INPUT TYPES RENDER */}

                    {/* 1. Short Answer */}
                    {q.type === 'Short Answer' && (
                      <input
                        type="text"
                        value={formData[q.id] || ''}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        placeholder="Your answer..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    )}

                    {/* 2. Paragraph */}
                    {q.type === 'Paragraph' && (
                      <textarea
                        rows={3}
                        value={formData[q.id] || ''}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        placeholder="Detailed explanation..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    )}

                    {/* 3. Multiple Choice */}
                    {q.type === 'Multiple Choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition text-xs sm:text-sm font-medium"
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={formData[q.id] === opt}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* 4. Checkboxes */}
                    {q.type === 'Checkboxes' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isChecked = (formData[q.id] || []).includes(opt);
                          return (
                            <label
                              key={opt}
                              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition text-xs sm:text-sm font-medium"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxToggle(q.id, opt)}
                                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 5. Dropdown */}
                    {q.type === 'Dropdown' && q.options && (
                      <select
                        value={formData[q.id] || ''}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                      >
                        {q.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* 6. Date */}
                    {q.type === 'Date' && (
                      <input
                        type="date"
                        value={formData[q.id] || ''}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    )}
                  </div>
                );
              })}

              {/* NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={activeSectionIndex === 0}
                  onClick={() => setActiveSectionIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs disabled:opacity-30 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Section</span>
                </button>

                {activeSectionIndex < sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSectionIndex((prev) => Math.min(sections.length - 1, prev + 1))}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition"
                  >
                    <span>Next Section</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition hover:scale-105 active:scale-95"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit Discovery Requirements</span>
                  </button>
                )}
              </div>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
};
