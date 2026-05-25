import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { User, UserRole, BloodGroup, Gender } from '../../database/entities/user.entity';

const mockDonor: Partial<User> = {
  id: 'uuid-donor-1',
  name: 'Jane Doe',
  phone: '+919876543210',
  role: UserRole.DONOR,
  blood_group: BloodGroup.O_POS,
  is_available: true,
  city: 'Hyderabad',
  state: 'Telangana',
  latitude: 17.385,
  longitude: 78.4867,
};

const mockRepository = {
  findOne: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
  query: jest.fn(),
};

describe('DonorsService', () => {
  let service: DonorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonorsService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<DonorsService>(DonorsService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should update user to donor role and return updated user', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({ ...mockDonor, role: UserRole.DONOR });

      const result = await service.register('uuid-donor-1', {
        blood_group: BloodGroup.O_POS,
        gender: Gender.FEMALE,
        dob: '1995-03-15',
        weight: 58,
        city: 'Hyderabad',
        state: 'Telangana',
        latitude: 17.385,
        longitude: 78.4867,
      });

      expect(mockRepository.update).toHaveBeenCalledWith('uuid-donor-1', expect.objectContaining({ role: UserRole.DONOR }));
      expect(result).toBeDefined();
    });
  });

  describe('search', () => {
    it('should return donors with distance string and no lat/lng', async () => {
      mockRepository.query
        .mockResolvedValueOnce([
          { id: 'uuid-1', name: 'Jane', blood_group: 'O+', city: 'Hyderabad',
            distance_km: '1.2', total_donations: '3', is_available: true },
        ])
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await service.search({
        blood_group: BloodGroup.O_POS,
        latitude: 17.385,
        longitude: 78.4867,
        radius: 10,
        page: 1,
        limit: 20,
      });

      expect(result.donors).toHaveLength(1);
      expect(result.donors[0].distance).toBe('1.2 km');
      expect(result.donors[0]).not.toHaveProperty('latitude');
      expect(result.donors[0]).not.toHaveProperty('longitude');
    });
  });

  describe('getBadge', () => {
    it('returns correct badge for donation milestones', () => {
      expect(service.getBadge(0)).toBe('New');
      expect(service.getBadge(1)).toBe('Bronze');
      expect(service.getBadge(5)).toBe('Silver');
      expect(service.getBadge(10)).toBe('Gold');
      expect(service.getBadge(20)).toBe('Hero');
    });
  });
});
