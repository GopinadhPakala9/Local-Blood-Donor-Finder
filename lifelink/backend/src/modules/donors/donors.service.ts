import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { SearchDonorDto } from './dto/search-donor.dto';

@Injectable()
export class DonorsService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async setAvailability(userId: string, is_available: boolean): Promise<{ is_available: boolean }> {
    await this.usersRepo.update(userId, { is_available });
    return { is_available };
  }

  async register(userId: string, dto: RegisterDonorDto): Promise<User> {
    await this.usersRepo.update(userId, {
      ...dto,
      role: UserRole.DONOR,
      dob: new Date(dto.dob),
    });
    return this.usersRepo.findOne({ where: { id: userId } });
  }

  async search(query: SearchDonorDto): Promise<{ donors: any[]; total: number; page: number; limit: number }> {
    const { blood_group, radius = 10, latitude, longitude, city, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // Build shared WHERE conditions and params
    const conditions: string[] = [`u.role = 'donor'`, `u.is_available = true`];
    const baseParams: any[] = [];
    let idx = 1;

    if (blood_group) {
      conditions.push(`u.blood_group = $${idx++}`);
      baseParams.push(blood_group);
    }
    if (city) {
      conditions.push(`LOWER(u.city) = LOWER($${idx++})`);
      baseParams.push(city);
    }

    const hasLocation = latitude != null && longitude != null;
    let distanceExpr = 'NULL';
    let radiusCondition = '';
    let latIdx: number, lngIdx: number;

    if (hasLocation) {
      latIdx = idx++;
      lngIdx = idx++;
      distanceExpr = `ROUND((6371 * acos(LEAST(1.0,
        cos(radians($${latIdx})) * cos(radians(u.latitude)) *
        cos(radians(u.longitude) - radians($${lngIdx})) +
        sin(radians($${latIdx})) * sin(radians(u.latitude))
      )))::numeric, 1)`;
      if (radius) {
        const radIdx = idx++;
        radiusCondition = `AND (6371 * acos(LEAST(1.0,
          cos(radians($${latIdx})) * cos(radians(u.latitude)) *
          cos(radians(u.longitude) - radians($${lngIdx})) +
          sin(radians($${latIdx})) * sin(radians(u.latitude))
        ))) <= $${radIdx}`;
        baseParams.push(latitude, longitude, radius);
      } else {
        baseParams.push(latitude, longitude);
      }
    }

    const whereClause = conditions.join(' AND ');
    const donorJoin = `LEFT JOIN (
        SELECT donor_id, COUNT(*) as donation_count, MAX(donated_on) as last_donation_date
        FROM donations GROUP BY donor_id
      ) d ON d.donor_id = u.id`;

    // Count query uses the same base params
    const countSql = `
      SELECT COUNT(*) FROM users u
      ${donorJoin}
      WHERE ${whereClause} ${radiusCondition}
    `;
    const countResult = await this.usersRepo.query(countSql, baseParams);
    const total = parseInt(countResult[0]?.count || '0');

    // Data query adds LIMIT/OFFSET at the end
    const limitIdx = idx++;
    const offsetIdx = idx;
    const dataParams = [...baseParams, limit, offset];

    const dataSql = `
      SELECT
        u.id, u.name, u.phone, u.blood_group, u.city, u.state,
        u.is_available, u.is_verified,
        COALESCE(d.donation_count, 0) as total_donations,
        d.last_donation_date,
        ${distanceExpr} as distance_km
      FROM users u
      ${donorJoin}
      WHERE ${whereClause} ${radiusCondition}
      ORDER BY distance_km ASC NULLS LAST, u.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const donors = await this.usersRepo.query(dataSql, dataParams);

    return {
      donors: donors.map((d: any) => ({
        ...d,
        distance: d.distance_km != null ? `${d.distance_km} km` : null,
        badge: this.getBadge(parseInt(d.total_donations || '0')),
      })),
      total,
      page,
      limit,
    };
  }

  async findById(id: string, requesterLat?: number, requesterLng?: number): Promise<any> {
    const user = await this.usersRepo.findOne({ where: { id, role: UserRole.DONOR } });
    if (!user) throw new NotFoundException('Donor not found');

    let distanceKm: number | null = null;
    if (requesterLat && requesterLng && user.latitude && user.longitude) {
      const result = await this.usersRepo.query(
        `SELECT ROUND((6371 * acos(
          cos(radians($1)) * cos(radians($3)) *
          cos(radians($4) - radians($2)) +
          sin(radians($1)) * sin(radians($3))
        ))::numeric, 1) as dist`,
        [requesterLat, requesterLng, user.latitude, user.longitude],
      );
      distanceKm = parseFloat(result[0]?.dist);
    }

    const stats = await this.usersRepo.query(
      `SELECT COUNT(*) as total, MAX(donated_on) as last FROM donations WHERE donor_id = $1`,
      [id],
    );

    const { latitude, longitude, email, fcm_token, ...safeUser } = user;
    return {
      ...safeUser,
      distance: distanceKm != null ? `${distanceKm} km` : null,
      total_donations: parseInt(stats[0]?.total || '0'),
      last_donation_date: stats[0]?.last || null,
      badge: this.getBadge(parseInt(stats[0]?.total || '0')),
    };
  }

  async getNearby(lat: number, lng: number, radiusKm: number = 10): Promise<any[]> {
    return this.search({ latitude: lat, longitude: lng, radius: radiusKm, page: 1, limit: 50 }).then((r) => r.donors);
  }

  getBadge(donations: number): string {
    if (donations >= 20) return 'Hero';
    if (donations >= 10) return 'Gold';
    if (donations >= 5) return 'Silver';
    if (donations >= 1) return 'Bronze';
    return 'New';
  }
}
