import { NotificationType, NotificationTemplate } from './types';

export class TemplateEngine {
  private templates: Map<NotificationType, NotificationTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates() {
    this.templates.set('OTP', {
      id: 'tmpl-otp',
      type: 'OTP',
      title: 'Verification Code',
      bodyTemplate: 'Your verification code for {{appName}} is {{otp}}. Valid for {{expiryMinutes}} minutes.',
    });

    this.templates.set('POINTS_EARNED', {
      id: 'tmpl-earn',
      type: 'POINTS_EARNED',
      title: 'Points Earned',
      bodyTemplate: 'You earned {{points}} loyalty points at {{businessName}}. Current Balance: {{balance}} Points. Thank you!',
    });

    this.templates.set('POINTS_REDEEMED', {
      id: 'tmpl-redeem',
      type: 'POINTS_REDEEMED',
      title: 'Points Redeemed',
      bodyTemplate: 'You redeemed {{points}} loyalty points at {{businessName}}. Remaining Balance: {{balance}} Points. Thank you!',
    });

    this.templates.set('WELCOME', {
      id: 'tmpl-welcome',
      type: 'WELCOME',
      title: 'Welcome to Loyalty SaaS',
      bodyTemplate: 'Welcome {{customerName}} to {{appName}}! Your Universal QR Code is {{universalQrCode}}. Show it at any store to earn and redeem rewards!',
    });
  }

  public getTemplate(type: NotificationType): NotificationTemplate | undefined {
    return this.templates.get(type);
  }

  public render(type: NotificationType, variables: Record<string, any>): string {
    const tmpl = this.getTemplate(type);
    if (!tmpl) {
      return variables.customMessage || 'Loyalty SaaS Notification';
    }

    let rendered = tmpl.bodyTemplate;
    const allVars = {
      appName: process.env.APPLICATION_NAME || 'Loyalty SaaS',
      expiryMinutes: process.env.OTP_EXPIRY_MINUTES || '5',
      ...variables,
    };

    for (const [key, val] of Object.entries(allVars)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(placeholder, String(val ?? ''));
    }

    return rendered;
  }
}

export const templateEngine = new TemplateEngine();
