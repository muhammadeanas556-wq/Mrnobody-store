-- =====================================================================
-- MrNobody — core schema, Row Level Security, storage and order logic
-- Run in Supabase → SQL Editor (or `supabase db push`).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Admins (rows are inserted ONLY from the SQL editor / service role)
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'owner' check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories(id) on delete set null,
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  description text default '',
  image_url   text,
  position    int  not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index categories_position_idx on public.categories(position);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name             text not null,
  description      text default '',
  category_id      uuid references public.categories(id) on delete set null,
  price            numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  is_featured      boolean not null default false,
  is_new_arrival   boolean not null default false,
  is_best_seller   boolean not null default false,
  status           text not null default 'draft' check (status in ('active','draft','archived')),
  is_demo          boolean not null default false,
  sold_count       int not null default 0,
  meta_title       text,
  meta_description text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_status_idx   on public.products(status);
create index products_flags_idx    on public.products(is_featured, is_new_arrival, is_best_seller);
create index products_created_idx  on public.products(created_at desc);

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  url          text not null,
  storage_path text,
  alt          text default '',
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, position);

-- Variants hold the inventory. A product without options has a single variant.
create table public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku        text unique,
  size       text,
  color      text,
  price      numeric(12,2) check (price is null or price >= 0), -- null = use product price
  stock      int not null default 0 check (stock >= 0),
  is_active  boolean not null default true,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants(product_id);

create table public.inventory_movements (
  id         bigserial primary key,
  variant_id uuid references public.product_variants(id) on delete cascade,
  change     int not null,
  reason     text not null,            -- order | cancel | restock | adjustment
  order_id   uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index inventory_movements_variant_idx on public.inventory_movements(variant_id, created_at desc);

create table public.product_reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 60),
  rating      int not null check (rating between 1 and 5),
  comment     text check (char_length(comment) <= 1000),
  is_approved boolean not null default false,
  created_at  timestamptz not null default now()
);
create index product_reviews_product_idx on public.product_reviews(product_id) where is_approved;

create view public.product_rating_stats
with (security_invoker = true) as
  select product_id, round(avg(rating)::numeric, 1) as avg_rating, count(*)::int as review_count
  from public.product_reviews where is_approved
  group by product_id;

