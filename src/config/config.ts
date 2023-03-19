import configDb from "./dbConfig.json";

const { port, mongodb } = configDb;

const config = {
  ENV: process.env.NODE_ENV || "development",
  PORT: port,
  SECRET_KEY: "gtkAdmin",
  DB_URL: `mongodb://${mongodb.host}:${mongodb.port}/${mongodb.database}`,
};

export default config;
