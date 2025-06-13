-- Seed script for admin user in Render database
-- Run this script in your Render PostgreSQL database console

-- First, check if admin user already exists
DO $$
BEGIN
    -- Delete existing admin user if it exists
    DELETE FROM users WHERE email = 'admin@besttrades.ng';
    
    -- Insert new admin user with hashed password
    -- Password is 'admin123' hashed with bcrypt
    INSERT INTO users (
        id, 
        email, 
        first_name, 
        last_name, 
        password, 
        role, 
        created_at, 
        updated_at
    ) VALUES (
        'admin_render_' || extract(epoch from now())::text,
        'tegatheadmin@tradyfi.ng',
        'Admin',
        'User',
        '12KAreokeko@2025$$',
        'admin',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Admin user created successfully';
END $$;