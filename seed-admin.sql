-- Seed script for admin user in Render database
-- Password will be: admin123

-- Delete existing admin user if exists
DELETE FROM users WHERE email = 'tegatheadmin@tradyfi.ng';

-- Insert new admin user
-- Password: 'admin123' (for testing - change this in production!)
-- Bcrypt hash: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (
    id, 
    email, 
    first_name,
    last_name,
    password, 
    email_verified,
    role, 
    created_at,
    updated_at
) VALUES (
    'admin_render_' || extract(epoch from now())::text,
    'tegatheadmin@tradyfi.ng',
    'Admin',
    'User',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    true,
    'admin',
    NOW(),
    NOW()
);

-- Verify the insert worked
SELECT id, email, first_name, last_name, role, email_verified, created_at 
FROM users 
WHERE email = 'tegatheadmin@tradyfi.ng';