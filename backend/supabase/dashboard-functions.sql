-- Dashboard aggregated functions (server-side SQL for performance).
-- Call from backend via supabase.rpc().
-- Time bounds are ISO timestamps (UTC); "today" is computed in backend and passed here.

-- Today's overview: aggregates + list of latest 15 orders for the given date range (created_at).
CREATE OR REPLACE FUNCTION get_dashboard_today(p_start timestamptz, p_end timestamptz)
RETURNS JSON AS $$
DECLARE
  r RECORD;
  orders_json JSON;
  total_orders bigint;
  total_revenue numeric;
  paid_orders bigint;
  pending_orders bigint;
  preparing_orders bigint;
  out_for_delivery bigint;
  delivered_orders bigint;
  cancelled_orders bigint;
  cod_orders bigint;
  online_paid_orders bigint;
  avg_val numeric;
  date_str text;
BEGIN
  date_str := to_char(p_start AT TIME ZONE 'UTC', 'YYYY-MM-DD');

  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN (total::numeric) ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE payment_status = 'paid')::bigint,
    COUNT(*) FILTER (WHERE order_status = 'pending')::bigint,
    COUNT(*) FILTER (WHERE order_status = 'preparing')::bigint,
    COUNT(*) FILTER (WHERE order_status = 'out_for_delivery')::bigint,
    COUNT(*) FILTER (WHERE order_status = 'delivered')::bigint,
    COUNT(*) FILTER (WHERE order_status = 'cancelled')::bigint,
    COUNT(*) FILTER (WHERE payment_method = 'cod')::bigint,
    COUNT(*) FILTER (WHERE payment_status = 'paid' AND (payment_method IS NULL OR payment_method != 'cod'))::bigint
  INTO total_orders, total_revenue, paid_orders, pending_orders, preparing_orders, out_for_delivery, delivered_orders, cancelled_orders, cod_orders, online_paid_orders
  FROM orders
  WHERE created_at >= p_start AND created_at < p_end;

  IF total_orders IS NULL OR total_orders = 0 THEN
    avg_val := 0;
  ELSE
    avg_val := ROUND((total_revenue / total_orders)::numeric, 0);
  END IF;

  SELECT COALESCE(json_agg(o ORDER BY o.created_at DESC), '[]'::json) INTO orders_json
  FROM (
    SELECT
      id,
      order_number,
      customer_name,
      delivery_time_slot,
      total,
      payment_status AS payment_status,
      order_status AS order_status,
      created_at
    FROM orders
    WHERE created_at >= p_start AND created_at < p_end
    ORDER BY created_at DESC
    LIMIT 15
  ) o;

  RETURN json_build_object(
    'date', date_str,
    'total_orders', COALESCE(total_orders, 0),
    'total_revenue', COALESCE(total_revenue, 0),
    'paid_orders', COALESCE(paid_orders, 0),
    'pending_orders', COALESCE(pending_orders, 0),
    'preparing_orders', COALESCE(preparing_orders, 0),
    'out_for_delivery', COALESCE(out_for_delivery, 0),
    'delivered_orders', COALESCE(delivered_orders, 0),
    'cancelled_orders', COALESCE(cancelled_orders, 0),
    'cod_orders', COALESCE(cod_orders, 0),
    'online_paid_orders', COALESCE(online_paid_orders, 0),
    'average_order_value', COALESCE(avg_val, 0),
    'orders', COALESCE(orders_json, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Alerts: pending payment, delayed preparing (>2h), late delivery (scheduled today but not out_for_delivery/delivered).
CREATE OR REPLACE FUNCTION get_dashboard_alerts(p_today_start timestamptz, p_today_end timestamptz, p_delivery_date date)
RETURNS JSON AS $$
DECLARE
  pending_payment bigint;
  delayed_preparing bigint;
  late_delivery bigint;
BEGIN
  SELECT COUNT(*)::bigint INTO pending_payment
  FROM orders
  WHERE payment_status IN ('pending', 'PENDING_CASH')
    AND created_at >= p_today_start AND created_at < p_today_end;

  SELECT COUNT(*)::bigint INTO delayed_preparing
  FROM orders
  WHERE order_status = 'preparing'
    AND (updated_at < (NOW() - INTERVAL '2 hours') OR (updated_at IS NULL AND created_at < (NOW() - INTERVAL '2 hours')));

  SELECT COUNT(*)::bigint INTO late_delivery
  FROM orders
  WHERE delivery_date = p_delivery_date
    AND order_status NOT IN ('out_for_delivery', 'delivered', 'cancelled');

  RETURN json_build_object(
    'pending_payment', COALESCE(pending_payment, 0),
    'delayed_preparing', COALESCE(delayed_preparing, 0),
    'late_delivery', COALESCE(late_delivery, 0)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Delivery load today: total deliveries and counts per time slot (by delivery_date and delivery_time_slot).
CREATE OR REPLACE FUNCTION get_dashboard_delivery_load(p_delivery_date date)
RETURNS JSON AS $$
DECLARE
  total_deliveries bigint;
  slots_json JSON;
BEGIN
  SELECT COUNT(*)::bigint INTO total_deliveries
  FROM orders
  WHERE delivery_date = p_delivery_date AND order_status != 'cancelled';

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY cnt DESC), '[]'::json) INTO slots_json
  FROM (
    SELECT delivery_time_slot AS time_slot, COUNT(*)::bigint AS cnt
    FROM orders
    WHERE delivery_date = p_delivery_date AND order_status != 'cancelled'
    GROUP BY delivery_time_slot
  ) t;

  RETURN json_build_object(
    'delivery_date', p_delivery_date,
    'total_deliveries', COALESCE(total_deliveries, 0),
    'by_slot', COALESCE(slots_json, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Low stock products: stock_quantity <= threshold (default 5).
CREATE OR REPLACE FUNCTION get_low_stock_products(p_threshold int DEFAULT 5)
RETURNS JSON AS $$
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY stock_quantity ASC), '[]'::json)
  FROM (
    SELECT id, title AS name, stock_quantity
    FROM products
    WHERE is_active = true AND stock_quantity <= p_threshold
  ) t;
$$ LANGUAGE sql STABLE;

-- Revenue today vs yesterday (by created_at date range).
CREATE OR REPLACE FUNCTION get_revenue_comparison(p_today_start timestamptz, p_today_end timestamptz, p_yesterday_start timestamptz, p_yesterday_end timestamptz)
RETURNS JSON AS $$
DECLARE
  revenue_today numeric;
  revenue_yesterday numeric;
  pct_change numeric;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total::numeric ELSE 0 END), 0) INTO revenue_today
  FROM orders WHERE created_at >= p_today_start AND created_at < p_today_end;

  SELECT COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total::numeric ELSE 0 END), 0) INTO revenue_yesterday
  FROM orders WHERE created_at >= p_yesterday_start AND created_at < p_yesterday_end;

  IF revenue_yesterday = 0 THEN
    pct_change := CASE WHEN revenue_today > 0 THEN 100 ELSE 0 END;
  ELSE
    pct_change := ROUND(((revenue_today - revenue_yesterday) / revenue_yesterday * 100)::numeric, 1);
  END IF;

  RETURN json_build_object(
    'revenue_today', COALESCE(revenue_today, 0),
    'revenue_yesterday', COALESCE(revenue_yesterday, 0),
    'percent_change', COALESCE(pct_change, 0)
  );
END;
$$ LANGUAGE plpgsql STABLE;
