import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahkrhghvpambgyslkmkq.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_D23IAXWM76IsIcmdJmLxdg_KUhNYfna';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize database tables if they don't exist
export async function initializeDatabase() {
    try {
        console.log('[Supabase] Checking database tables...');

        // Check if tables exist by trying to query them
        const { error } = await supabase.from('scheduled_email_jobs').select('id').limit(1);

        if (error && error.message.includes('does not exist')) {
            console.log('[Supabase] Tables need to be created. Please run the SQL migration in Supabase dashboard.');
            console.log('[Supabase] See setup instructions in the documentation.');
        } else {
            console.log('[Supabase] Database tables ready ✅');
        }
    } catch (error) {
        console.error('[Supabase] Database initialization error:', error);
    }
}
