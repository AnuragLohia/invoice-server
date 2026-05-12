const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.get("/", (req, res) => {
  res.json({ status: "Invoice Server running ✅", keySet: !!API_KEY });
});

app.post("/api/extract", (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  }
  const body = JSON.stringify(req.body);
  const options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01"
    }
  };
  const apiReq = https.request(options, (apiRes) => {
    let data = "";
    apiRes.on("data", chunk => data += chunk);
    apiRes.on("end", () => {
      try { res.status(apiRes.statusCode).json(JSON.parse(data)); }
      catch (e) { res.status(500).json({ error: "Parse error", raw: data }); }
    });
  });
  apiReq.on("error", (e) => res.status(500).json({ error: e.message }));
  apiReq.write(body);
  apiReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));
