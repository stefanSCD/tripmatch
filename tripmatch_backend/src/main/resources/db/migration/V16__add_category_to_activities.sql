ALTER TABLE activities
    ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'ACTIVITIES';

CREATE INDEX idx_activities_trip_category
    ON activities (trip_id, category);
