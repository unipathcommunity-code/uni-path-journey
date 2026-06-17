import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create client with user's token to verify they're an admin
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !currentUser) {
      console.error('Failed to get current user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current user ID:', currentUser.id);

    // Check if current user is admin (super_admin, owner, manager, or admin)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    const allowedRoles = ['super_admin', 'owner', 'manager', 'admin'];
    const isAdmin = !profileError && profile && allowedRoles.includes(profile.role);

    if (profileError || !isAdmin) {
      console.error('User is not admin or error fetching profile:', profileError, profile?.role);
      return new Response(
        JSON.stringify({ error: 'Only admins can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user ID to delete from request body
    const { userId } = await req.json();
    
    if (!userId) {
      console.error('No userId provided');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attempting to delete user:', userId);

    // Prevent self-deletion
    if (userId === currentUser.id) {
      console.error('User attempted to delete themselves');
      return new Response(
        JSON.stringify({ error: 'You cannot delete yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete user's related data first (in order to avoid foreign key issues)
    // Delete from agent_students (as agent or student)
    await supabaseAdmin.from('agent_students').delete().eq('agent_id', userId);
    await supabaseAdmin.from('agent_students').delete().eq('student_id', userId);

    // Delete from agent_notes
    await supabaseAdmin.from('agent_notes').delete().eq('agent_id', userId);
    await supabaseAdmin.from('agent_notes').delete().eq('student_id', userId);

    // Delete from agent_tasks
    await supabaseAdmin.from('agent_tasks').delete().eq('agent_id', userId);

    // Delete from notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);

    // Delete from documents
    await supabaseAdmin.from('documents').delete().eq('user_id', userId);

    // Delete from visa_documents
    await supabaseAdmin.from('visa_documents').delete().eq('user_id', userId);

    // Delete from visa_applications
    await supabaseAdmin.from('visa_applications').delete().eq('user_id', userId);

    // Delete from expenses
    await supabaseAdmin.from('expenses').delete().eq('user_id', userId);

    // Delete from applications
    await supabaseAdmin.from('applications').delete().eq('user_id', userId);

    // Delete from profiles
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
    }

    // Finally delete the user from auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user: ' + authDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully deleted user:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
