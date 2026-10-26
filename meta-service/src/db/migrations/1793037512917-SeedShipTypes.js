// Reference data for ship_types: the AIS "type of ship and cargo" codes 0-99
// (ITU-R M.1371, message 5 / ShipStaticData `Type`).
//
// Until now ingest-service created rows on the fly with placeholder descriptions
// ("AIS ship type 70") and stored whatever code a transponder sent, including invalid ones
// (> 99). This migration:
// - replaces the placeholders with the real descriptions (upsert, so it also fills a fresh DB);
// - sets invalid codes already stored on ships / ais_positions to NULL and deletes their
//   ship_types rows. Not reversible: the original invalid values are not kept;
// - makes ais_positions.ship_type nullable, so a position whose vessel has an invalid type
//   is still stored (ingest now writes NULL for those);
// - adds CHECK (ship_type_id BETWEEN 0 AND 99) so invalid codes can't come back.

// Categories whose 10 codes follow the "all / hazardous A-D / reserved / no info" pattern.
const PATTERNED = {
  2: 'Wing in ground (WIG)',
  4: 'High speed craft (HSC)',
  6: 'Passenger',
  7: 'Cargo',
  8: 'Tanker',
  9: 'Other type',
};

const SPECIFIC = {
  0: 'Not available',
  30: 'Fishing',
  31: 'Towing',
  32: 'Towing: length exceeds 200m or breadth exceeds 25m',
  33: 'Dredging or underwater operations',
  34: 'Diving operations',
  35: 'Military operations',
  36: 'Sailing',
  37: 'Pleasure craft',
  50: 'Pilot vessel',
  51: 'Search and rescue vessel',
  52: 'Tug',
  53: 'Port tender',
  54: 'Anti-pollution equipment',
  55: 'Law enforcement',
  56: 'Spare - local vessel',
  57: 'Spare - local vessel',
  58: 'Medical transport',
  59: 'Noncombatant ship (RR Resolution No. 18)',
};

function describe(code) {
  if (SPECIFIC[code]) return SPECIFIC[code];
  const category = PATTERNED[Math.floor(code / 10)];
  if (category) {
    const digit = code % 10;
    if (digit === 0) return `${category}, all ships of this type`;
    if (digit <= 4) return `${category}, hazardous category ${'ABCD'[digit - 1]}`;
    if (digit <= 8) return `${category}, reserved for future use`;
    return `${category}, no additional information`;
  }
  return 'Reserved for future use'; // 1-19, 38-39
}

const CODES = Array.from({ length: 100 }, (_, code) => code);

export class SeedShipTypes1793037512917 {
  name = 'SeedShipTypes1793037512917';

  async up(queryRunner) {
    await queryRunner.query(`
UPDATE ships SET ship_type = NULL WHERE ship_type NOT BETWEEN 0 AND 99;

ALTER TABLE ais_positions ALTER COLUMN ship_type DROP NOT NULL;
UPDATE ais_positions SET ship_type = NULL WHERE ship_type NOT BETWEEN 0 AND 99;

DELETE FROM ship_types WHERE ship_type_id NOT BETWEEN 0 AND 99;
ALTER TABLE ship_types DROP CONSTRAINT IF EXISTS chk_ship_types_id;
ALTER TABLE ship_types ADD CONSTRAINT chk_ship_types_id CHECK (ship_type_id BETWEEN 0 AND 99);
`);

    await queryRunner.query(
      `INSERT INTO ship_types (ship_type_id, description)
       SELECT * FROM unnest($1::smallint[], $2::text[])
       ON CONFLICT (ship_type_id) DO UPDATE SET description = EXCLUDED.description`,
      [CODES, CODES.map(describe)]
    );
  }

  async down(queryRunner) {
    // Restores the previous shape. Invalid codes nulled by up() can't be recovered; positions
    // with a NULL type get 0 ("Not available") so NOT NULL can be reinstated.
    await queryRunner.query(`
ALTER TABLE ship_types DROP CONSTRAINT IF EXISTS chk_ship_types_id;
UPDATE ais_positions SET ship_type = 0 WHERE ship_type IS NULL;
ALTER TABLE ais_positions ALTER COLUMN ship_type SET NOT NULL;
UPDATE ship_types
SET description = CASE WHEN ship_type_id = 0 THEN 'Unknown' ELSE 'AIS ship type ' || ship_type_id END;
`);
  }
}
