-- Run this in the Supabase SQL Editor to add the tier column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'Free';

-- Then run this to manually upgrade YOUR specific account to Premium:
-- (Replace the email with your actual login email)
UPDATE public.profiles 
SET subscription_tier = 'Premium' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
