-- Migration 000: Enable required PostgreSQL extensions.
--
-- All subsequent migrations depend on these extensions being present.
-- pgcrypto  → gen_random_uuid(), crypt(), gen_salt()
-- pg_trgm   → trigram GIN indexes for fast ILIKE search on names

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Confirm
comment on extension pgcrypto  is 'Cryptographic functions — UUID generation';
comment on extension pg_trgm   is 'Trigram similarity — used for name search indexes';
