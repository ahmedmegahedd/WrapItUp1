-- ============================================================================
-- Customer Analytics: checkout_events + RPCs for repeat rate, CLV, top customers,
-- retention, abandoned checkout. Run after main schema (orders, profiles exist).
-- ============================================================================

-- Checkout events: track when user starts checkout; mark converted when order completes.
CREATE TABLE IF NOT EXISTS checkout_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cart_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_checkout_events_user_id ON checkout_events(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_events_created_at ON checkout_events(created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_events_converted ON checkout_events(converted);

COMMENT ON TABLE checkout_events IS 'Start-checkout tracking; converted=true when order completed for that user.';

-- Repeat Customer Rate: (customers with >1 order) / (total unique customers). Uses customer_email from orders.
CREATE OR REPLACE FUNCTION get_analytics_repeat_customer_rate()
RETURNS JSON AS $$
DECLARE
  total_cust bigint;
  repeat_cust bigint;
  rate numeric;
BEGIN
  WITH by_email AS (
    SELECT customer_email, COUNT(*) AS order_count
    FROM orders
    GROUP BY customer_email
  )
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE order_count > 1)::bigint
  INTO total_cust, repeat_cust
  FROM by_email;

  IF total_cust IS NULL OR total_cust = 0 THEN
    RETURN json_build_object('total_customers', 0, 'repeat_customers', 0, 'repeat_rate', 0);
  END IF;
  rate := ROUND((repeat_cust::numeric / total_cust::numeric) * 100, 1);
  RETURN json_build_object(
    'total_customers', total_cust,
    'repeat_customers', repeat_cust,
    'repeat_rate', rate
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Customer Lifetime Value: AOV * avg orders per customer. AOV = total revenue / total orders; avg orders = total orders / unique customers.
CREATE OR REPLACE FUNCTION get_analytics_customer_lifetime_value()
RETURNS JSON AS $$
DECLARE
  total_revenue numeric;
  total_orders bigint;
  unique_customers bigint;
  aov numeric;
  avg_orders numeric;
  clv numeric;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total::numeric ELSE 0 END), 0),
    COUNT(*)::bigint
  INTO total_revenue, total_orders
  FROM orders;

  SELECT COUNT(DISTINCT customer_email)::bigint INTO unique_customers FROM orders;

  IF total_orders IS NULL OR total_orders = 0 OR unique_customers IS NULL OR unique_customers = 0 THEN
    RETURN json_build_object(
      'average_order_value', 0,
      'average_orders_per_customer', 0,
      'clv', 0
    );
  END IF;

  aov := ROUND((total_revenue / total_orders), 0);
  avg_orders := ROUND((total_orders::numeric / unique_customers::numeric), 1);
  clv := ROUND(aov * avg_orders, 0);

  RETURN json_build_object(
    'average_order_value', aov,
    'average_orders_per_customer', avg_orders,
    'clv', clv
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Top Customers: by revenue or by orders. Returns user_id (profile id), name, email, total_orders, total_spent, last_order_date.
CREATE OR REPLACE FUNCTION get_analytics_top_customers(p_limit int DEFAULT 20, p_sort_by text DEFAULT 'revenue')
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  WITH order_agg AS (
    SELECT
      customer_email,
      COUNT(*)::bigint AS total_orders,
      SUM(CASE WHEN payment_status = 'paid' THEN total::numeric ELSE 0 END) AS total_spent,
      MAX(created_at) AS last_order_date
    FROM orders
    GROUP BY customer_email
  ),
  with_profile AS (
    SELECT
      p.id AS user_id,
      COALESCE(p.full_name, oa.customer_email) AS name,
      oa.customer_email AS email,
      oa.total_orders,
      oa.total_spent,
      oa.last_order_date
    FROM order_agg oa
    LEFT JOIN profiles p ON p.email = oa.customer_email
  ),
  ranked AS (
    SELECT user_id, name, email, total_orders, total_spent, last_order_date
    FROM with_profile
    ORDER BY
      CASE WHEN p_sort_by = 'orders' THEN total_orders ELSE 0 END DESC,
      CASE WHEN p_sort_by = 'revenue' THEN total_spent ELSE 0 END DESC,
      last_order_date DESC NULLS LAST
    LIMIT p_limit
  )
  SELECT COALESCE(json_agg(row_to_json(ranked)), '[]'::json) FROM ranked;
$$;

-- Retention: cohort = first order in lookback window; returned = placed another order within X days. Rate = returned / cohort.
-- "Customers who placed first order in a time window" = first order date in that window. "Returned within X days" = at least one more order within X days of first.
-- We define: cohort = distinct customers whose first order was (now - period_days*2) to (now - period_days) ago; returned = those who had a second order within period_days of first order.
CREATE OR REPLACE FUNCTION get_analytics_retention(p_days int DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  cohort_size bigint;
  returned_cust bigint;
  rate numeric;
  window_start timestamptz;
  window_end timestamptz;
BEGIN
  -- Cohort: first order between (now - 2*p_days) and (now - p_days) ago (so we have full p_days to see if they return)
  window_start := NOW() - (p_days * 2 || ' days')::interval;
  window_end := NOW() - (p_days || ' days')::interval;

  WITH first_orders AS (
    SELECT customer_email, MIN(created_at) AS first_at
    FROM orders
    GROUP BY customer_email
  ),
  cohort AS (
    SELECT customer_email, first_at
    FROM first_orders
    WHERE first_at >= window_start AND first_at < window_end
  ),
  returned AS (
    SELECT c.customer_email
    FROM cohort c
    WHERE EXISTS (
      SELECT 1 FROM orders o
      WHERE o.customer_email = c.customer_email
        AND o.created_at > c.first_at
        AND o.created_at <= c.first_at + (p_days || ' days')::interval
    )
  )
  SELECT (SELECT COUNT(*) FROM cohort), (SELECT COUNT(*) FROM returned)
  INTO cohort_size, returned_cust;

  IF cohort_size IS NULL OR cohort_size = 0 THEN
    RETURN json_build_object('period_days', p_days, 'cohort_size', 0, 'returned_customers', 0, 'retention_rate', 0);
  END IF;
  rate := ROUND((returned_cust::numeric / cohort_size::numeric) * 100, 0);
  RETURN json_build_object(
    'period_days', p_days,
    'cohort_size', cohort_size,
    'returned_customers', COALESCE(returned_cust, 0),
    'retention_rate', COALESCE(rate, 0)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Abandoned checkout: events where converted = false AND created_at < now - 2 hours / total checkout_events.
CREATE OR REPLACE FUNCTION get_analytics_abandoned_checkout()
RETURNS JSON AS $$
DECLARE
  total_ev bigint;
  abandoned bigint;
  rate numeric;
BEGIN
  SELECT COUNT(*)::bigint INTO total_ev FROM checkout_events;

  SELECT COUNT(*)::bigint INTO abandoned
  FROM checkout_events
  WHERE converted = false AND created_at < (NOW() - INTERVAL '2 hours');

  IF total_ev IS NULL OR total_ev = 0 THEN
    RETURN json_build_object('total_checkouts', 0, 'abandoned', 0, 'abandonment_rate', 0);
  END IF;
  rate := ROUND((abandoned::numeric / total_ev::numeric) * 100, 0);
  RETURN json_build_object(
    'total_checkouts', total_ev,
    'abandoned', COALESCE(abandoned, 0),
    'abandonment_rate', COALESCE(rate, 0)
  );
END;
$$ LANGUAGE plpgsql STABLE;
