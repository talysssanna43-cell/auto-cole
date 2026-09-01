const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'URL'
];

const missing = required.filter((name) => !String(process.env[name] || '').trim());
if (missing.length > 0) {
    console.error(`Configuration de deploiement incomplete: ${missing.join(', ')}`);
    process.exit(1);
}

if (!String(process.env.ADMIN_EMAIL || '').trim()) {
    console.warn('ADMIN_EMAIL non renseigne: verifie qu\'un compte users possede is_admin=true.');
}

console.log('Configuration de paiement, authentification et emails presente.');
