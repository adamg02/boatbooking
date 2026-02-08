import { getSupabaseClient } from './supabase';

/**
 * Check if a user has admin permissions
 * Admin users are in the "Admin" group
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('UserGroup')
    .select('group:Group(name)')
    .eq('userId', userId);
  
  if (error || !data) {
    return false;
  }
  
  return data.some((ug: any) => ug.group?.name === 'Admin');
}

/**
 * Middleware-style check for admin access in server components/API routes
 * Throws an error if user is not authenticated or not an admin
 */
export async function requireAdmin() {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized - please sign in');
  }
  
  const adminCheck = await isAdmin(user.id);
  
  if (!adminCheck) {
    throw new Error('Forbidden - admin access required');
  }
  
  return user;
}
