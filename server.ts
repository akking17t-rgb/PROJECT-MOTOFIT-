import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import * as jose from "jose";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Mock DB & Validation ---
// (In a real scenario, these would interact with Firebase or another DB)
const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

// --- API ROUTES ---

// Auth Placeholder (Login/Signup)
// Firebase Auth should be used on the client, but here's a generic example for the request
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // Real auth logic would go here
  res.json({ 
    message: "Login successful (Simulated)",
    user: { email, id: "123" },
    token: "simulated-jwt-token" 
  });
});

// Contact Form API
app.post("/api/contact", async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
    console.log("Contact form submission:", data);
    
    // In a real app, store this in Firestore
    res.json({ success: true, message: "Message received! We will get back to you soon." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
