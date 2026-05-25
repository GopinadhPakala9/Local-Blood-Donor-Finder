import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { SearchDonorDto } from './dto/search-donor.dto';

@Injectable()
export class DonorsService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

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

    let sql = `
      SELECT
        u.id, u.name, u.blood_group, u.city, u.state,
        u.is_available, u.is_verified,
        COALESCE(d.donation_count, 0) as total_donations,
        d.last_donation_date,
        CASE
          WHEN $3::float IS NOT NULL AND $4::float IS NOT NULL THEN
            ROUND((6371 * acos(
              cos(radians($3)) * cos(radians(u.latitude)) *
              cos(radians(u.longitude) - radians($4)) +
              sin(radians($3)) * sin(radians(u.latitude))
            ))::numeric, 1)
          ELSE NULL
        END as distance_km
      FROM users u
      LEFT JOIN (
        SELECT donor_id, COUNT(*) as donation_count, MAX(donated_on) as last_donation_date
        FROM donations GROUP BY donor_id
      ) d ON d.donor_id = u.id
      WHERE u.role = 'donor' AND u.is_available = true
    `;
    const params: any[] = [limit, offset, latitude || null, longitude || null];
    let paramIdx = 5;

    if (blood_group) {
      sql += ` AND u.blood_group = $${paramIdx++}`;
      params.push(blood_group);
    }
    if (city) {
      sql += ` AND LOWER(u.city) = LOWER($${paramIdx++})`;
      params.push(city);
    }
    if (latitude && longitude && radius) {
      sql += ` AND (6371 * acos(
        cos(radians($3)) * cos(radians(u.latitude)) *
        cos(radians(u.longitude) - radians($4)) +
        sin(radians($3)) * sin(radians(u.latitude))
      )) <= $${paramIdx++}`;
      params.push(radius);
    }

    sql += ` ORDER BY distance_km ASC NULLS LAST, u.created_at DESC LIMIT $1 OFFSET $2`;

    const donors = await this.usersRepo.query(sql, params);
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
    const countResult = await this.usersRepo.query(countSql, params.slice(2));
    const total = parseInt(countResult[0]?.count || '0');

    return {
      donors: donors.map((d) => ({
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
