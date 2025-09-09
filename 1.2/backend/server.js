import express from "express";
import fs from "fs";
import fetch from "node-fetch";

const app = express();
const IMAGE_URL = process.env.IMAGE_URL || "https://picsum.photos/1200";
const IMAGE_FILE = process.env.IMAGE_FILE || "/shared/image.jpg";
const META_FILE = process.env.META_FILE || "/shared/meta.json";
const PORT = process.env.PORT || 3000;
const IMAGE_EXPIRY_MINUTES = parseInt(process.env.IMAGE_EXPIRY_MINUTES || "10", 10);


function loadMeta() {
  try {
    return JSON.parse(fs.readFileSync(META_FILE));
  } catch {
    return {};
  }
}

function saveMeta(meta) {
  fs.writeFileSync(META_FILE, JSON.stringify(meta));
}

async function fetchNewImage() {
  const res = await fetch(`${IMAGE_URL}`);
  const buffer = await res.buffer();
  fs.writeFileSync(IMAGE_FILE, buffer);
  saveMeta({ timestamp: Date.now(), servedAfterExpiry: false });
}

app.get("/api/image", async (req, res) => {
  try {
    const meta = loadMeta();
    const now = Date.now();
    const ageMinutes = (now - (meta.timestamp || 0)) / (1000 * 60);

    if (!fs.existsSync(IMAGE_FILE)) {
      await fetchNewImage();
    } else if (ageMinutes > IMAGE_EXPIRY_MINUTES) {
      if (!meta.servedAfterExpiry) {
        meta.servedAfterExpiry = true;
        saveMeta(meta);
      } else {
        await fetchNewImage();
      }
    }

    res.sendFile(IMAGE_FILE);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching image");
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
