CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assignee TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tickets (subject, description, priority, status, assignee, created_at) VALUES
  ('Unable to reset password', 'Password reset email never arrives, checked spam folder.', 'high', 'open', NULL, now() - interval '2 hours'),
  ('Export feature returns 500 error', 'CSV export on the reports page fails every time with a server error.', 'urgent', 'in_progress', 'Priya Iyer', now() - interval '1 day'),
  ('Billing charged twice this month', 'Two identical charges appeared on our card for the June invoice.', 'high', 'in_progress', 'Alex Chen', now() - interval '3 days'),
  ('Feature request: dark mode', 'Several team members would like a dark theme option.', 'low', 'open', NULL, now() - interval '5 days'),
  ('Login page slow to load', 'The login screen takes 8-10 seconds to render during business hours.', 'medium', 'resolved', 'Jordan Blake', now() - interval '6 days'),
  ('API rate limit unclear', 'Documentation does not specify the current rate limit for the /v1/orders endpoint.', 'low', 'closed', 'Alex Chen', now() - interval '9 days')
ON CONFLICT DO NOTHING;

INSERT INTO comments (ticket_id, author, body, created_at) VALUES
  (2, 'Priya Iyer', 'Reproduced locally, looks like a timeout on large exports. Investigating.', now() - interval '20 hours'),
  (3, 'Alex Chen', 'Confirmed duplicate charge with billing provider, refund issued.', now() - interval '2 days'),
  (5, 'Jordan Blake', 'Added caching to the auth check, load time is back under 1s.', now() - interval '5 days')
ON CONFLICT DO NOTHING;
