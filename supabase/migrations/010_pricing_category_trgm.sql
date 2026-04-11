-- Trigram index on pricing.Category to fix slow line-item search
--
-- The pricing search query in /api/pricing ORs three ILIKE filters:
--   "Item" ILIKE %q% OR "Trade" ILIKE %q% OR "Category" ILIKE %q%
--
-- Trigram GIN indexes already existed on Item and Trade, but not Category.
-- Postgres can only convert an OR of ILIKE branches into a BitmapOr of index
-- scans when *every* branch has a usable index — so the missing Category
-- index forced a full Seq Scan of the pricing table on every keystroke.
--
-- After adding this index, the planner uses BitmapOr across all three
-- trigram indexes; query time dropped from ~70ms (Seq Scan) to ~5ms.
create extension if not exists pg_trgm;

create index if not exists idx_pricing_category_trgm
  on public.pricing using gin ("Category" gin_trgm_ops);

analyze public.pricing;
