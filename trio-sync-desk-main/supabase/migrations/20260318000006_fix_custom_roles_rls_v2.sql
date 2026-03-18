-- ============================================================
-- FIX: RLS policies had circular self-reference on custom_roles
-- Using user_roles.role string column to avoid the JOIN back
-- ============================================================

-- Drop the broken policies
DROP POLICY IF EXISTS "custom_roles_auth_admin_update" ON custom_roles;
DROP POLICY IF EXISTS "custom_roles_auth_admin_insert" ON custom_roles;
DROP POLICY IF EXISTS "custom_roles_auth_admin_delete" ON custom_roles;

-- Recreate with simple check (no self-reference)
CREATE POLICY "custom_roles_auth_admin_update" ON custom_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "custom_roles_auth_admin_insert" ON custom_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "custom_roles_auth_admin_delete" ON custom_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
