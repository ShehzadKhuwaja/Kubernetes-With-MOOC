const https = require("https");
const { Pool } = require("pg");

// --- Connect to the same Postgres DB your backend uses ---
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
});

// --- Function to fetch a random Wikipedia article ---
function getRandomArticle() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "en.wikipedia.org",
      path: "/wiki/Special:Random",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TodoBot/1.0)" }
    };

    https.get(options, (res) => {
      const location = res.headers.location;
      if (location) resolve(`${location}`);
      else reject(new Error("No redirect location found"));
    }).on("error", reject);
  });
}


(async () => {
  try {
    // Ensure todos table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const url = await getRandomArticle();
    const text = `Read ${url}`;

    await pool.query("INSERT INTO todos (text, done) VALUES ($1, $2)", [text, false]);
    console.log(`✅ New todo added: ${text}`);

    await pool.end();
  } catch (err) {
    console.error("❌ Error creating todo:", err.message);
    process.exit(1);
  }
})();
