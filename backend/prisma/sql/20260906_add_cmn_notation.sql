-- Reviewed CMN delta for the existing Checkless V1 schema.
-- Apply only after the target database has the current GameMove table.

ALTER TABLE "GameMove"
ADD COLUMN "notation" TEXT NOT NULL;

ALTER TABLE "GameMove"
ADD CONSTRAINT "GameMove_notation_format_check"
CHECK (
  "notation" ~ '^\([1-9][0-9]*\)[WB]:[a-h][1-8][_x][a-h][1-8](_[QRBN])?#?$'
  AND ("notation" !~ '#$' OR "notation" ~ 'x[a-h][1-8](_[QRBN])?#$')
);
