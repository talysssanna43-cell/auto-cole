const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'users.json');
const ENV_PATH = path.join(__dirname, '.env');
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/place/Auto-Ecole+Breteuil/@43.2897957,5.3785036,15.24z/data=!3m1!5s0x12c9c0b775ba4549:0xbfe923b2b6f00aec!4m8!3m7!1s0x12c9c0b776a83425:0x6d9a5634af880116!8m2!3d43.2892337!4d5.3758786!9m1!1b1!16s%2Fg%2F1tfhpphl?entry=ttu&g_ep=EgoyMDI2MDgwNC4wIKXMDSoASAFQAw%3D%3D';
const GOOGLE_BUSINESS_SCOPE = 'https://www.googleapis.com/auth/business.manage';
const GOOGLE_DEFAULT_LOGIN_HINT = 'nail30@hotmail.fr';

function loadEnvFile() {
    if (!fs.existsSync(ENV_PATH)) return;
    const lines = fs.readFileSync(ENV_PATH, 'utf-8').split(/\r?\n/);
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) return;
        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
        if (key && process.env[key] === undefined) process.env[key] = value;
    });
}

function upsertEnvValue(key, value) {
    const lines = fs.existsSync(ENV_PATH)
        ? fs.readFileSync(ENV_PATH, 'utf-8').split(/\r?\n/)
        : [];
    let found = false;
    const nextLines = lines.map((line) => {
        if (line.trim().startsWith(`${key}=`)) {
            found = true;
            return `${key}=${value}`;
        }
        return line;
    });
    if (!found) nextLines.push(`${key}=${value}`);
    fs.writeFileSync(ENV_PATH, nextLines.filter((line, index) => line || index < nextLines.length - 1).join('\n'));
    process.env[key] = value;
}

loadEnvFile();

function googleWriteReviewUrl(placeId) {
    return placeId
        ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
        : GOOGLE_MAPS_URL;
}

function googleOAuthRedirectUri() {
    return process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/google/oauth/callback`;
}

async function getGoogleAccessToken() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: GOOGLE_REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });
    const payload = await response.json();
    if (!response.ok || !payload.access_token) {
        throw new Error(payload.error_description || payload.error || 'Unable to refresh Google access token.');
    }
    return payload.access_token;
}

async function exchangeGoogleCode(code) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: googleOAuthRedirectUri()
        })
    });
    const payload = await response.json();
    if (!response.ok || !payload.refresh_token) {
        throw new Error(payload.error_description || payload.error || 'Unable to create Google refresh token.');
    }
    return payload;
}

function normalizeBusinessReview(review) {
    const reviewer = review.reviewer || {};
    const starMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    return {
        author_name: reviewer.displayName || 'Avis Google',
        profile_photo_url: reviewer.profilePhotoUrl || '',
        rating: starMap[review.starRating] || 5,
        relative_time_description: review.updateTime
            ? new Date(review.updateTime).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
            : '',
        text: review.comment || '',
        review_id: review.reviewId || review.name || ''
    };
}

async function fetchBusinessProfileReviews() {
    const { GOOGLE_BUSINESS_ACCOUNT_ID, GOOGLE_BUSINESS_LOCATION_ID } = process.env;
    if (!GOOGLE_BUSINESS_ACCOUNT_ID || !GOOGLE_BUSINESS_LOCATION_ID) return null;

    const accessToken = await getGoogleAccessToken();
    if (!accessToken) return null;

    const reviews = [];
    let pageToken = '';
    let averageRating;
    let totalReviewCount;

    do {
        const params = new URLSearchParams({ pageSize: '50' });
        if (pageToken) params.set('pageToken', pageToken);
        const url = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(GOOGLE_BUSINESS_ACCOUNT_ID)}/locations/${encodeURIComponent(GOOGLE_BUSINESS_LOCATION_ID)}/reviews?${params.toString()}`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const payload = await response.json();
        if (!response.ok) {
            throw new Error(payload.error?.message || 'Google Business Profile reviews unavailable.');
        }
        averageRating = payload.averageRating || averageRating;
        totalReviewCount = payload.totalReviewCount || totalReviewCount;
        reviews.push(...(payload.reviews || []).map(normalizeBusinessReview));
        pageToken = payload.nextPageToken || '';
    } while (pageToken);

    return {
        source: 'business-profile',
        rating: averageRating,
        total: totalReviewCount || reviews.length,
        reviews,
        url: GOOGLE_MAPS_URL,
        reviewUrl: googleWriteReviewUrl(process.env.GOOGLE_PLACE_ID)
    };
}

