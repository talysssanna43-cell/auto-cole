const SUPABASE_URL = 'https://pcdkaqndfjysalyrbwuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZGthcW5kZmp5c2FseXJid3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTI3OTIsImV4cCI6MjA4MjM4ODc5Mn0.M0gy-iR0iE8tIUF-1kGLZvhHowq29RVpMG7QPbJgo4Q';

if (typeof supabase === 'undefined') {
    throw new Error('Supabase JS library must be loaded before supabaseClient.js');
}

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.hashPassword = async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};
