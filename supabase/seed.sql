-- ============================================
-- WYN Seed Data
-- Run this AFTER schema.sql
-- ============================================

-- Clear existing data (for development only)
DELETE FROM wine_ratings;
DELETE FROM enrichment_jobs;
DELETE FROM wines;
DELETE FROM venues;

-- ============================================
-- DEMO VENUE
-- ============================================
INSERT INTO venues (slug, name, description, email, password_hash) VALUES
(
  'osteria-del-vino',
  'Osteria del Vino',
  'Ristorante tradizionale italiano con ampia selezione di vini locali',
  'admin@osteria.com',
  'demo'
);

-- ============================================
-- DEMO WINES
-- ============================================
DO $$
DECLARE
  v_venue_id UUID;
  v_wine_id UUID;
BEGIN
  -- Get venue ID
  SELECT id INTO v_venue_id FROM venues WHERE slug = 'osteria-del-vino';

  -- Barolo Riserva
  INSERT INTO wines (venue_id, name, wine_type, price, price_glass, producer, region, denomination, grape_varieties, year, description, available)
  VALUES (v_venue_id, 'Barolo Riserva 2018', 'red', 85.00, 18.00, 'Cascina Francia', 'Piemonte', 'Barolo DOCG', ARRAY['Nebbiolo'], 2018, 'Nebbiolo corposo con note di catrame, rose e ciliegie essiccate', true)
  RETURNING id INTO v_wine_id;

  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  VALUES (v_wine_id, 'wine-spectator', 'Wine Spectator', '95', 0.85, 2023);

  -- Brunello di Montalcino
  INSERT INTO wines (venue_id, name, wine_type, price, price_glass, producer, region, denomination, grape_varieties, year, description, available)
  VALUES (v_venue_id, 'Brunello di Montalcino 2019', 'red', 95.00, 20.00, 'Biondi-Santi', 'Toscana', 'Brunello di Montalcino DOCG', ARRAY['Sangiovese Grosso'], 2019, 'Sangiovese Grosso al suo meglio, invecchiato 4 anni in rovere', true)
  RETURNING id INTO v_wine_id;

  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  VALUES (v_wine_id, 'robert-parker', 'Robert Parker', '97', 0.90, 2023);

  -- Gavi di Gavi
  INSERT INTO wines (venue_id, name, wine_type, price, price_glass, producer, region, denomination, grape_varieties, year, description, available)
  VALUES (v_venue_id, 'Gavi di Gavi 2022', 'white', 42.00, 10.00, 'La Scolca', 'Piemonte', 'Gavi DOCG', ARRAY['Cortese'], 2022, 'Cortese fresco con note minerali e agrumi', true)
  RETURNING id INTO v_wine_id;

  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  VALUES (v_wine_id, 'gambero-rosso', 'Gambero Rosso', 'Tre Bicchieri', 0.95, 2024);

  -- Franciacorta
  INSERT INTO wines (venue_id, name, wine_type, price, price_glass, producer, region, denomination, grape_varieties, year, description, available)
  VALUES (v_venue_id, 'Franciacorta Brut NV', 'sparkling', 58.00, 14.00, 'Ca'' del Bosco', 'Lombardia', 'Franciacorta DOCG', ARRAY['Chardonnay', 'Pinot Nero'], NULL, 'Spumante metodo classico, 36 mesi sui lieviti', true)
  RETURNING id INTO v_wine_id;

  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  VALUES (v_wine_id, 'bibenda', 'Bibenda', '5 Grappoli', 0.80, 2023);

  -- Amarone (unavailable)
  INSERT INTO wines (venue_id, name, wine_type, price, price_glass, producer, region, denomination, grape_varieties, year, description, available)
  VALUES (v_venue_id, 'Amarone della Valpolicella 2017', 'red', 120.00, NULL, 'Allegrini', 'Veneto', 'Amarone DOCG', ARRAY['Corvina', 'Rondinella', 'Molinara'], 2017, 'Ricco e vellutato, prodotto con uve Corvina appassite', false)
  RETURNING id INTO v_wine_id;

  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  VALUES (v_wine_id, 'wine-spectator', 'Wine Spectator', '96', 0.88, 2022);

  -- Vermentino
  INSERT INTO wines (venue_id, name, wine_type, price, price_glass, producer, region, denomination, grape_varieties, year, description, available)
  VALUES (v_venue_id, 'Vermentino di Sardegna 2023', 'white', 32.00, 8.00, 'Argiolas', 'Sardegna', 'Vermentino di Sardegna DOC', ARRAY['Vermentino'], 2023, 'Luminoso e aromatico con carattere mediterraneo', true)
  RETURNING id INTO v_wine_id;

  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  VALUES (v_wine_id, 'veronelli', 'Veronelli', '90', 0.75, 2024);

END $$;

-- ============================================
-- VERIFY SEED DATA
-- ============================================
SELECT 'Venues created: ' || COUNT(*)::text FROM venues;
SELECT 'Wines created: ' || COUNT(*)::text FROM wines;
SELECT 'Ratings created: ' || COUNT(*)::text FROM wine_ratings;
