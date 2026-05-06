import express from 'express';
import path from 'path';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp, App as FirebaseAdminApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

dotenv.config();

// Read Firebase config
let firebaseConfig: any = null;
try {
  const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  firebaseConfig = JSON.parse(readFileSync(firebaseConfigPath, 'utf-8'));
} catch (e) {
  console.error("Failed to read firebase-applet-config.json", e);
}

// Initialize Firebase Admin safely
let firebaseAdminApp: FirebaseAdminApp | null = null;
if (firebaseConfig) {
  try {
    if (getApps().length === 0) {
      firebaseAdminApp = initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("Firebase Admin initialized successfully.");
    } else {
      firebaseAdminApp = getApp();
    }
  } catch (error) {
    console.error("CRITICAL: Error initializing Firebase Admin:", error);
  }
}

const __dirname = path.resolve();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebaseAdmin: !!firebaseAdminApp });
  });

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // Middleware to verify Firebase ID Token
  const verifyToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      if (!firebaseAdminApp) {
         return res.status(500).json({ error: 'Firebase Admin not initialized' });
      }
      const decodedToken = await getAuth().verifyIdToken(idToken);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Error verifying Firebase token:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };

  // API Route for Welcome Email - Now PROTECTED
  app.post("/api/welcome-email", verifyToken, async (req: any, res: any) => {
    const { email, name } = req.body;
    
    // Safety check: ensure the email being targeted matches the authenticated user's email
    // or at least that they ARE authenticated. 
    // Usually, welcome email is sent right after login/signup.
    if (req.user.email !== email) {
      return res.status(403).json({ error: "Forbidden: You can only send welcome emails to yourself." });
    }

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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body style="background-color:#ffffff">
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td style="background-color:#ffffff">
            <table
              align="left"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="max-width:600px;align:left;width:100%;color:#000000;background-color:#ffffff;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;border-radius:0px;border-color:#000000">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-top:40px;margin-right:auto;margin-bottom:40px;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;max-width:600px;background-color:#ffffff;border-radius:12px;border-style:solid;border-width:1px;border-color:#e1e8ed;border-collapse:separate;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
                      <tbody>
                        <tr style="margin:0;padding:0">
                          <td
                            align="center"
                            data-id="__react-email-column"
                            style="margin:0;padding:40px 20px 20px">
                            <div
                              style="margin:0;padding:0;background-color:#00a09d;color:#ffffff;width:48px;height:48px;line-height:48px;font-size:24px;font-weight:bold;border-radius:12px;margin-bottom:10px;display:inline-block;text-align:center">
                              <p style="margin:0;padding:0">N</p>
                            </div>
                            <h1
                              style="margin:0;padding:0;font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;text-transform:uppercase">
                              NUANCE
                            </h1>
                            <p
                              style="margin:5px 0 0;padding:0;font-size:14px;color:#64748b">
                              Organize sua mente, maximize sua eficiência.
                            </p>
                          </td>
                        </tr>
                        <tr style="margin:0;padding:0">
                          <td
                            data-id="__react-email-column"
                            style="margin:0;padding:20px 40px">
                            <p
                              style="margin:0;padding:0;font-size:20px;font-weight:bold;color:#0f172a;margin-bottom:15px">
                              Olá${name ? `, ${name}` : ''}!
                            </p>
                            <p
                              style="margin:0;padding:0;font-size:16px;line-height:1.6;color:#475569;margin-bottom:30px">
                              É um prazer ter você no <strong>Nuance</strong>.
                              Nosso objetivo é fornecer a você um espaço limpo e
                              intuitivo para capturar suas anotações, gerenciar
                              suas tarefas e documentar seus processos
                              operacionais.
                            </p>
                            <table
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background-color:#f8fafc;border-left:4px solid #00a09d;border-radius:0 8px 8px 0">
                              <tbody>
                                <tr style="margin:0;padding:0">
                                  <td
                                    data-id="__react-email-column"
                                    style="margin:0;padding:20px">
                                    <p
                                      style="margin:0 0 12px 0;padding:0;font-weight:bold;font-size:16px;color:#0f172a">
                                      O que você pode fazer agora:
                                    </p>
                                    <ul
                                      style="margin:0;padding:0;padding-left:1.1em;padding-bottom:1em;list-style:none">
                                      <li
                                        style="margin:0;padding:0;margin-left:1em;padding-bottom:0.3em;padding-top:0.3em;margin-bottom:8px;color:#475569;font-size:15px">
                                        <p style="margin:0;padding:0">
                                          Criar anotações rápidas para seus
                                          insights
                                        </p>
                                      </li>
                                      <li
                                        style="margin:0;padding:0;margin-left:1em;padding-bottom:0.3em;padding-top:0.3em;margin-bottom:8px;color:#475569;font-size:15px">
                                        <p style="margin:0;padding:0">
                                          Gerenciar suas tarefas diárias no Foco
                                          do Dia
                                        </p>
                                      </li>
                                      <li
                                        style="margin:0;padding:0;margin-left:1em;padding-bottom:0.3em;padding-top:0.3em;margin-bottom:0;color:#475569;font-size:15px">
                                        <p style="margin:0;padding:0">
                                          Mapear e documentar os seus processos
                                        </p>
                                      </li>
                                    </ul>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr style="margin:0;padding:0">
                          <td
                            align="center"
                            data-id="__react-email-column"
                            style="margin:0;padding:20px 40px 40px">
                            <p style="margin:0;padding:0">
                              <a
                                href="${process.env.APP_URL || 'https://nuance-git-main-dougsoas-projects.vercel.app/'}"
                                rel="noopener noreferrer nofollow"
                                style="color:#ffffff;text-decoration-line:none;text-decoration:none;background-color:#0f172a;padding:14px 32px;font-weight:bold;border-radius:8px;display:inline-block"
                                target="_blank"
                                >Começar a Usar</a
                              >
                            </p>
                          </td>
                        </tr>
                        <tr style="margin:0;padding:0">
                          <td
                            align="center"
                            data-id="__react-email-column"
                            style="margin:0;padding:20px;background-color:#f8fafc;font-size:12px;color:#94a3b8;border-top:1px solid #e1e8ed">
                            <p style="margin:0;padding:0">
                              © 2026 Quattrus - Nuance v1.2
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
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
    const { createServer: createViteServer } = await import("vite");
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
