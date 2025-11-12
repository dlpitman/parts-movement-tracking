-- Sample SQL migration creating the tables used by the demo server
-- Adjust types/syntax for your target DB as needed

CREATE TABLE IF NOT EXISTS etchings (
  id SERIAL PRIMARY KEY,
  part_name TEXT,
  etching TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS submitters (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS partslog (
  id SERIAL PRIMARY KEY,
  _ts BIGINT,
  part_name TEXT,
  etching TEXT,
  last_move_date TEXT,
  last_location TEXT,
  reason_to_last TEXT,
  current_move_date TEXT,
  next_location TEXT,
  reason_to_next TEXT,
  part_status TEXT,
  issues TEXT,
  dept TEXT,
  submitted_by TEXT
);
