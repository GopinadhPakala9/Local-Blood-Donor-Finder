import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodRequest, RequestStatus } from '../../database/entities/blood-request.entity';
import { CreateBloodRequestDto } from './dto/create-blood-request.dto';
import { User, UserRole } from '../../database/entities/user.entity';

@Injectable()
export class BloodRequestsService {
  constructor(
    @InjectRepository(BloodRequest) private requestsRepo: Repository<BloodRequest>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateBloodRequestDto): Promise<BloodRequest> {
    const request = this.requestsRepo.create({
      ...dto,
      required_date: dto.required_date ? new Date(dto.required_date) : null,
      requester_id: userId,
      status: RequestStatus.OPEN,
    });
    const saved = await this.requestsRepo.save(request);

    // Notify nearby donors asynchronously
    if (dto.latitude && dto.longitude) {
      this.notifyNearbyDonors(saved).catch((e) => console.error('Notification failed:', e));
    }
    return saved;
  }

  async findAll(filters: {
    blood_group?: string; city?: string; urgency?: string; status?: string; page?: number; limit?: number; requester_id?: string;
  }): Promise<{ requests: BloodRequest[]; total: number; page: number; limit: number }> {
    const { blood_group, city, urgency, status = 'Open', page = 1, limit = 20, requester_id } = filters;
    const qb = this.requestsRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.requester', 'requester')
      .where('r.status = :status', { status });

    if (requester_id) qb.andWhere('r.requester_id = :requester_id', { requester_id });

    if (blood_group) qb.andWhere('r.blood_group = :blood_group', { blood_group });
    if (city) qb.andWhere('LOWER(r.city) = LOWER(:city)', { city });
    if (urgency) qb.andWhere('r.urgency = :urgency', { urgency });

    qb.orderBy('r.urgency', 'DESC')
      .addOrderBy('r.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [requests, total] = await qb.getManyAndCount();
    return { requests, total, page, limit };
  }

  async findById(id: string): Promise<BloodRequest> {
    const req = await this.requestsRepo.findOne({
      where: { id },
      relations: ['requester'],
    });
    if (!req) throw new NotFoundException('Blood request not found');
    return req;
  }

  async update(id: string, userId: string, userRole: string, data: Partial<BloodRequest>): Promise<BloodRequest> {
    const req = await this.findById(id);
    if (req.requester_id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own requests');
    }
    Object.assign(req, data);
    return this.requestsRepo.save(req);
  }

  async cancel(id: string, userId: string, userRole: string): Promise<BloodRequest> {
    return this.update(id, userId, userRole, { status: RequestStatus.CANCELLED });
  }

  async fulfill(id: string, userId: string, userRole: string): Promise<BloodRequest> {
    return this.update(id, userId, userRole, { status: RequestStatus.FULFILLED });
  }

  async getNearby(lat: number, lng: number, radiusKm: number = 20): Promise<any[]> {
    return this.requestsRepo.query(
      `SELECT r.*,
        ROUND((6371 * acos(
          cos(radians($1)) * cos(radians(r.latitude)) *
          cos(radians(r.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(r.latitude))
        ))::numeric, 1) as distance_km
       FROM blood_requests r
       WHERE r.status = 'Open'
         AND r.latitude IS NOT NULL
         AND (6371 * acos(
           cos(radians($1)) * cos(radians(r.latitude)) *
           cos(radians(r.longitude) - radians($2)) +
           sin(radians($1)) * sin(radians(r.latitude))
         )) <= $3
       ORDER BY
         CASE r.urgency WHEN 'Critical' THEN 1 WHEN 'Urgent' THEN 2 ELSE 3 END,
         distance_km ASC
       LIMIT 50`,
      [lat, lng, radiusKm],
    );
  }

  private async notifyNearbyDonors(request: BloodRequest): Promise<void> {
    const nearbyDonors = await this.usersRepo.query(
      `SELECT id, fcm_token FROM users
       WHERE role = 'donor' AND is_available = true AND fcm_token IS NOT NULL
         AND blood_group = $1
         AND (6371 * acos(
           cos(radians($2)) * cos(radians(latitude)) *
           cos(radians(longitude) - radians($3)) +
           sin(radians($2)) * sin(radians(latitude))
         )) <= 15
       LIMIT 100`,
      [request.blood_group, request.latitude, request.longitude],
    );
    // FCM notification would be sent here via NotificationsService
    console.log(`Would notify ${nearbyDonors.length} donors for request ${request.id}`);
  }
}