-- ---------------------------------------------------------------------
-- Customers & orders
-- ---------------------------------------------------------------------
create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  phone        text not null unique,
  email        text,
  province     text,
  city         text,
  address      text,
  orders_count int not null default 0,
  total_spent  numeric(12,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create sequence public.order_number_seq start 1001;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  customer_id       uuid references public.customers(id) on delete set null,
  customer_name     text not null,
  phone             text not null,
  email             text,
  province          text not null,
  city              text not null,
  address           text not null,
  notes             text,
  subtotal          numeric(12,2) not null,
  discount          numeric(12,2) not null default 0,
  delivery_fee      numeric(12,2) not null default 0,
  total             numeric(12,2) not null,
  promo_code        text,
  payment_method    text not null default 'cod',
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  status            text not null default 'pending'
                    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','returned')),
  courier           text,
  tracking_number   text,
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index orders_status_idx   on public.orders(status);
create index orders_created_idx  on public.orders(created_at desc);
create index orders_phone_idx    on public.orders(phone);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  variant_id    uuid references public.product_variants(id) on delete set null,
  product_name  text not null,
  variant_label text,
  sku           text,
  image_url     text,
  unit_price    numeric(12,2) not null,
  quantity      int not null check (quantity > 0),
  line_total    numeric(12,2) not null
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

create table public.order_status_history (
  id         bigserial primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,
  note       text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id);

-- ---------------------------------------------------------------------
-- Marketing & content
-- ---------------------------------------------------------------------
create table public.banners (
  id             uuid primary key default gen_random_uuid(),
  placement      text not null check (placement in ('hero','collage','promo')),
  slot           text,              -- collage: large | small-1 | small-2 | wide
  position       int not null default 0,
  eyebrow        text,
  title          text,
  subtitle       text,
  body           text,
  button_text    text,
  button_link    text,
  secondary_text text,
  secondary_link text,
  image_url      text,
  is_active      boolean not null default true,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index banners_placement_idx on public.banners(placement, position);

create table public.promotions (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code = upper(code)),
  description   text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  value         numeric(12,2) not null check (value > 0),
  min_order     numeric(12,2) not null default 0,
  max_uses      int,
  used_count    int not null default 0,
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (discount_type <> 'percent' or value <= 90)
);

create table public.site_settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.pages (
  slug         text primary key check (slug ~ '^[a-z0-9-]+$'),
  title        text not null,
  body         text not null default '',
  is_published boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['categories','products','product_variants','customers','orders','banners','promotions','site_settings','pages']
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.admin_users            enable row level security;
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.product_variants       enable row level security;
alter table public.inventory_movements    enable row level security;
alter table public.product_reviews        enable row level security;
alter table public.customers              enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.banners                enable row level security;
alter table public.promotions             enable row level security;
alter table public.site_settings          enable row level security;
alter table public.pages                  enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- admin_users: a signed-in user may only see whether THEY are an admin. No write policies.
create policy "admin_users self read" on public.admin_users for select to authenticated using (user_id = auth.uid());

-- Public catalogue reads
create policy "categories public read" on public.categories for select using (is_visible or public.is_admin());
create policy "products public read"   on public.products   for select using (status = 'active' or public.is_admin());
create policy "images public read" on public.product_images for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy "variants public read" on public.product_variants for select using (
  public.is_admin() or (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active')));
create policy "banners public read" on public.banners for select using (is_active or public.is_admin());
create policy "settings public read" on public.site_settings for select using (true);
create policy "pages public read" on public.pages for select using (is_published or public.is_admin());
create policy "reviews public read" on public.product_reviews for select using (is_approved or public.is_admin());

-- Public writes that are safe by construction
create policy "reviews public submit" on public.product_reviews for insert to anon, authenticated
  with check (is_approved = false);
create policy "newsletter public subscribe" on public.newsletter_subscribers for insert to anon, authenticated
  with check (true);

-- Admin full control
do $$
declare t text;
begin
  foreach t in array array['categories','products','product_images','product_variants','inventory_movements',
                           'customers','orders','order_items','order_status_history','banners','promotions','pages']
  loop
    execute format('create policy "%s admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;
create policy "reviews admin manage" on public.product_reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reviews admin delete" on public.product_reviews for delete to authenticated using (public.is_admin());
create policy "settings admin update" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings admin insert" on public.site_settings for insert to authenticated with check (public.is_admin());
create policy "newsletter admin read" on public.newsletter_subscribers for select to authenticated using (public.is_admin());
create policy "newsletter admin delete" on public.newsletter_subscribers for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- Stock restore when an order is cancelled / returned (and re-deduct if reopened)
-- ---------------------------------------------------------------------
create or replace function public.handle_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  it record;
  closed_old boolean := old.status in ('cancelled','returned');
  closed_new boolean := new.status in ('cancelled','returned');
  cur_stock int;
begin
  if new.status is distinct from old.status then
    insert into order_status_history(order_id, status, created_by) values (new.id, new.status, auth.uid());

    if closed_new and not closed_old then
      for it in select * from order_items where order_id = new.id and variant_id is not null loop
        update product_variants set stock = stock + it.quantity where id = it.variant_id;
        update products set sold_count = greatest(0, sold_count - it.quantity) where id = it.product_id;
        insert into inventory_movements(variant_id, change, reason, order_id, created_by)
          values (it.variant_id, it.quantity, new.status, new.id, auth.uid());
      end loop;
      update customers set orders_count = greatest(0, orders_count - 1), total_spent = greatest(0, total_spent - new.total)
        where id = new.customer_id;
    elsif closed_old and not closed_new then
      for it in select * from order_items where order_id = new.id and variant_id is not null loop
        select stock into cur_stock from product_variants where id = it.variant_id for update;
        if cur_stock < it.quantity then
          raise exception 'Cannot reopen order: only % left of % (%)', cur_stock, it.product_name, coalesce(it.variant_label,'standard');
        end if;
        update product_variants set stock = stock - it.quantity where id = it.variant_id;
        update products set sold_count = sold_count + it.quantity where id = it.product_id;
        insert into inventory_movements(variant_id, change, reason, order_id, created_by)
          values (it.variant_id, -it.quantity, 'reopened', new.id, auth.uid());
      end loop;
      update customers set orders_count = orders_count + 1, total_spent = total_spent + new.total where id = new.customer_id;
    end if;
  end if;
  return new;
end $$;

create trigger orders_status_change after update of status on public.orders
  for each row execute function public.handle_order_status_change();

-- ---------------------------------------------------------------------
-- place_order: the ONLY way orders are created. Called by the Netlify
-- function with the service-role key. Prices, stock, delivery fee and
-- promotions are all recalculated here from database values.
-- ---------------------------------------------------------------------
create or replace function public.place_order(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name     text := trim(coalesce(p->>'full_name',''));
  v_phone    text := regexp_replace(coalesce(p->>'phone',''), '[\s-]', '', 'g');
  v_email    text := nullif(trim(coalesce(p->>'email','')), '');
  v_province text := trim(coalesce(p->>'province',''));
  v_city     text := trim(coalesce(p->>'city',''));
  v_address  text := trim(coalesce(p->>'address',''));
  v_notes    text := nullif(trim(coalesce(p->>'notes','')), '');
  v_code     text := nullif(upper(trim(coalesce(p->>'promo_code',''))), '');
  v_items    jsonb := coalesce(p->'items','[]'::jsonb);
  settings   jsonb;
  line       record;
  rec        record;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_fee      numeric(12,2) := 0;
  v_total    numeric(12,2);
  v_customer uuid;
  v_order    uuid;
  v_number   text;
  promo      record;
  lines      jsonb := '[]'::jsonb;
  label      text;
  unit       numeric(12,2);
begin
  -- 1. validate customer data
  if char_length(v_name) < 3 or char_length(v_name) > 80 then raise exception 'VALIDATION: Please enter your full name.'; end if;
  if v_phone ~ '^\+92' then v_phone := '0' || substr(v_phone, 4); end if;
  if v_phone ~ '^92' and char_length(v_phone) = 12 then v_phone := '0' || substr(v_phone, 3); end if;
  if v_phone !~ '^03[0-9]{9}$' then raise exception 'VALIDATION: Enter a valid Pakistani mobile number (e.g. 03XX XXXXXXX).'; end if;
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'VALIDATION: Email address looks invalid.'; end if;
  if v_province = '' or v_city = '' then raise exception 'VALIDATION: Province and city are required.'; end if;
  if char_length(v_address) < 10 then raise exception 'VALIDATION: Please enter your complete delivery address.'; end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then raise exception 'VALIDATION: Your cart is empty.'; end if;
  if jsonb_array_length(v_items) > 50 then raise exception 'VALIDATION: Too many items in one order.'; end if;

  select data into settings from site_settings where id = 1;

  -- 2. lock variants, validate stock & prices (duplicates merged)
  for line in
    select (e->>'variant_id')::uuid as variant_id, sum((e->>'quantity')::int)::int as qty
    from jsonb_array_elements(v_items) e
    group by 1 order by 1
  loop
    if line.qty is null or line.qty < 1 or line.qty > 50 then raise exception 'VALIDATION: Invalid quantity.'; end if;

    select v.id, v.sku, v.size, v.color, v.price as vprice, v.stock, v.is_active,
           pr.id as product_id, pr.name, pr.price, pr.status,
           (select url from product_images i where i.product_id = pr.id order by position limit 1) as image_url
      into rec
      from product_variants v join products pr on pr.id = v.product_id
     where v.id = line.variant_id
     for update of v;

    if not found or rec.status <> 'active' or not rec.is_active then
      raise exception 'UNAVAILABLE: One of the items in your cart is no longer available. Please remove it and try again.';
    end if;
    label := nullif(concat_ws(' / ', rec.color, rec.size), '');
    if rec.stock = 0 then
      raise exception 'STOCK: "%"% is now out of stock. Please remove it from your cart.', rec.name,
        case when label is null then '' else ' (' || label || ')' end;
    end if;
    if rec.stock < line.qty then
      raise exception 'STOCK: Only % left of "%"%. Please reduce the quantity.', rec.stock, rec.name,
        case when label is null then '' else ' (' || label || ')' end;
    end if;
    unit := coalesce(rec.vprice, rec.price);
    v_subtotal := v_subtotal + unit * line.qty;
    lines := lines || jsonb_build_object('variant_id', rec.id, 'product_id', rec.product_id, 'name', rec.name,
              'label', label, 'sku', rec.sku, 'image_url', rec.image_url, 'unit', unit, 'qty', line.qty);
  end loop;

  -- 3. promotion
  if v_code is not null then
    select * into promo from promotions
     where code = v_code and is_active
       and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
     for update;
    if not found then raise exception 'PROMO: This promo code is invalid or has expired.'; end if;
    if promo.max_uses is not null and promo.used_count >= promo.max_uses then raise exception 'PROMO: This promo code has reached its usage limit.'; end if;
    if v_subtotal < promo.min_order then raise exception 'PROMO: This code needs a minimum order of Rs. %.', promo.min_order; end if;
    v_discount := case when promo.discount_type = 'percent' then round(v_subtotal * promo.value / 100) else least(promo.value, v_subtotal) end;
    update promotions set used_count = used_count + 1 where id = promo.id;
  end if;

  -- 4. delivery fee from settings
  v_fee := coalesce((settings->>'delivery_fee')::numeric, 0);
  if coalesce((settings->>'free_shipping_threshold')::numeric, 0) > 0
     and (v_subtotal - v_discount) >= (settings->>'free_shipping_threshold')::numeric then
    v_fee := 0;
  end if;
  v_total := v_subtotal - v_discount + v_fee;

  -- 5. customer upsert (keyed on phone)
  insert into customers(full_name, phone, email, province, city, address, orders_count, total_spent)
  values (v_name, v_phone, v_email, v_province, v_city, v_address, 1, v_total)
  on conflict (phone) do update set
    full_name = excluded.full_name, email = coalesce(excluded.email, customers.email),
    province = excluded.province, city = excluded.city, address = excluded.address,
    orders_count = customers.orders_count + 1, total_spent = customers.total_spent + excluded.total_spent
  returning id into v_customer;

  -- 6. order
  v_number := 'MN' || to_char(now() at time zone 'Asia/Karachi', 'YYMMDD') || '-' || nextval('order_number_seq');
  insert into orders(order_number, customer_id, customer_name, phone, email, province, city, address, notes,
                     subtotal, discount, delivery_fee, total, promo_code, payment_method)
  values (v_number, v_customer, v_name, v_phone, v_email, v_province, v_city, v_address, v_notes,
          v_subtotal, v_discount, v_fee, v_total, v_code, 'cod')
  returning id into v_order;
  insert into order_status_history(order_id, status, note) values (v_order, 'pending', 'Order placed');

  -- 7. items + stock deduction
  for line in select * from jsonb_to_recordset(lines)
      as x(variant_id uuid, product_id uuid, name text, label text, sku text, image_url text, unit numeric, qty int)
  loop
    insert into order_items(order_id, product_id, variant_id, product_name, variant_label, sku, image_url, unit_price, quantity, line_total)
    values (v_order, line.product_id, line.variant_id, line.name, line.label, line.sku, line.image_url, line.unit, line.qty, line.unit * line.qty);
    update product_variants set stock = stock - line.qty where id = line.variant_id;
    update products set sold_count = sold_count + line.qty where id = line.product_id;
    insert into inventory_movements(variant_id, change, reason, order_id) values (line.variant_id, -line.qty, 'order', v_order);
  end loop;

  return jsonb_build_object(
    'order_number', v_number, 'subtotal', v_subtotal, 'discount', v_discount,
    'delivery_fee', v_fee, 'total', v_total, 'payment_method', 'cod',
    'items', (select jsonb_agg(jsonb_build_object('name', l->>'name', 'label', l->>'label', 'qty', (l->>'qty')::int,
                     'unit', (l->>'unit')::numeric, 'image_url', l->>'image_url')) from jsonb_array_elements(lines) l)
  );
end $$;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

-- Promo preview for the cart (does not consume the code)
create or replace function public.check_promo(p_code text, p_subtotal numeric)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare promo record;
begin
  select * into promo from promotions
   where code = upper(trim(p_code)) and is_active
     and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now());
  if not found or (promo.max_uses is not null and promo.used_count >= promo.max_uses) then
    return jsonb_build_object('valid', false, 'message', 'This promo code is invalid or has expired.');
  end if;
  if p_subtotal < promo.min_order then
    return jsonb_build_object('valid', false, 'message', format('Minimum order of Rs. %s required.', promo.min_order));
  end if;
  return jsonb_build_object('valid', true, 'code', promo.code, 'description', promo.description,
    'discount', case when promo.discount_type = 'percent' then round(p_subtotal * promo.value / 100) else least(promo.value, p_subtotal) end);
end $$;
grant execute on function public.check_promo(text, numeric) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Admin dashboard statistics (real data, admin only)
-- ---------------------------------------------------------------------
create or replace function public.admin_stats(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select jsonb_build_object(
    'total_orders',     (select count(*) from orders),
    'pending',          (select count(*) from orders where status = 'pending'),
    'confirmed',        (select count(*) from orders where status in ('confirmed','processing','shipped')),
    'delivered',        (select count(*) from orders where status = 'delivered'),
    'cancelled',        (select count(*) from orders where status in ('cancelled','returned')),
    'revenue',          (select coalesce(sum(total),0) from orders where status = 'delivered'),
    'pipeline_revenue', (select coalesce(sum(total),0) from orders where status not in ('cancelled','returned')),
    'products',         (select count(*) from products where status <> 'archived'),
    'low_stock',        (select count(*) from product_variants v join products p on p.id = v.product_id
                           where p.status = 'active' and v.is_active and v.stock <= 3),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'total', coalesce(s.total,0), 'orders', coalesce(s.cnt,0)) order by d), '[]'::jsonb)
                from generate_series((now() at time zone 'Asia/Karachi')::date - (p_days - 1), (now() at time zone 'Asia/Karachi')::date, interval '1 day') d
                left join (select (created_at at time zone 'Asia/Karachi')::date as day, sum(total) total, count(*) cnt
                             from orders where status not in ('cancelled','returned') group by 1) s on s.day = d::date),
    'best_sellers', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
                       select oi.product_id, max(oi.product_name) as name, sum(oi.quantity)::int as qty, sum(oi.line_total) as revenue
                         from order_items oi join orders o on o.id = oi.order_id
                        where o.status not in ('cancelled','returned')
                        group by oi.product_id order by qty desc limit 5) x)
  ) into result;
  return result;
end $$;
grant execute on function public.admin_stats(int) to authenticated;

-- ---------------------------------------------------------------------
-- Storage: public-read media bucket, admin-only writes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-media', 'store-media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/x-icon'])
on conflict (id) do nothing;

create policy "store-media public read" on storage.objects for select using (bucket_id = 'store-media');
create policy "store-media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'store-media' and public.is_admin());
create policy "store-media admin update" on storage.objects for update to authenticated using (bucket_id = 'store-media' and public.is_admin());
create policy "store-media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'store-media' and public.is_admin());
