import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['VITE_SUPABASE_PUBLISHABLE_KEY'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupAdmin() {
  console.log('Creating super admin user...');
  const { data, error } = await supabase.auth.signUp({
    email: 'unipath.community@gmail.com',
    password: 'UniPath123456!',
    options: {
      data: {
        role: 'super_admin'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    if (error.message.includes('User already registered')) {
        console.log('User already registered. Logging in to update role...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'unipath.community@gmail.com',
            password: 'UniPath123456!'
        });
        
        if (signInError) {
            console.error('Could not log in:', signInError.message);
        } else {
            console.log('Logged in successfully!');
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user?.id) {
               console.log('User ID:', userData.user.id);
               const { error: updateError } = await supabase.from('profiles').update({ role: 'super_admin' }).eq('user_id', userData.user.id);
               if (updateError) console.error('Failed to update role in profiles:', updateError);
               else console.log('Successfully set role to super_admin in profiles table!');
            }
        }
    }
    return;
  }

  console.log('User created successfully:', data.user?.id);
  
  if (data.user?.id) {
    console.log('Setting up super_admin role...');
    // The DB trigger on_auth_user_created automatically creates a profile row. We just update it.
    const { error: profileError } = await supabase.from('profiles').update({
      role: 'super_admin',
      full_name: 'Super Admin',
    }).eq('user_id', data.user.id);
    
    if (profileError) {
      console.log('Could not update profile:', profileError.message);
    } else {
      console.log('Profile updated successfully to super_admin!');
    }
  }
}

setupAdmin();
