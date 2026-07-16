-- Enable RLS on tables created after the initial RLS migration
-- These tables were added without RLS: Notification, AiInsight, SystemEvent

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemEvent" ENABLE ROW LEVEL SECURITY;

-- Revoke public access from the new tables
REVOKE ALL ON TABLE "Notification" FROM anon;
REVOKE ALL ON TABLE "Notification" FROM authenticated;

REVOKE ALL ON TABLE "AiInsight" FROM anon;
REVOKE ALL ON TABLE "AiInsight" FROM authenticated;

REVOKE ALL ON TABLE "SystemEvent" FROM anon;
REVOKE ALL ON TABLE "SystemEvent" FROM authenticated;
