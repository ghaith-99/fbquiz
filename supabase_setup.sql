-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create football_persons table
CREATE TABLE football_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  nationality TEXT,
  nationality_flag TEXT,
  category TEXT, -- 'current', 'retired', or 'coach'
  current_club TEXT,
  current_club_logo TEXT,
  image_url TEXT,
  achievements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create previous_clubs table
CREATE TABLE previous_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES football_persons(id) ON DELETE CASCADE,
  name TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS) policies

-- Allow public read access to football_persons
ALTER TABLE football_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Football persons are viewable by everyone" 
  ON football_persons FOR SELECT USING (true);

-- Only admins can insert, update, or delete football_persons
CREATE POLICY "Football persons are editable by admins" 
  ON football_persons FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );
  
CREATE POLICY "Football persons are updateable by admins" 
  ON football_persons FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );
  
CREATE POLICY "Football persons are deletable by admins" 
  ON football_persons FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Similar policies for previous_clubs
ALTER TABLE previous_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Previous clubs are viewable by everyone" 
  ON previous_clubs FOR SELECT USING (true);

CREATE POLICY "Previous clubs are editable by admins" 
  ON previous_clubs FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );
  
CREATE POLICY "Previous clubs are updateable by admins" 
  ON previous_clubs FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );
  
CREATE POLICY "Previous clubs are deletable by admins" 
  ON previous_clubs FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Users can read their own data and admins can view all users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Users can update their own data
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE USING (
    auth.uid() = id
  );

-- Insert trigger to add user to users table when created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Sample admin user creation (replace with your own admin email)
-- Execute this after creating the admin user through sign up
-- UPDATE public.users SET is_admin = true WHERE email = 'admin@example.com';

-- Storage bucket permissions
-- Run these in the SQL editor after creating your storage bucket named 'images'

-- Anyone can view images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Only authenticated users can upload images
CREATE POLICY "Images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Anyone can upload an image"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Only admins can update images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Only admins can delete images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  ); 