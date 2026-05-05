import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // API Route for Welcome Email
  app.post("/api/welcome-email", async (req, res) => {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!resend) {
      console.warn("RESEND_API_KEY not found. Skipping email sending.");
      return res.status(200).json({ status: "skipped", message: "API key missing" });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Nuance <onboarding@resend.dev>', // Note: This will only work for the owner email in testing mode
        to: [email],
        subject: 'Bem-vindo ao Nuance',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
            <div style="background-color: #FFFFFF; padding: 40px; text-align: center; border-bottom: 1px solid #F1F5F9;">
              <h1 style="color: #0F172A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">NUANCE</h1>
              <p style="color: #64748B; font-size: 14px; margin-top: 8px;">Organize sua mente, maximize sua eficiência.</p>
            </div>
            <div style="padding: 40px; background-color: #FFFFFF;">
              <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin-bottom: 20px;">Olá${name ? `, ${name}` : ''}!</h2>
              <p style="color: #334155; line-height: 1.6; font-size: 16px;">
                É um prazer ter você no <strong>Nuance</strong>. Nosso objetivo é fornecer a você um espaço limpo e intuitivo para capturar suas anotações, gerenciar suas tarefas e documentar seus processos operacionais.
              </p>
              <div style="margin-top: 30px; padding: 20px; background-color: #F8FAFC; border-radius: 12px; border-left: 4px solid #0EA5E9;">
                <p style="color: #1E293B; margin: 0; font-weight: 600;">O que você pode fazer agora:</p>
                <ul style="color: #475569; padding-left: 20px; margin-top: 12px; line-height: 1.8;">
                  <li>Criar anotações rápidas para seus insights</li>
                  <li>Gerenciar suas tarefas diárias no Foco do Dia</li>
                  <li>Mapear e documentar processos da sua empresa</li>
                </ul>
              </div>
              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.APP_URL || 'https://nuance-git-main-dougsoas-projects.vercel.app/'}" style="background-color: #0F172A; color: #FFFFFF; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Começar a Usar</a>
              </div>
            </div>
            <div style="padding: 24px; background-color: #F8FAFC; text-align: center; color: #94A3B8; font-size: 12px;">
              <p style="margin: 0;">&copy; 2026 Quattrus - Nuance v1.2</p>
            </div>
          </div>
        `
      });

      if (error) {
        console.error("Resend Error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ status: "ok", data });
    } catch (err) {
      console.error("Server Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
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
