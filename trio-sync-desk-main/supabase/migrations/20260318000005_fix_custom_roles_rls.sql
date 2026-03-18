-- ============================================================
-- FIX: Allow admin users to update custom_roles via frontend
-- The original migration only allowed service_role to modify
-- ============================================================

-- Add UPDATE policy for authenticated admin users
CREATE POLICY "custom_roles_auth_admin_update" ON custom_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN custom_roles cr ON ur.role_id = cr.id
      WHERE ur.user_id = auth.uid() AND cr.name = 'admin'
    )
  );

-- Add INSERT policy for authenticated admin users
CREATE POLICY "custom_roles_auth_admin_insert" ON custom_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN custom_roles cr ON ur.role_id = cr.id
      WHERE ur.user_id = auth.uid() AND cr.name = 'admin'
    )
  );

-- Add DELETE policy for authenticated admin users
CREATE POLICY "custom_roles_auth_admin_delete" ON custom_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN custom_roles cr ON ur.role_id = cr.id
      WHERE ur.user_id = auth.uid() AND cr.name = 'admin'
    )
  );
