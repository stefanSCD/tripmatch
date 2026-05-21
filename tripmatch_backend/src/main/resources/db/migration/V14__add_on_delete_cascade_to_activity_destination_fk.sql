ALTER TABLE activities
    DROP CONSTRAINT fk_activities_destination;

ALTER TABLE activities
    ADD CONSTRAINT fk_activities_destination
        FOREIGN KEY (destination_id) REFERENCES destinations (id)
        ON DELETE CASCADE;
