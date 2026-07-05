CREATE TABLE IF NOT EXISTS restaurants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  status TEXT NOT NULL DEFAULT 'placed',
  total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL
);

INSERT INTO restaurants (name, cuisine, rating, image_url) VALUES
  ('Kettle & Vine', 'New American', 4.7, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&auto=format&fit=crop'),
  ('Lantern House', 'Southeast Asian', 4.5, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop'),
  ('The Copper Pot', 'Comfort Food', 4.8, 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80&auto=format&fit=crop')
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (restaurant_id, name, description, price_cents, image_url) VALUES
  ((SELECT id FROM restaurants WHERE name = 'Kettle & Vine'), 'Banana Pancake Stack', 'Buttermilk pancakes, warm maple syrup, toasted almonds.', 1400, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80&auto=format&fit=crop'),
  ((SELECT id FROM restaurants WHERE name = 'Kettle & Vine'), 'Harvest Grain Bowl', 'Grilled tofu, charred corn, edamame, sesame dressing.', 1600, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop'),
  ((SELECT id FROM restaurants WHERE name = 'Lantern House'), 'Grilled Beef Salad', 'Seared beef, red onion, chili, fresh herbs.', 1800, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop'),
  ((SELECT id FROM restaurants WHERE name = 'Lantern House'), 'Chilled Garden Salad', 'Mixed greens, orange segments, walnuts, citrus vinaigrette.', 1200, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80&auto=format&fit=crop'),
  ((SELECT id FROM restaurants WHERE name = 'The Copper Pot'), 'Chef''s Tasting Plates', 'Three seasonal small plates, chef''s choice.', 2600, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80&auto=format&fit=crop')
ON CONFLICT DO NOTHING;
