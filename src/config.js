const dotenv = require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3001,
    POSTGRES_USER: process.env.PG_USER || "wpsrbsfjslaqae",
    POSTGRES_PASSWORD: process.env.PG_PASSWORD || "d8b06870d3dcf5498c35d6f1bb29b7d2c351d216d99b725be61bb535a8f7cb57",
    POSTGRES_HOST: process.env.PG_HOST || "ec2-3-227-15-75.compute-1.amazonaws.com",
    POSTGRES_DB_NAME: process.env.PG_DB_NAME || "d97vc0p651008o",
    DATABASE_URL: process.env.DATABASE_URL || "postgres://wpsrbsfjslaqae:d8b06870d3dcf5498c35d6f1bb29b7d2c351d216d99b725be61bb535a8f7cb57@ec2-3-227-15-75.compute-1.amazonaws.com:5432/d97vc0p651008o",
    MP_PUBLIC_KEY: process.env.MP_PUBLIC_KEY,
    MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
    MP_SUCCESS_URL: process.env.MP_SUCCESS_URL,
    MP_FAILURE_URL: process.env.MP_FAILURE_URL,
    URL_FRONT: process.env.URL_FRONT,
    PUBLIC_VAPID_KEY: process.env.PUBLIC_VAPID_KEY,
    PRIVATE_VAPID_KEY: process.env.PRIVATE_VAPID_KEY,
}

