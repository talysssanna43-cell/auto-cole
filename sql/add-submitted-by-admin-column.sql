-- Ajouter une colonne pour indiquer si le résultat a été saisi par l'admin
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS submitted_by_admin BOOLEAN DEFAULT FALSE;

-- Mettre à jour les résultats existants (tous saisis par les élèves)
UPDATE exam_results 
SET submitted_by_admin = FALSE 
WHERE submitted_by_admin IS NULL;