async function fetchBusinessAccountsAndLocations() {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) throw new Error('Google OAuth is not configured.');

    const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const accountsPayload = await accountsResponse.json();
    if (!accountsResponse.ok) {
        throw new Error(accountsPayload.error?.message || 'Unable to list Google Business accounts.');
    }

    const accounts = accountsPayload.accounts || [];
    const result = [];
    for (const account of accounts) {
        const accountId = (account.name || '').replace('accounts/', '');
        const locationsResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress,metadata`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const locationsPayload = await locationsResponse.json();
        result.push({
            accountId,
            accountName: account.accountName || account.name,
            locations: locationsResponse.ok ? (locationsPayload.locations || []).map((location) => ({
                locationId: (location.name || '').split('/').pop(),
                name: location.name,
                title: location.title,
                address: location.storefrontAddress,
                placeId: location.metadata?.placeId
            })) : [],
            error: locationsResponse.ok ? null : locationsPayload.error?.message
        });
    }
    return result;
}

app.use(cors());
app.use(express.json());

function readUsers() {
    const data = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(data).users;
}

function writeUsers(users) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ users }, null, 2));
}

app.post('/api/register', async (req, res) => {
    try {
        const { prenom, nom, email, password, telephone, dateNaissance, adresse, codePostal, ville } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
        }

        const users = readUsers();

        const existing = users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            return res.status(409).json({ success: false, message: 'Un compte existe déjà avec cet email.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: uuidv4(),
            prenom,
            nom,
            email,
            password: hashedPassword,
            telephone,
            dateNaissance,
            adresse,
            codePostal,
            ville,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        res.status(201).json({ success: true, user: { id: newUser.id, email: newUser.email, prenom: newUser.prenom } });
    } catch (error) {
        console.error('Erreur register:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
        }

        const users = readUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({ success: false, message: 'Compte introuvable.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                prenom: user.prenom
            }
        });
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

app.get('/api/google/oauth/start', (req, res) => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.status(400).send(`
            <h1>Configuration Google manquante</h1>
            <p>Ajoute GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans api/.env, puis redémarre le serveur.</p>
            <p>Redirect URI à déclarer dans Google Cloud : <code>${googleOAuthRedirectUri()}</code></p>
        `);
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', googleOAuthRedirectUri());
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_BUSINESS_SCOPE);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('login_hint', process.env.GOOGLE_LOGIN_HINT || GOOGLE_DEFAULT_LOGIN_HINT);
    res.redirect(authUrl.toString());
});

app.get('/api/google/oauth/callback', async (req, res) => {
    if (req.query.error) {
        return res.status(400).send(`<h1>Connexion Google annulée</h1><p>${req.query.error}</p>`);
    }
    if (!req.query.code) {
        return res.status(400).send('<h1>Code Google manquant</h1>');
    }

    try {
        const payload = await exchangeGoogleCode(req.query.code);
        upsertEnvValue('GOOGLE_REFRESH_TOKEN', payload.refresh_token);
        res.send(`
            <h1>Connexion Google réussie</h1>
            <p>Le refresh token a été enregistré dans <code>api/.env</code>.</p>
            <p>Prochaine étape : ouvre <a href="/api/google/business/locations">/api/google/business/locations</a> pour identifier l'établissement Auto-Ecole Breteuil.</p>
        `);
    } catch (error) {
        res.status(500).send(`<h1>Erreur OAuth Google</h1><p>${error.message}</p>`);
    }
});

app.get('/api/google/business/locations', async (req, res) => {
    try {
        const accounts = await fetchBusinessAccountsAndLocations();
        res.json({
            instructions: 'Copie accountId dans GOOGLE_BUSINESS_ACCOUNT_ID, locationId dans GOOGLE_BUSINESS_LOCATION_ID, et placeId dans GOOGLE_PLACE_ID dans api/.env.',
            accounts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/google-reviews', async (req, res) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    try {
        const businessProfileReviews = await fetchBusinessProfileReviews();
        if (businessProfileReviews) {
            return res.json({
                configured: true,
                ...businessProfileReviews
            });
        }
    } catch (error) {
        console.error('Erreur Google Business Profile reviews:', error);
    }

    if (!apiKey || !placeId) {
        return res.json({
            configured: false,
            rating: 4.6,
            total: 184,
            reviews: [],
            url: GOOGLE_MAPS_URL,
            reviewUrl: GOOGLE_MAPS_URL,
            message: 'Configure GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID to load live Google reviews.'
        });
    }

    try {
        const fields = 'name,rating,user_ratings_total,reviews,url';
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&language=fr&reviews_sort=newest&key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url);
        const payload = await response.json();

        if (!response.ok || payload.status !== 'OK') {
            return res.status(502).json({
                configured: true,
                rating: 4.6,
                total: 184,
                reviews: [],
                url: GOOGLE_MAPS_URL,
                reviewUrl: googleWriteReviewUrl(placeId),
                message: payload.error_message || payload.status || 'Google Places API unavailable.'
            });
        }

        const place = payload.result || {};
        res.json({
            configured: true,
            name: place.name,
            rating: place.rating,
            total: place.user_ratings_total,
            reviews: place.reviews || [],
            url: place.url || GOOGLE_MAPS_URL,
            reviewUrl: googleWriteReviewUrl(placeId)
        });
    } catch (error) {
        console.error('Erreur Google reviews:', error);
        res.status(500).json({
            configured: true,
            rating: 4.6,
            total: 184,
            reviews: [],
            url: GOOGLE_MAPS_URL,
            reviewUrl: googleWriteReviewUrl(placeId),
            message: 'Erreur serveur lors du chargement des avis Google.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`API Auto-Ecole en ligne sur http://localhost:${PORT}`);
});
