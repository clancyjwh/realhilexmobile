import { supabase } from '../lib/supabase';

export const anonymousNames = [
  "Anonymous Owl",
  "Anonymous Fox",
  "Anonymous Bear",
  "Anonymous Tiger",
  "Anonymous Monkey",
  "Anonymous Dolphin",
  "Anonymous Eagle",
  "Anonymous Jaguar",
  "Anonymous Panda",
  "Anonymous Falcon"
];

export const getRandomAnonymousName = () => {
  return anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
};

export const ensureUserProfile = async (userId: string) => {
  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existingProfile) {
      const randomName = getRandomAnonymousName();
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          display_name: randomName,
        });

      if (insertError) throw insertError;
      return randomName;
    }

    if (!existingProfile.display_name) {
      const randomName = getRandomAnonymousName();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: randomName })
        .eq('id', userId);

      if (updateError) throw updateError;
      return randomName;
    }

    return existingProfile.display_name;
  } catch (error: any) {
    if (error?.code !== '42501') {
      console.error('Error ensuring user profile:', error);
    }
    return 'Anonymous User';
  }
};
