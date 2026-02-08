-- Seed data for boat booking system

-- Insert Groups
INSERT INTO "Group" (id, name, description) VALUES
    ('admin-group', 'Admin', 'Full access to all boats'),
    ('member-group', 'Member', 'Standard members')
ON CONFLICT (name) DO NOTHING;

-- Insert Boats
INSERT INTO "Boat" (id, name, description, "isActive") VALUES
    ('boat-1', 'Swift Single Scull', 'Single person racing boat for experienced rowers', true),
    ('boat-2', 'Double Scull', 'Two-person boat suitable for intermediate rowers', true),
    ('boat-3', 'Training Quad', 'Four-person training boat - all members welcome', true)
ON CONFLICT (id) DO NOTHING;

-- Assign boat permissions
-- Boat 1 (Swift Single Scull) - Admin group only
INSERT INTO "BoatGroup" ("boatId", "groupId") VALUES
    ('boat-1', 'admin-group')
ON CONFLICT ("boatId", "groupId") DO NOTHING;

-- Boat 2 (Double Scull) - Both Admin and Member groups
INSERT INTO "BoatGroup" ("boatId", "groupId") VALUES
    ('boat-2', 'admin-group'),
    ('boat-2', 'member-group')
ON CONFLICT ("boatId", "groupId") DO NOTHING;

-- Boat 3 (Training Quad) has no restrictions (all users can book)

-- Note: Users will be automatically created when they sign in with OAuth
-- To assign users to groups after they sign in:
-- INSERT INTO "UserGroup" ("userId", "groupId") VALUES ('user-id-here', 'admin-group');
-- or
-- INSERT INTO "UserGroup" ("userId", "groupId") VALUES ('user-id-here', 'member-group');
