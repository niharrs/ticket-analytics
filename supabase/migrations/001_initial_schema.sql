-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  auto_created BOOLEAN DEFAULT false,
  ticket_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_message_id TEXT UNIQUE NOT NULL,
  transcript_url TEXT,
  transcript_raw_text TEXT,
  summary TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated')),
  participant_count INTEGER,
  message_count INTEGER,
  ticket_opened_at TIMESTAMPTZ,
  ticket_closed_at TIMESTAMPTZ,
  discord_posted_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  sheets_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Many-to-many join table
CREATE TABLE ticket_categories (
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, category_id)
);

-- Insights table
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('feature_request', 'pain_point', 'ux_issue', 'bug_report', 'general')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tickets_discord_posted_at ON tickets(discord_posted_at DESC);
CREATE INDEX idx_tickets_severity ON tickets(severity);
CREATE INDEX idx_tickets_processed_at ON tickets(processed_at);
CREATE INDEX idx_insights_type ON insights(insight_type);
CREATE INDEX idx_insights_ticket_id ON insights(ticket_id);
CREATE INDEX idx_ticket_categories_category_id ON ticket_categories(category_id);

-- Seed initial categories
INSERT INTO categories (name, description, auto_created) VALUES
  ('Bridge Issue', 'Problems with cross-chain bridge transactions', false),
  ('Transaction Stuck', 'Transactions that are pending or stuck', false),
  ('Fee Question', 'Questions about gas fees, transaction costs', false),
  ('Feature Request', 'User requests for new features', false),
  ('UI Bug', 'Visual or interaction bugs in the UI', false),
  ('Wallet Connection', 'Issues connecting or switching wallets', false),
  ('Token Swap', 'Problems with token swap functionality', false),
  ('General Inquiry', 'General questions and support', false);

-- Function to update category ticket counts
CREATE OR REPLACE FUNCTION update_category_ticket_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories SET ticket_count = ticket_count + 1, updated_at = now()
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories SET ticket_count = ticket_count - 1, updated_at = now()
    WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_count
AFTER INSERT OR DELETE ON ticket_categories
FOR EACH ROW EXECUTE FUNCTION update_category_ticket_count();
