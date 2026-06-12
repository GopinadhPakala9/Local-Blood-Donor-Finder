import {
  Injectable, BadRequestException, UnauthorizedException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../database/entities/user.entity';

const OTP_TTL = 300; // 5 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private isEmail(id: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id); }

  async sendOtp(identifier: string): Promise<{ message: string; expiresIn: number; devOtp?: string }> {
    const otp  = Math.floor(100000 + Math.random() * 900000).toString();
    const key  = identifier.toLowerCase().trim();
    AuthService.otpStore.set(key, { otp, expiresAt: Date.now() + OTP_TTL * 1000 });

    const gmailUser   = this.configService.get<string>('GMAIL_USER')?.trim();
    const gmailPass   = this.configService.get<string>('GMAIL_APP_PASSWORD')?.trim();
    const fast2smsKey = this.configService.get<string>('FAST2SMS_API_KEY')?.trim();

    let sent = false;
    let channel = '';

    if (this.isEmail(key)) {
      // Email login — send OTP directly to that email
      if (gmailUser && gmailPass) {
        sent = await this.sendViaGmail(key, key, otp, gmailUser, gmailPass);
        if (sent) channel = 'email';
      }
    } else {
      // Phone login — try SMS first, fall back to email
      if (fast2smsKey) {
        sent = await this.sendViaSMS(key, otp, fast2smsKey);
        if (sent) channel = 'SMS';
      }
      if (!sent && gmailUser && gmailPass) {
        const user = await this.usersRepo.findOne({ where: { phone: key } });
        if (user?.email) {
          sent = await this.sendViaGmail(user.email, key, otp, gmailUser, gmailPass);
          if (sent) channel = 'email';
        }
      }
    }

    if (!sent) this.logger.log(`[DEV] OTP for ${key}: ${otp}`);

    return {
      message: sent ? `OTP sent to your ${channel}` : 'OTP sent successfully',
      expiresIn: OTP_TTL,
      ...(!sent && { devOtp: otp }),
    };
  }

  // ── Gmail email OTP (nodemailer, free) ───────────────────────────────────────
  // myaccount.google.com → Security → 2-Step Verification → App passwords → create one
  private async sendViaGmail(
    toEmail: string, phone: string, otp: string,
    gmailUser: string, gmailPass: string,
  ): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      await transporter.sendMail({
        from: `"LifeLink" <${gmailUser}>`,
        to: toEmail,
        subject: `LifeLink OTP: ${otp}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
            <h2 style="color:#C0392B">🩸 LifeLink — OTP Verification</h2>
            <p>Phone: <strong>${phone}</strong></p>
            <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#C0392B;text-align:center;padding:24px 0">${otp}</div>
            <p style="color:#888;font-size:13px">Valid for 5 minutes. Do not share this code with anyone.</p>
          </div>`,
      });
      this.logger.log(`OTP sent via Gmail to ${toEmail}`);
      return true;
    } catch (err: unknown) {
      this.logger.error(`Gmail send failed: ${(err as Error).message}`);
      return false;
    }
  }

  // ── Fast2SMS (free Indian SMS OTP) ──────────────────────────────────────────
  // Sign up at fast2sms.com → Dev API → copy API key → set FAST2SMS_API_KEY env var
  private async sendViaSMS(phone: string, otp: string, apiKey: string): Promise<boolean> {
    try {
      const cleanPhone = phone.replace(/^\+?91/, '');
      const { data } = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'q',
          message: `Your LifeLink OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        },
        { headers: { authorization: apiKey, 'Content-Type': 'application/json' } },
      );
      if (data?.return === true) {
        this.logger.log(`OTP sent via Fast2SMS to ${cleanPhone}`);
        return true;
      }
      this.logger.warn(`Fast2SMS response: ${JSON.stringify(data)}`);
      return false;
    } catch (err: unknown) {
      this.logger.error(`Fast2SMS failed: ${(err as any)?.response?.data?.message || (err as Error).message}`);
      return false;
    }
  }

  async verifyOtp(identifier: string, otp: string, name?: string): Promise<{ accessToken: string; refreshToken: string; user: User; has_password: boolean }> {
    const key = identifier.toLowerCase().trim();
    const stored = AuthService.otpStore.get(key);
    if (!stored) throw new BadRequestException('OTP not found or expired. Please request a new OTP.');
    if (Date.now() > stored.expiresAt) {
      AuthService.otpStore.delete(key);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }
    if (stored.otp !== otp) throw new BadRequestException('Invalid OTP.');
    AuthService.otpStore.delete(key);

    let user: User;
    let has_password = false;

    if (this.isEmail(key)) {
      const found = await this.usersRepo.createQueryBuilder('u').addSelect('u.password').where('u.email = :key', { key }).getOne();
      has_password = !!found?.password;
      user = found ?? await this.usersRepo.save(this.usersRepo.create({ email: key, phone: `email_${Date.now()}`, name: name || '', role: UserRole.DONOR }));
    } else {
      const found = await this.usersRepo.createQueryBuilder('u').addSelect('u.password').where('u.phone = :key', { key }).getOne();
      has_password = !!found?.password;
      user = found ?? await this.usersRepo.save(this.usersRepo.create({ phone: key, name: name || '', role: UserRole.DONOR }));
    }

    return { ...this.generateTokens(user), user, has_password };
  }

  async checkIdentifier(identifier: string): Promise<{ exists: boolean }> {
    const key = identifier.toLowerCase().trim();
    const user = this.isEmail(key)
      ? await this.usersRepo.findOne({ where: { email: key } })
      : await this.usersRepo.findOne({ where: { phone: key } });
    return { exists: !!user };
  }

  // ── Password login ───────────────────────────────────────────────────────────
  async loginWithPassword(identifier: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const key = identifier.toLowerCase().trim();
    const isEmail = this.isEmail(key);

    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where(isEmail ? 'user.email = :key' : 'user.phone = :key', { key })
      .getOne();

    if (!user) throw new BadRequestException('No account found with this phone/email.');
    if (!user.password) throw new BadRequestException('Password not set. Please login with OTP first, then set a password.');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new BadRequestException('Incorrect password.');

    return { ...this.generateTokens(user), user };
  }

  async setPassword(userId: string, password: string): Promise<{ message: string }> {
    const hashed = await bcrypt.hash(password, 10);
    await this.usersRepo.update(userId, { password: hashed });
    return { message: 'Password set successfully.' };
  }

  async googleLogin(accessToken: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    let payload: any;
    try {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      payload = data;
    } catch {
      throw new UnauthorizedException('Invalid Google access token.');
    }

    if (!payload?.email) throw new UnauthorizedException('Google account has no email.');

    let user = await this.usersRepo.findOne({ where: { email: payload.email } });
    if (!user) {
      user = this.usersRepo.create({
        email: payload.email,
        name: payload.name || '',
        phone: `google_${payload.sub}`,
        role: UserRole.DONOR,
        is_verified: payload.email_verified || false,
      });
      await this.usersRepo.save(user);
    }

    return { ...this.generateTokens(user), user };
  }

  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
      const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private static otpStore = new Map<string, { otp: string; expiresAt: number }>();
}
