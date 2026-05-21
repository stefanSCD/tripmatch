DO $$
DECLARE
    request_id_attnum smallint;
    constraint_row record;
BEGIN
    SELECT attnum
    INTO request_id_attnum
    FROM pg_attribute
    WHERE attrelid = 'offers'::regclass
      AND attname = 'request_id'
      AND NOT attisdropped;

    FOR constraint_row IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'offers'::regclass
          AND contype = 'u'
          AND conkey = ARRAY[request_id_attnum]
        LOOP
            EXECUTE format('ALTER TABLE offers DROP CONSTRAINT %I', constraint_row.conname);
        END LOOP;
END $$;

ALTER TABLE offers
    ALTER COLUMN sent_at DROP NOT NULL;

ALTER TABLE offers
    ALTER COLUMN sent_at DROP DEFAULT;
