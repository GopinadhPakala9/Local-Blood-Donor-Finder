import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../../database/entities/user.entity';

const mockUser: Partial<User> = {
  id: 'uuid-1',
  phone: '+919876543210',
  name: 'Test User',
  role: UserRole.DONOR,
  is_verified: true,
};

const mockRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'jwt.secret': 'test-secret',
      'jwt.expiresIn': '15m',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.refreshExpiresIn': '7d',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('should store an OTP and return expiresIn', async () => {
      const result = await service.sendOtp('+919876543210');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('expiresIn', 300);
    });
  });

  describe('verifyOtp', () => {
    it('should throw BadRequestException when OTP not found', async () => {
      await expect(
        service.verifyOtp('+910000000000', '999999'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return tokens and user on valid OTP', async () => {
      await service.sendOtp('+919876543210');

      const store = (AuthService as any).otpStore as Map<string, { otp: string; expiresAt: number }>;
      const entry = store.get('+919876543210');
      expect(entry).toBeDefined();

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.verifyOtp('+919876543210', entry!.otp);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });
  });

  describe('generateTokens', () => {
    it('should return access and refresh tokens', () => {
      const tokens = service.generateTokens(mockUser as User);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });
});
