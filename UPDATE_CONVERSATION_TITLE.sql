-- ============================================
-- Function to auto-update conversation title
-- ============================================
-- This function automatically updates the conversation title
-- based on the first user message when a conversation is created

CREATE OR REPLACE FUNCTION update_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update title if it's still "محادثة جديدة" and this is the first message
    IF EXISTS (
        SELECT 1 FROM conversations 
        WHERE id = NEW.conversation_id 
        AND title = 'محادثة جديدة'
    ) AND NEW.role = 'user' THEN
        UPDATE conversations
        SET title = LEFT(NEW.content, 40)
        WHERE id = NEW.conversation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for messages table
DROP TRIGGER IF EXISTS update_conversation_title_trigger ON messages;
CREATE TRIGGER update_conversation_title_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_title();
