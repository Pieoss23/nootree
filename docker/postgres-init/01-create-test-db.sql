-- Runs once on first container start. Creates the disposable database used
-- by DB integration tests (TEST_DATABASE_URL), kept separate from the
-- development database so tests never touch dev data.
CREATE DATABASE nootree_test OWNER nootree;
