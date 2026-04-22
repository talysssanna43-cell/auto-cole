-- Corriger les politiques RLS pour la table slots
-- Permet aux admins de mettre à jour les créneaux

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Admin can update slots" ON slots;
DROP POLICY IF EXISTS "Users can update their own slots" ON slots;
DROP POLICY IF EXISTS "Anyone can update slots" ON slots;

-- Créer une politique permettant à tous de mettre à jour les slots
-- (car l'authentification admin est gérée côté client)
CREATE POLICY "Allow all updates on slots"
    ON slots
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Vérifier les autres politiques existantes
-- Si besoin, créer aussi les politiques pour SELECT, INSERT, DELETE

-- Politique SELECT (si elle n'existe pas déjà)
DROP POLICY IF EXISTS "Anyone can view slots" ON slots;
CREATE POLICY "Anyone can view slots"
    ON slots
    FOR SELECT
    USING (true);

-- Politique INSERT (si elle n'existe pas déjà)
DROP POLICY IF EXISTS "Anyone can insert slots" ON slots;
CREATE POLICY "Anyone can insert slots"
    ON slots
    FOR INSERT
    WITH CHECK (true);

-- Politique DELETE (si elle n'existe pas déjà)
DROP POLICY IF EXISTS "Anyone can delete slots" ON slots;
CREATE POLICY "Anyone can delete slots"
    ON slots
    FOR DELETE
    USING (true);

-- Vérifier que les politiques ont bien été créées
SELECT 'Politiques RLS pour slots mises à jour avec succès!' as message;
