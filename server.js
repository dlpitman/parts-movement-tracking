const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// SQLite-backed persistence
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

// initialize DB and seed sample data if empty
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS etchings (
    id INTEGER PRIMARY KEY,
    part_name TEXT,
    etching TEXT,
    status TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS submitters (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS partslog (
    id INTEGER PRIMARY KEY,
    _ts INTEGER,
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
  )`);

  // seed etchings if table empty
  db.get('SELECT COUNT(*) as c FROM etchings', (err, row) => {
    if (!err && row && row.c === 0) {
      const stmt = db.prepare('INSERT INTO etchings (part_name, etching, status) VALUES (?,?,?)');
      const samples = [
        ['Widget A','A-100','In Service'],
        ['Widget A','A-101','In Service'],
        ['Widget B','B-200','In Service'],
        ['Widget C','C-300','Retired']
      ];
      for (const s of samples) stmt.run(s[0], s[1], s[2]);
      stmt.finalize();
    }
  });

  // seed submitters if empty
  db.get('SELECT COUNT(*) as c FROM submitters', (err, row) => {
    if (!err && row && row.c === 0) {
      const stmt = db.prepare('INSERT INTO submitters (name) VALUES (?)');
      const samples = ['Judah Jodrey','Kaitlyn Arlotta','David Pitman','Madelyn Ricepelekpo'];
      for (const n of samples) stmt.run(n);
      stmt.finalize();
    }
  });
});

// API: list etchings
app.get('/api/etchings', (req, res) => {
  db.all('SELECT part_name, etching, status FROM etchings', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// API: list submitters
app.get('/api/submitters', (req, res) => {
  db.all('SELECT name FROM submitters ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows.map(r => r.name));
  });
});

// API: register new submitter
app.post('/api/register', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const trimmedName = name.trim();
    
    // Check if name already exists
    db.get('SELECT name FROM submitters WHERE name = ?', [trimmedName], (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (row) return res.status(409).json({ error: 'Name already registered' });
      
      // Insert new submitter
      const stmt = db.prepare('INSERT INTO submitters (name) VALUES (?)');
      stmt.run(trimmedName, function(err) {
        if (err) {
          console.error('Insert error', err);
          return res.status(500).json({ error: 'Failed to register' });
        }
        res.status(201).json({ ok: true, name: trimmedName });
      });
      stmt.finalize();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// API: add log entry
app.post('/api/partslog', (req, res) => {
  try {
    const b = req.body || {};
    const ts = Date.now();
    const stmt = db.prepare(`INSERT INTO partslog (
      _ts, part_name, etching, last_move_date, last_location, reason_to_last,
      current_move_date, next_location, reason_to_next, part_status, issues, dept, submitted_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    stmt.run(
      ts,
      b.part_name || '', b.etching || '', b.last_move_date || '', b.last_location || '', b.reason_to_last || '',
      b.current_move_date || '', b.next_location || '', b.reason_to_next || '', b.part_status || '', b.issues || '', b.dept || '', b.submitted_by || '',
      function(err) {
        if (err) {
          console.error('Insert error', err);
          return res.status(500).json({ error: 'DB insert error' });
        }
        const id = this.lastID;
        db.get('SELECT * FROM partslog WHERE id = ?', [id], (err2, row) => {
          if (err2) return res.status(500).json({ error: 'DB read error' });
          res.status(201).json({ ok: true, entry: row });
        });
      }
    );
    stmt.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// API: get all logs
app.get('/api/partslog', (req, res) => {
  db.all('SELECT * FROM partslog ORDER BY _ts DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// API: CSV export
app.get('/api/partslog/csv', (req, res) => {
  db.all('SELECT * FROM partslog ORDER BY _ts DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!rows.length) {
      res.setHeader('Content-Type', 'text/csv');
      return res.send('');
    }
    const fields = ['_ts','part_name','etching','last_move_date','last_location','reason_to_last','current_move_date','next_location','reason_to_next','part_status','issues','dept','submitted_by'];
    const out = [fields.join(',')];
    for (const r of rows) {
      const vals = fields.map(f => {
        const v = r[f] == null ? '' : (''+r[f]).replace(/"/g,'""');
        return `"${v.replace(/\n/g,' ')}"`;
      });
      out.push(vals.join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="partslog.csv"');
    res.send(out.join('\n'));
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
