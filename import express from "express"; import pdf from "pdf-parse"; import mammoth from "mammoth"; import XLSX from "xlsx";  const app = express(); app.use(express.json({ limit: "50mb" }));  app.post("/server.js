import express from "express";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import XLSX from "xlsx";

const app = express();
app.use(express.json({ limit: "50mb" }));

app.post("/parse", async (req, res) => {
  try {
    const { base64, mime } = req.body;

    const buffer = Buffer.from(base64, "base64");

    let fileData = {};

    if (mime.includes("pdf")) {
      const data = await pdf(buffer);
      fileData = { type: "pdf", text: data.text };
    }

    else if (mime.includes("word")) {
      const result = await mammoth.extractRawText({ buffer });
      fileData = { type: "docx", text: result.value };
    }

    else if (mime.includes("excel") || mime.includes("spreadsheet")) {
      const wb = XLSX.read(buffer);
      const sheets = {};

      wb.SheetNames.forEach(name => {
        sheets[name] = XLSX.utils.sheet_to_json(
          wb.Sheets[name],
          { header: 1 }
        );
      });

      fileData = { type: "xlsx", sheets };
    }

    else {
      fileData = { type: "unknown", size: buffer.length };
    }

    res.json(fileData);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(8080);
