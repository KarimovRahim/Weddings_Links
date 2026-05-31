import express from "express";
import fs from "fs/promises";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "guests.json");
const SETTINGS_FILE = path.join(process.cwd(), "settings.json");

const defaultSettings = [
  {
    id: "default-event",
    name: "Новая свадьба",
    groomName: "Амир",
    brideName: "Мадина",
    date: "2026-08-24",
    time: "18:00",
    venueName: "Ресторан 'Яккасарой'",
    venueAddress: "ул. Айни 48, Душанбе, Таджикистан",
    venueMapLink: "https://yandex.ru/maps/-/CDTq6M~k",
    accentColor: "#b59e78",
    dressCodeText: "Мы не ограничиваем вас определенными цветами или стилем.\nДля нас самое главное – ваше присутствие, улыбки и хорошее настроение в этот день!\nВыбирайте образ, в котором вы будете чувствовать себя красиво и комфортно.\nЕдинственная просьба – просим девушек воздержаться от белых платьев, чтобы этот цвет остался исключительно за невестой.",
    wishesText: "Настоящая таджикская свадьба – это когда столы ломятся от угощений, а национальная музыка зовет в пляс!\nДрузья, наше вам пожелание: будьте сегодня в ударе! Услышали дойру или карнай – бросайте всё и выходите в круг!\nВаша поддержка и веселье сделают нашу свадьбу незабываемой!"
  }
];

app.use(express.json());

// Initialize data file if it doesn't exist
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
}
async function initSettingsFile() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
       const mapped = [{ id: "default-event", name: "Основная свадьба", ...parsed }];
       await fs.writeFile(SETTINGS_FILE, JSON.stringify(mapped, null, 2));
    }
  } catch (error) {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
}
initDataFile();
initSettingsFile();

// API Endpoints
app.get("/api/settings", async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    let settings = JSON.parse(data);
    if (!Array.isArray(settings)) settings = [{ id: "default-event", name: "Основная свадьба", ...settings }];
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to read settings" });
  }
});

app.get("/api/settings/:id", async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    let settings = JSON.parse(data);
    if (!Array.isArray(settings)) settings = [{ id: "default-event", name: "Основная свадьба", ...settings }];
    const setting = settings.find((s: any) => s.id === req.params.id);
    if (setting) res.json(setting);
    else res.status(404).json({ error: "Setting not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to read settings" });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const newSetting = req.body;
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    let settings = JSON.parse(data);
    if (!Array.isArray(settings)) settings = [{ id: "default-event", name: "Основная свадьба", ...settings }];
    settings.push(newSetting);
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    res.status(201).json(newSetting);
  } catch (err) {
    res.status(500).json({ error: "Failed to create setting" });
  }
});

app.put("/api/settings/:id", async (req, res) => {
  try {
    const updatedSetting = req.body;
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    let settings = JSON.parse(data);
    if (!Array.isArray(settings)) settings = [{ id: "default-event", name: "Основная свадьба", ...settings }];
    settings = settings.map((s: any) => s.id === req.params.id ? updatedSetting : s);
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    res.json(updatedSetting);
  } catch (err) {
    res.status(500).json({ error: "Failed to update setting" });
  }
});

app.delete("/api/settings/:id", async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    let settings = JSON.parse(data);
    if (!Array.isArray(settings)) settings = [{ id: "default-event", name: "Основная свадьба", ...settings }];
    settings = settings.filter((s: any) => s.id !== req.params.id);
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete setting" });
  }
});

app.get("/api/guests", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Failed to read data" });
  }
});

app.post("/api/guests", async (req, res) => {
  try {
    const newGuest = req.body;
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const guests = JSON.parse(data);
    guests.push(newGuest);
    await fs.writeFile(DATA_FILE, JSON.stringify(guests, null, 2));
    res.status(201).json(newGuest);
  } catch (err) {
    res.status(500).json({ error: "Failed to save guest" });
  }
});

app.delete("/api/guests/:id", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    let guests = JSON.parse(data);
    guests = guests.filter((g: any) => g.id !== req.params.id);
    await fs.writeFile(DATA_FILE, JSON.stringify(guests, null, 2));
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete guest" });
  }
});

app.get("/api/guests/:id", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const guests = JSON.parse(data);
    const guest = guests.find((g: any) => g.id === req.params.id);
    if (guest) {
      res.json(guest);
    } else {
      res.status(404).json({ error: "Guest not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to read data" });
  }
});

app.put("/api/guests/:id/rsvp", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    let guests = JSON.parse(data);
    const index = guests.findIndex((g: any) => g.id === req.params.id);
    if (index !== -1) {
      guests[index] = { ...guests[index], ...req.body };
      await fs.writeFile(DATA_FILE, JSON.stringify(guests, null, 2));
      res.json(guests[index]);
    } else {
      res.status(404).json({ error: "Guest not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update RSVP" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
