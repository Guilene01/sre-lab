-- Applied by scripts/setup.sh against the ecommerce_db database after it
-- creates the database and app user on the shared RDS instance.

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL
);

INSERT INTO products (name, description, price_cents, category, image_url) VALUES
  ('Heritage Wool Overcoat', 'Double-breasted wool-blend overcoat, cut long for a tailored silhouette.', 34000, 'apparel', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80&auto=format&fit=crop'),
  ('Organic Cotton Tee, Sage', 'Heavyweight organic cotton, garment-dyed in small batches.', 4800, 'apparel', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80&auto=format&fit=crop'),
  ('Suede Derby Shoes', 'Hand-lasted suede derbies with a stacked leather heel.', 22000, 'footwear', 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80&auto=format&fit=crop'),
  ('Structured Leather Satchel', 'Full-grain leather satchel with brushed hardware.', 28500, 'accessories', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80&auto=format&fit=crop'),
  ('Eames-Style Dining Chair', 'Molded shell chair on a solid beech base.', 18900, 'home', 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&q=80&auto=format&fit=crop'),
  ('Marble-Top Side Table', 'Honed marble top on a powder-coated steel frame.', 24500, 'home', 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800&q=80&auto=format&fit=crop'),
  ('Chesterfield-Inspired Sofa', 'Tufted three-seat sofa upholstered in brushed cotton.', 89000, 'home', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80&auto=format&fit=crop'),
  ('Denim Trucker Jacket', 'Rigid selvedge denim that softens with wear.', 15800, 'apparel', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&auto=format&fit=crop')
ON CONFLICT DO NOTHING;
