-- Server-owned prices/order identity. Not automatically provisioned or deployed.
CREATE TABLE IF NOT EXISTS alipay_orders (
 id TEXT PRIMARY KEY,
 amount TEXT NOT NULL,
 subject TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','paid','closed')),
 trade_no TEXT UNIQUE
);
