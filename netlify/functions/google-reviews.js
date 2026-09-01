const fs = require('fs');
const path = require('path');
const { handleOptions, response } = require('./_lib/http');

const GOOGLE_MAPS_URL = 'https://www.google.com/maps/place/Auto-Ecole+Breteuil/@43.2897957,5.3785036,15.24z/data=!3m1!5s0x12c9c0b775ba4549:0xbfe923b2b6f00aec!4m8!3m7!1s0x12c9c0b776a83425:0x6d9a5634af880116!8m2!3d43.2892337!4d5.3758786!9m1!1b1!16s%2Fg%2F1tfhpphl?entry=ttu&g_ep=EgoyMDI2MDgwNC4wIKXMDSoASAFQAw%3D%3D';

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
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

function loadLocalEnv() {
    const candidates = [
        process.cwd(),
        path.resolve(__dirname, '..', '..'),
        path.resolve(__dirname, '..', '..', '..'),
        path.resolve(__dirname, '..', '..', '..', '..')
    ];
    const seen = new Set();
    candidates.forEach((projectRoot) => {
        if (!projectRoot || seen.has(projectRoot)) return;
        seen.add(projectRoot);
        loadEnvFile(path.join(projectRoot, '.env'));
        loadEnvFile(path.join(projectRoot, 'api', '.env'));
    });
}

function getEnv(name) {
    return String(process.env[name] || '').trim();
}

function googleWriteReviewUrl(placeId) {
    return placeId
        ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
        : GOOGLE_MAPS_URL;
}

async function getGoogleAccessToken() {
    const clientId = getEnv('GOOGLE_CLIENT_ID');
    const clientSecret = getEnv('GOOGLE_CLIENT_SECRET');
    const refreshToken = getEnv('GOOGLE_REFRESH_TOKEN');
    if (!clientId || !clientSecret || !refreshToken) return null;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    });
    const payload = await tokenResponse.json();
    if (!tokenResponse.ok || !payload.access_token) {
        throw new Error(payload.error_description || payload.error || 'GOOGLE_TOKEN_FAILED');
    }
    return payload.access_token;
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

async function listBusinessLocations(accessToken) {
    const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const accountsPayload = await accountsResponse.json();
    if (!accountsResponse.ok) {
        throw new Error(accountsPayload.error?.message || 'GOOGLE_ACCOUNTS_FAILED');
    }

    const accounts = accountsPayload.accounts || [];
    const locations = [];
    for (const account of accounts) {
        const accountId = String(account.name || '').replace('accounts/', '');
        const locationsResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress,metadata`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const locationsPayload = await locationsResponse.json();
        if (!locationsResponse.ok) continue;
        (locationsPayload.locations || []).forEach((location) => {
            locations.push({
                accountId,
                locationId: String(location.name || '').split('/').pop(),
                title: location.title || '',
                placeId: location.metadata?.placeId || '',
                address: location.storefrontAddress || null
            });
        });
    }
    return locations;
}

function scoreLocation(location) {
    const text = `${location.title || ''} ${JSON.stringify(location.address || {})}`.toLowerCase();
    let score = 0;
    if (text.includes('breteuil')) score += 5;
    if (text.includes('auto-ecole') || text.includes('auto ecole') || text.includes('auto-école')) score += 4;
    if (text.includes('marseille')) score += 2;
    return score;
}

async function resolveBusinessLocation(accessToken) {
    const configuredAccountId = getEnv('GOOGLE_BUSINESS_ACCOUNT_ID');
    const configuredLocationId = getEnv('GOOGLE_BUSINESS_LOCATION_ID');
    if (configuredAccountId && configuredLocationId) {
        return {
            accountId: configuredAccountId,
            locationId: configuredLocationId,
            placeId: getEnv('GOOGLE_PLACE_ID')
        };
    }

    const locations = await listBusinessLocations(accessToken);
    return locations
        .sort((left, right) => scoreLocation(right) - scoreLocation(left))[0] || null;
}

async function fetchBusinessProfileReviews() {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) return null;

    const location = await resolveBusinessLocation(accessToken);
    if (!location?.accountId || !location?.locationId) return null;

    const reviews = [];
    let pageToken = '';
    let averageRating;
    let totalReviewCount;

    do {
        const params = new URLSearchParams({ pageSize: '50' });
        if (pageToken) params.set('pageToken', pageToken);
        const reviewsResponse = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(location.accountId)}/locations/${encodeURIComponent(location.locationId)}/reviews?${params.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const payload = await reviewsResponse.json();
        if (!reviewsResponse.ok) {
            throw new Error(payload.error?.message || 'GOOGLE_BUSINESS_REVIEWS_FAILED');
        }
        averageRating = payload.averageRating || averageRating;
        totalReviewCount = payload.totalReviewCount || totalReviewCount;
        reviews.push(...(payload.reviews || []).map(normalizeBusinessReview));
        pageToken = payload.nextPageToken || '';
    } while (pageToken);

    return {
        configured: true,
        source: 'business-profile',
        rating: Number(averageRating || 0),
        total: Number(totalReviewCount || reviews.length),
        reviews,
        url: GOOGLE_MAPS_URL,
        reviewUrl: googleWriteReviewUrl(location.placeId || getEnv('GOOGLE_PLACE_ID'))
    };
}

async function fetchPlacesReviews() {
    const apiKey = getEnv('GOOGLE_PLACES_API_KEY');
    const placeId = getEnv('GOOGLE_PLACE_ID');
    if (!apiKey || !placeId) return null;

    const fields = 'name,rating,user_ratings_total,reviews,url';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&language=fr&reviews_sort=newest&key=${encodeURIComponent(apiKey)}`;
    const placesResponse = await fetch(url);
    const payload = await placesResponse.json();
    if (!placesResponse.ok || payload.status !== 'OK') {
        throw new Error(payload.error_message || payload.status || 'GOOGLE_PLACES_FAILED');
    }
    const place = payload.result || {};
    return {
        configured: true,
        source: 'places',
        name: place.name,
        rating: place.rating,
        total: place.user_ratings_total,
        reviews: place.reviews || [],
        url: place.url || GOOGLE_MAPS_URL,
        reviewUrl: googleWriteReviewUrl(placeId)
    };
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    loadLocalEnv();

    try {
        const businessProfileReviews = await fetchBusinessProfileReviews();
        if (businessProfileReviews) {
            return response(200, { ok: true, ...businessProfileReviews });
        }
    } catch (error) {
        console.error('google-reviews business-profile:', error.message);
    }

    try {
        const placesReviews = await fetchPlacesReviews();
        if (placesReviews) {
            return response(200, { ok: true, ...placesReviews });
        }
    } catch (error) {
        console.error('google-reviews places:', error.message);
    }

    return response(200, {
        ok: true,
        configured: false,
        source: 'fallback',
        rating: 4.6,
        total: 184,
        reviews: [],
        url: GOOGLE_MAPS_URL,
        reviewUrl: GOOGLE_MAPS_URL,
        message: 'Google Business Profile is not fully connected yet.'
    });
};
