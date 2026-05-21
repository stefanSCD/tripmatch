UPDATE notifications
SET type = UPPER(type)
WHERE type IS NOT NULL;

ALTER TABLE notifications
    ALTER COLUMN type TYPE VARCHAR(64);

ALTER TABLE notifications
    ADD CONSTRAINT ck_notifications_type
    CHECK (type IN ('OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED'));
