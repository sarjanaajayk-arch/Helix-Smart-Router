CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id text,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX customers_external_id_unique_idx
    ON customers (external_id)
    WHERE external_id IS NOT NULL;

CREATE INDEX customers_status_idx
    ON customers (status);

CREATE TABLE api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id),
    key_hash text NOT NULL UNIQUE,
    display_prefix text,
    name text,
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked', 'expired')),
    last_used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    CHECK (length(key_hash) > 0),
    CHECK (display_prefix IS NULL OR length(display_prefix) <= 16)
);

CREATE TABLE requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id text NOT NULL UNIQUE,
    customer_id uuid REFERENCES customers(id),
    api_key_id uuid REFERENCES api_keys(id),
    requested_model text,
    selected_model text,
    provider text,
    status text NOT NULL
        CHECK (status IN (
            'received',
            'in_progress',
            'succeeded',
            'failed',
            'rejected',
            'rate_limited',
            'timed_out'
        )),
    http_status integer CHECK (http_status IS NULL OR http_status BETWEEN 100 AND 599),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    latency_ms integer CHECK (latency_ms IS NULL OR latency_ms >= 0),
    error_type text,
    error_code text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE TABLE usage_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES requests(id),
    attempt_number integer NOT NULL CHECK (attempt_number >= 1),
    provider text NOT NULL,
    model text NOT NULL,
    input_tokens bigint NOT NULL CHECK (input_tokens >= 0),
    output_tokens bigint NOT NULL CHECK (output_tokens >= 0),
    total_tokens bigint NOT NULL CHECK (
        total_tokens = input_tokens + output_tokens
    ),
    estimated_cost numeric(20, 10),
    cost_currency char(3) NOT NULL DEFAULT 'USD',
    recorded_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (request_id, attempt_number),
    CHECK (estimated_cost IS NULL OR estimated_cost >= 0)
);

CREATE TABLE failover_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES requests(id),
    attempt_number integer NOT NULL CHECK (attempt_number >= 1),
    from_provider text NOT NULL,
    to_provider text NOT NULL,
    from_model text,
    to_model text,
    reason_code text,
    reason_message text,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb,
    CHECK (metadata IS NULL OR pg_column_size(metadata) <= 16384)
);

CREATE INDEX api_keys_customer_status_idx
    ON api_keys (customer_id, status);

CREATE INDEX api_keys_last_used_at_idx
    ON api_keys (last_used_at);

CREATE INDEX requests_customer_created_at_idx
    ON requests (customer_id, created_at DESC);

CREATE INDEX requests_api_key_created_at_idx
    ON requests (api_key_id, created_at DESC);

CREATE INDEX requests_status_created_at_idx
    ON requests (status, created_at DESC);

CREATE INDEX requests_provider_model_created_at_idx
    ON requests (provider, selected_model, created_at DESC);

CREATE INDEX requests_started_at_idx
    ON requests (started_at);

CREATE INDEX usage_records_provider_model_recorded_at_idx
    ON usage_records (provider, model, recorded_at DESC);

CREATE INDEX usage_records_recorded_at_idx
    ON usage_records (recorded_at DESC);

CREATE INDEX usage_records_request_id_idx
    ON usage_records (request_id);

CREATE INDEX failover_events_request_occurred_at_idx
    ON failover_events (request_id, occurred_at);

CREATE INDEX failover_events_provider_occurred_at_idx
    ON failover_events (from_provider, to_provider, occurred_at DESC);

CREATE INDEX failover_events_reason_code_idx
    ON failover_events (reason_code);
