ALTER TABLE destinations
    DROP CONSTRAINT fk_destinations_trip;

ALTER TABLE destinations
    ADD CONSTRAINT fk_destinations_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE;

ALTER TABLE activities
    DROP CONSTRAINT fk_activities_trip;

ALTER TABLE activities
    ADD CONSTRAINT fk_activities_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE;

ALTER TABLE travel_requests
    DROP CONSTRAINT fk_travel_requests_trip;

ALTER TABLE travel_requests
    ADD CONSTRAINT fk_travel_requests_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE;

ALTER TABLE offers
    DROP CONSTRAINT fk_offers_request;

ALTER TABLE offers
    ADD CONSTRAINT fk_offers_request
        FOREIGN KEY (request_id) REFERENCES travel_requests (id)
        ON DELETE CASCADE;
