-- Migration 013: Add environment_type to societies
--
-- Classifies each society as CUSTOMER (real tenant), DEMO (sales/demo tenant),
-- or TEST (automated-test tenant). DEMO tenants get a persistent banner and
-- are blocked from external integrations (email, payment gateway, webhooks).
-- TEST tenants are for automated test suites and share the same integration
-- safeguards.
--
-- Security: environment_type is read server-side in every action that triggers
-- an external integration. It is never read from client-supplied input.

BEGIN;

-- 1. Add the column with a safe default so existing rows are immediately valid.
ALTER TABLE societies
  ADD COLUMN IF NOT EXISTS environment_type text NOT NULL DEFAULT 'CUSTOMER';

-- 2. Check constraint to catch any bad values at the database layer.
ALTER TABLE societies
  DROP CONSTRAINT IF EXISTS societies_environment_type_check;

ALTER TABLE societies
  ADD CONSTRAINT societies_environment_type_check
    CHECK (environment_type IN ('CUSTOMER', 'DEMO', 'TEST'));

-- 3. All existing societies are real tenants; mark them explicitly.
UPDATE societies
  SET environment_type = 'CUSTOMER'
  WHERE environment_type != 'CUSTOMER';

-- 4. Index for fast lookups when the admin console lists societies by type.
CREATE INDEX IF NOT EXISTS idx_societies_environment_type
  ON societies (environment_type);

COMMIT;
