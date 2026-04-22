-- Politique RLS pour permettre la suppression des demandes de contact
-- À exécuter dans l'éditeur SQL de Supabase

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la suppression (DELETE)
CREATE POLICY "Allow delete contact_requests for authenticated users"
ON contact_requests
FOR DELETE
TO authenticated
USING (true);

-- Alternative : Si tu veux que tout le monde puisse supprimer (même anonyme)
-- Décommente la ligne suivante et commente celle du dessus
-- CREATE POLICY "Allow delete contact_requests for all"
-- ON contact_requests
-- FOR DELETE
-- TO public
-- USING (true);
