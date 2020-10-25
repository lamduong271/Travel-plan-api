CREATE DATABASE travel_plan_database;

-- \c into travel_plan_database--

CREATE TABLE plan (
  plan_id SERIAL PRIMARY KEY,
  destination VARCHAR(255)
);