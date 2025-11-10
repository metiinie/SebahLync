-- Setup User Avatars Storage Bucket and Policies
-- Copy and paste this entire script into your Supabase SQL Editor and run it
-- This will set up proper RLS policies for the user-avatars bucket

-- IMPORTANT: Before running this script, make sure you have:
-- 1. Created the "user-avatars" bucket in Supabase Dashboard > Storage
--    - Name: "user-avatars"
--    - Public: true (checked)
--    - File size limit: 50MB
--    - Allowed MIME types: image/png, image/jpeg, image/jpg, image/gif, image/webp

-- Note: RLS should already be enabled on storage.objects by default in Supabase
-- If you get an error about RLS, you may need to enable it via Supabase Dashboard

-- Step 1: Drop existing policies for user-avatars bucket (if any)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Step 2: Create policies for user-avatars bucket

-- Policy 1: Users can upload avatars to their own folder
-- Path structure: {userId}/filename (simpler, matches listing-images pattern)
-- So foldername(name)[1] = userId
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Anyone can view avatars (public read access)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

-- Step 3: Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- If you see the policies listed above, the setup is complete!
-- If the bucket doesn't exist, you'll need to create it manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: "user-avatars"
-- 4. Public: true (checked)
-- 5. File size limit: 50MB (or your preferred limit)
-- 6. Allowed MIME types: image/png, image/jpeg, image/jpg, image/gif, image/webp
-- 7. Click "Create bucket"

