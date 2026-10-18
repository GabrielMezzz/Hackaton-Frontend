-- Business schema for the `mipyme` database (products, quotes, trend reports).
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS products (
    id          text PRIMARY KEY,
    name        text NOT NULL,
    description text,
    base_price  numeric(10, 2) NOT NULL CHECK (base_price >= 0),
    active      boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS product_variants (
    id         serial PRIMARY KEY,
    product_id text NOT NULL REFERENCES products (id),
    size       text NOT NULL,
    color      text NOT NULL,
    price      numeric(10, 2) CHECK (price >= 0), -- NULL = use products.base_price
    stock      integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    UNIQUE (product_id, size, color)
);

-- Every quote waits for a human advisor to validate payment.
CREATE TABLE IF NOT EXISTS quotes (
    id            serial PRIMARY KEY,
    channel       text NOT NULL CHECK (channel IN ('whatsapp', 'messenger', 'web')),
    customer_id   text,
    customer_name text,
    product_id    text,
    size          text,
    color         text,
    quantity      integer NOT NULL CHECK (quantity > 0),
    unit_price    numeric(10, 2),
    total         numeric(10, 2),
    available     boolean NOT NULL,
    summary       text NOT NULL,
    status        text NOT NULL DEFAULT 'pending_advisor',
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trend_reports (
    id         serial PRIMARY KEY,
    country    text NOT NULL,
    period     text NOT NULL,
    ranking    jsonb NOT NULL,
    report     text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Tienda web (Angibell creaciones)
-- Columnas y tabla extra que usa la pagina; no cambian lo anterior.
-- ---------------------------------------------------------------------

-- Codigo de la tarjeta del producto en la pagina (ej. 'FL-63E73D38'),
-- tipo de prenda y publico (ninas | ninos | bebes).
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_key text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category  text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS audience  text;
CREATE UNIQUE INDEX IF NOT EXISTS products_store_key_idx ON products (store_key);

-- Colores que se ofrecen de cada prenda: el nombre coincide con
-- product_variants.color; photo_id es la foto en Pexels de un nino o nina
-- vistiendo la prenda en ese color (la pagina la carga por URL).
CREATE TABLE IF NOT EXISTS product_colors (
    product_id text NOT NULL REFERENCES products (id),
    color      text NOT NULL,
    hex        text NOT NULL,
    photo_id   bigint NOT NULL,
    position   integer NOT NULL DEFAULT 0,   -- 0 = color por defecto
    PRIMARY KEY (product_id, color)
);

-- Material y textura de la prenda: el probador con IA lo usa para copiar la tela.
ALTER TABLE products ADD COLUMN IF NOT EXISTS material text;

-- Cupo del probador con IA: pruebas usadas por IP y por dia (fecha de Lima).
-- El servidor reserva la prueba con un INSERT ... ON CONFLICT atomico, asi el
-- limite se respeta aunque haya varias instancias (Vercel).
CREATE TABLE IF NOT EXISTS probador_cupos (
    fecha  date    NOT NULL,
    ip     text    NOT NULL,
    usadas integer NOT NULL DEFAULT 0 CHECK (usadas >= 0),
    PRIMARY KEY (fecha, ip)
);

-- ---------------------------------------------------------------------
-- Modulo de Administracion: Categorias, Segregacion y Cloudinary
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id          serial PRIMARY KEY,
    name        text NOT NULL UNIQUE,
    slug        text NOT NULL UNIQUE,
    description text,
    image_url   text,
    active      boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_products (
    category_id integer NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    product_id  text NOT NULL,
    PRIMARY KEY (category_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_color_images (
    product_id text NOT NULL,
    color      text NOT NULL,
    url        text NOT NULL,
    PRIMARY KEY (product_id, color)
);

INSERT INTO categories (name, slug, description)
SELECT DISTINCT 
    category,
    lower(category),
    'Prendas y accesorios en la categoría ' || category
FROM products
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO category_products (category_id, product_id)
SELECT c.id, p.id
FROM products p
JOIN categories c ON c.name = p.category
ON CONFLICT (category_id, product_id) DO NOTHING;

