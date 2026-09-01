CREATE TABLE IF NOT EXISTS driving_exam_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL,
    student_name TEXT NOT NULL,
    location TEXT NOT NULL CHECK (location IN ('Aubagne', 'Saint-Henri', 'Salon', 'Aix-en-Provence')),
    exam_date DATE NOT NULL,
    instructor TEXT NOT NULL,
    created_by TEXT,
    scheduled_email_sent_at TIMESTAMP WITH TIME ZONE,
    result_requested_at TIMESTAMP WITH TIME ZONE,
    result TEXT CHECK (result IN ('passed', 'failed')),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    appreciation TEXT,
    result_pdf JSONB,
    result_submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS result_pdf JSONB;

CREATE INDEX IF NOT EXISTS idx_driving_exam_dates_student ON driving_exam_dates(LOWER(student_email));
CREATE INDEX IF NOT EXISTS idx_driving_exam_dates_exam_date ON driving_exam_dates(exam_date);
CREATE INDEX IF NOT EXISTS idx_driving_exam_dates_result_request ON driving_exam_dates(exam_date, result_requested_at) WHERE result IS NULL;

ALTER TABLE driving_exam_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage driving exam dates" ON driving_exam_dates;
CREATE POLICY "Admin can manage driving exam dates"
ON driving_exam_dates FOR ALL
USING (current_app_role() = 'admin')
WITH CHECK (current_app_role() = 'admin');

DROP POLICY IF EXISTS "Students can read own driving exam dates" ON driving_exam_dates;
CREATE POLICY "Students can read own driving exam dates"
ON driving_exam_dates FOR SELECT
USING (LOWER(student_email) = current_app_email());
