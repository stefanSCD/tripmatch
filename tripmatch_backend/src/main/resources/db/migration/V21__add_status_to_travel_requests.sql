ALTER TABLE travel_requests
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED';

CREATE INDEX idx_travel_requests_status ON travel_requests (status);
CREATE INDEX idx_travel_requests_status_published_at ON travel_requests (status, published_at DESC);
