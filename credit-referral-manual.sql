-- Script SQL pour créditer manuellement 1h au parrain
-- À exécuter dans Supabase SQL Editor si la fonction automatique ne fonctionne pas

-- 1. Vérifier l'état du parrainage
SELECT * FROM referrals WHERE referral_code = 'CC09D93D';

-- 2. Vérifier les heures actuelles du parrain
SELECT email, prenom, nom, hours_remaining 
FROM users 
WHERE email = 'talysssanna43@gmail.com';

-- 3. Créditer manuellement 1h au parrain (REMPLACER L'EMAIL SI NÉCESSAIRE)
UPDATE users 
SET hours_remaining = COALESCE(hours_remaining, 0) + 1
WHERE email = 'talysssanna43@gmail.com';

-- 4. Marquer le parrainage comme complété (REMPLACER L'ID SI NÉCESSAIRE)
UPDATE referrals 
SET reward_credited = TRUE,
    status = 'completed',
    completed_at = NOW()
WHERE referral_code = 'CC09D93D' 
  AND reward_credited = FALSE;

-- 5. Vérifier le résultat
SELECT email, prenom, nom, hours_remaining 
FROM users 
WHERE email = 'talysssanna43@gmail.com';

SELECT * FROM referrals WHERE referral_code = 'CC09D93D';
