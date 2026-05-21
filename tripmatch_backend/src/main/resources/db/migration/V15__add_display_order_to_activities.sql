ALTER TABLE activities
    ADD COLUMN display_order INT NOT NULL DEFAULT 0;

CREATE INDEX idx_activities_destination_date_order
    ON activities (destination_id, activity_date, display_order);
