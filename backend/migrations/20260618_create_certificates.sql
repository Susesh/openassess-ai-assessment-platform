CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    certificate_id VARCHAR UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    score INTEGER NOT NULL,
    percentage FLOAT NOT NULL,
    issued_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    pdf_url VARCHAR
);
