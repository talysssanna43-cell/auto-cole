-- Script pour corriger les transmission_type NULL dans inscription_notifications
-- Basé sur le pack de chaque inscription

-- 1. Vérifier combien d'inscriptions ont transmission_type NULL (sauf pack 'code')
SELECT 
    pack,
    COUNT(*) as count_null
FROM inscription_notifications
WHERE transmission_type IS NULL
    AND pack IS NOT NULL
    AND pack != 'code'
GROUP BY pack
ORDER BY count_null DESC;

-- 2. Mettre à jour transmission_type selon le pack

-- Pack 'boite-auto' → 'auto' (BA)
UPDATE inscription_notifications
SET transmission_type = 'auto'
WHERE transmission_type IS NULL
    AND pack = 'boite-auto';

-- Pack 'am' (VSP) → 'auto' (BA)
UPDATE inscription_notifications
SET transmission_type = 'auto'
WHERE transmission_type IS NULL
    AND pack = 'am';

-- Pack '20h' → 'manual' (BM)
UPDATE inscription_notifications
SET transmission_type = 'manual'
WHERE transmission_type IS NULL
    AND pack = '20h';

-- Packs 'aac', 'supervisee', 'accelere', 'second-chance' → 'manual' (BM par défaut)
UPDATE inscription_notifications
SET transmission_type = 'manual'
WHERE transmission_type IS NULL
    AND pack IN ('aac', 'supervisee', 'accelere', 'second-chance');

-- Autres packs avec conduite (zen, etc.) → 'manual' (BM par défaut)
UPDATE inscription_notifications
SET transmission_type = 'manual'
WHERE transmission_type IS NULL
    AND pack IS NOT NULL
    AND pack != 'code';

-- 3. Vérification finale : afficher les inscriptions avec transmission_type NULL
-- (devrait être uniquement le pack 'code' ou NULL)
SELECT 
    id,
    user_email,
    user_name,
    pack,
    transmission_type,
    created_at
FROM inscription_notifications
WHERE transmission_type IS NULL
ORDER BY created_at DESC;

-- 4. Statistiques finales
SELECT 
    pack,
    transmission_type,
    COUNT(*) as count
FROM inscription_notifications
GROUP BY pack, transmission_type
ORDER BY pack, transmission_type;
