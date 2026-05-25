-- LifeLink PostgreSQL initialization script
-- Runs once on first container start

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE lifelink TO lifelink_user;
