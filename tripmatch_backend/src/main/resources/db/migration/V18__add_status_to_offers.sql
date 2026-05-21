ALTER TABLE offers
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'DRAFT';

CREATE INDEX idx_offers_status ON offers (status);
CREATE INDEX idx_offers_request_status ON offers (request_id, status);
