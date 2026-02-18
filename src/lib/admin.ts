import { getSupabaseClient } from './supabase';

/**
 * Get the club for a given user (returns null if user has not joined a club)
 */
export async function getUserClub(userId: string): Promise<{ id: string; name: string; joinCode: string } | null> {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from('User')
    .select('clubId, club:Club(id, name, joinCode)')
    .eq('id', userId)
    .single();

  if (error || !data?.clubId) return null;

  const club = data.club as any;
  if (!club) return null;

  return { id: club.id, name: club.name, joinCode: club.joinCode };
}

/**
 * Check if a user has admin permissions within their club.
 * Admin users are members of a group named "Admin" in their club.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('UserGroup')
    .select('group:Group(name, clubId)')
    .eq('userId', userId);
  
  if (error || !data) {
    return false;
  }

  // Get the user's club so we only check the Admin group within their club
  const { data: userData } = await supabase
    .from('User')
    .select('clubId')
    .eq('id', userId)
    .single();

  const userClubId = userData?.clubId;
  
  return data.some((ug: any) => {
    const group = ug.group;
    if (!group) return false;
    // Must be a group named "Admin" within the same club
    return group.name === 'Admin' && group.clubId === userClubId;
  });
}

/**
 * Middleware-style check for admin access in server components/API routes.
 * Returns the authenticated user and their clubId.
 * Throws an error if user is not authenticated, has no club, or is not an admin.
 */
export async function requireAdmin(): Promise<{ id: string; clubId: string; email?: string }> {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized - please sign in');
  }

  const { data: userData } = await supabase
    .from('User')
    .select('clubId')
    .eq('id', user.id)
    .single();

  if (!userData?.clubId) {
    throw new Error('Forbidden - you must belong to a club');
  }
  
  const adminCheck = await isAdmin(user.id);
  
  if (!adminCheck) {
    throw new Error('Forbidden - admin access required');
  }
  
  return { ...user, clubId: userData.clubId };
}
