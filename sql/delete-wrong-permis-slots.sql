-- Supprimer les créneaux permis mal insérés (avec décalage timezone)
-- À exécuter pour nettoyer les anciens créneaux avant de re-bloquer

DELETE FROM slots WHERE status = 'permis';
