import { supabase } from './supabase';

export async function getTieredNewsfeed(category: string) {
  let query = supabase
    .from('news_scans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (category && category !== 'all') {
    const singular = category.endsWith('s') ? category.slice(0, -1) : category;
    const plural = singular + 's';
    query = query.in('category', [category, singular, plural]);
  }
    
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
