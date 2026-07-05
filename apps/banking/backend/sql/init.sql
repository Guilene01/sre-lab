-- Demo-only auth: plaintext password compare, no hashing. This is a training
-- lab, not a real bank -- see docs/architecture.md.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_number TEXT UNIQUE NOT NULL,
  balance_cents BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  type TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  counterparty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO users (username, password, full_name) VALUES
  ('amara.osei', 'demo123', 'Amara Osei'),
  ('daniel.kowalski', 'demo123', 'Daniel Kowalski'),
  ('priya.chandra', 'demo123', 'Priya Chandrasekaran')
ON CONFLICT DO NOTHING;

INSERT INTO accounts (user_id, account_number, balance_cents) VALUES
  ((SELECT id FROM users WHERE username = 'amara.osei'), 'MB-100482913', 423150),
  ((SELECT id FROM users WHERE username = 'daniel.kowalski'), 'MB-100482914', 81210),
  ((SELECT id FROM users WHERE username = 'priya.chandra'), 'MB-100482915', 1520433)
ON CONFLICT DO NOTHING;

INSERT INTO transactions (account_id, type, amount_cents, counterparty) VALUES
  ((SELECT id FROM accounts WHERE account_number = 'MB-100482913'), 'debit', 8900, 'Whole Foods Market'),
  ((SELECT id FROM accounts WHERE account_number = 'MB-100482913'), 'credit', 320000, 'Payroll Deposit'),
  ((SELECT id FROM accounts WHERE account_number = 'MB-100482913'), 'debit', 4500, 'Con Edison'),
  ((SELECT id FROM accounts WHERE account_number = 'MB-100482914'), 'credit', 150000, 'Payroll Deposit'),
  ((SELECT id FROM accounts WHERE account_number = 'MB-100482914'), 'debit', 62000, 'Rent Payment'),
  ((SELECT id FROM accounts WHERE account_number = 'MB-100482915'), 'credit', 500000, 'Payroll Deposit'),
  ((SELECT id FROM accounts WHERE account_number = 'MB-100482915'), 'debit', 12999, 'Delta Air Lines')
ON CONFLICT DO NOTHING;
