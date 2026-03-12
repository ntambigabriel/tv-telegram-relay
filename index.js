const http = require("http");
const https = require("https");

const TELEGRAM_TOKEN = "8592174927:AAEEKWBbqn251iXhBs4-RGm33HIUjfLUaX0";
const TELEGRAM_CHAT_ID = "6726986738";
const PORT = process.env.PORT || 8080;

function sendTelegram(text) {
  const body = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: "HTML",
  });
  const options = {
    hostname: "api.telegram.org",
    path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };
  const req = https.request(options, (res) => {
    console.log(`Telegram status: ${res.statusCode}`);
  });
  req.on("error", (e) => console.error("Telegram error:", e));
  req.write(body);
  req.end();
}

function formatMessage(alert) {
  const a = alert.trim();

  // ── STAGE 1: P1 Detected ──────────────────────────────────────────────────
  if (a.startsWith("P1 DETECTED")) {
    const parts = a.match(/P1 DETECTED (\S+) p1=([\d.]+)/);
    if (parts) {
      return (
        `📍 <b>STAGE 1 — P1 Level Found</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Pair: <b>${parts[1]}</b>\n` +
        `P1 Level: <b>${parts[2]}</b>\n\n` +
        `⏳ Waiting for price to break above P1...`
      );
    }
  }

  // ── STAGE 2: Breakout Above P1 ────────────────────────────────────────────
  if (a.startsWith("BREAKOUT")) {
    const parts = a.match(/BREAKOUT (\S+) p1=([\d.]+) p2=([\d.]+)/);
    if (parts) {
      return (
        `🚀 <b>STAGE 2 — Breakout Above P1</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Pair: <b>${parts[1]}</b>\n` +
        `P1 Level: <b>${parts[2]}</b>\n` +
        `Current High (P2): <b>${parts[3]}</b>\n\n` +
        `⏳ Price broke above P1. Watching for correction back below P1...`
      );
    }
  }

  // ── STAGE 3: Correction Confirmed ─────────────────────────────────────────
  if (a.startsWith("CORRECTION CONFIRMED")) {
    const parts = a.match(/CORRECTION CONFIRMED (\S+)/);
    const pair = parts ? parts[1] : "BTCUSDT";
    return (
      `📉 <b>STAGE 3 — Correction Confirmed</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Pair: <b>${pair}</b>\n\n` +
      `✅ Price has closed below P1 the required number of times.\n` +
      `✅ Correction size is valid.\n\n` +
      `⏳ Now watching for price to approach and reclaim P1 from below...`
    );
  }

  // ── STAGE 4: Approaching P1 ───────────────────────────────────────────────
  if (a.startsWith("APPROACHING P1")) {
    const parts = a.match(/APPROACHING P1 (\S+)/);
    const pair = parts ? parts[1] : "BTCUSDT";
    return (
      `🟠 <b>STAGE 4 — Approaching P1</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Pair: <b>${pair}</b>\n\n` +
      `⚠️ Price is getting close to P1 from below.\n` +
      `👀 Get ready — a BUY signal may fire soon if price closes above P1.`
    );
  }

  // ── STAGE 5: BUY Signal ───────────────────────────────────────────────────
  if (a.startsWith("BUY ")) {
    const parts = a.match(/BUY (\S+) entry=([\d.]+) SL=([\d.]+) TP=([\d.]+)/);
    if (parts) {
      const rr = ((parseFloat(parts[4]) - parseFloat(parts[2])) / (parseFloat(parts[2]) - parseFloat(parts[3]))).toFixed(2);
      return (
        `🟢 <b>STAGE 5 — BUY SIGNAL FIRED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Pair: <b>${parts[1]}</b>\n` +
        `Entry: <b>${parts[2]}</b>\n` +
        `Stop Loss: <b>${parts[3]}</b>\n` +
        `Take Profit: <b>${parts[4]}</b>\n` +
        `R:R Ratio: <b>1:${rr}</b>\n\n` +
        `✅ Price has closed back above P1.\n` +
        `⏳ Now managing trade — watching midpoint and SL...`
      );
    }
  }

  // ── STAGE 6: Midpoint Touched ─────────────────────────────────────────────
  if (a.startsWith("MIDPOINT TOUCHED")) {
    const parts = a.match(/MIDPOINT TOUCHED (\S+) mid=([\d.]+)/);
    if (parts) {
      return (
        `⚪ <b>STAGE 6 — Midpoint Touched</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Pair: <b>${parts[1]}</b>\n` +
        `Midpoint Level: <b>${parts[2]}</b>\n\n` +
        `⚠️ Price has touched the midpoint between entry and SL.\n` +
        `🔴 Model A Sell is now ARMED.\n` +
        `👀 If price drops back to SL from here, a SELL LIMIT will trigger.`
      );
    }
  }

  // ── STAGE 6b: Midpoint Crossed Down ───────────────────────────────────────
  if (a.startsWith("MIDPOINT CROSSED DOWN")) {
    const parts = a.match(/MIDPOINT CROSSED DOWN (\S+) mid=([\d.]+)/);
    if (parts) {
      return (
        `🔻 <b>STAGE 6b — Midpoint Crossed Down</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Pair: <b>${parts[1]}</b>\n` +
        `Midpoint Level: <b>${parts[2]}</b>\n\n` +
        `⚠️ Price has dropped below the midpoint.\n` +
        `⚠️ Caution — buy trade is under pressure.`
      );
    }
  }

  // ── STAGE 7: Model A SELL ─────────────────────────────────────────────────
  if (a.startsWith("MODEL A SELL")) {
    const parts = a.match(/MODEL A SELL (\S+) LIMIT=([\d.]+) SL=([\d.]+) TP=([\d.]+)/);
    if (parts) {
      const rr = ((parseFloat(parts[2]) - parseFloat(parts[4])) / (parseFloat(parts[3]) - parseFloat(parts[2]))).toFixed(2);
      return (
        `🔴 <b>STAGE 7 — MODEL A SELL TRIGGERED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Pair: <b>${parts[1]}</b>\n` +
        `Sell Limit: <b>${parts[2]}</b>\n` +
        `Stop Loss: <b>${parts[3]}</b>\n` +
        `Take Profit: <b>${parts[4]}</b>\n` +
        `R:R Ratio: <b>1:${rr}</b>\n\n` +
        `✅ Buy failed — midpoint was touched then price hit SL.\n` +
        `✅ Model A Sell Limit order is now set.\n` +
        `📌 Place sell limit at <b>${parts[2]}</b> with SL at <b>${parts[3]}</b> and TP at <b>${parts[4]}</b>.`
      );
    }
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  return `📡 <b>Alert</b>\n${a}`;
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/webhook") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const alertText = data.alert || data.message || body;
        console.log("Received alert:", alertText);
        const formatted = formatMessage(alertText);
        sendTelegram(formatted);
        res.writeHead(200);
        res.end("OK");
      } catch (e) {
        console.error("Parse error:", e);
        res.writeHead(400);
        res.end("Bad Request");
      }
    });
  } else if (req.method === "GET" && req.url === "/") {
    res.writeHead(200);
    res.end("PO3 Signal Bot relay is running.");
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Relay server running on port ${PORT}`);
});
