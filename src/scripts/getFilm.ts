import dotenv from "dotenv";
dotenv.config();

import dbConnect from "@/lib/dbConnect";
import Film from "@/models/Film";

async function getFilm() {
  await dbConnect();

  const film = await Film.findOne({ id: "our-narrow-slice" }).lean();

  if (!film) {
    console.log("Film not found");
    process.exit();
  }

  function deepClean(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(deepClean);
    } else if (obj && typeof obj === "object") {
      const cleaned: Record<string, any> = {};
      for (const key in obj) {
        if (key !== "_id" && key !== "__v") {
          cleaned[key] = deepClean(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  }

  const cleaned = deepClean(film);

  function formatValue(val: any, indent = 2): string {
    const space = " ".repeat(indent);
    if (typeof val === "string") {
      return `"${val}"`;
    } else if (typeof val === "number" || typeof val === "boolean") {
      return String(val);
    } else if (Array.isArray(val)) {
      if (val.length === 0) return "[]";
      const isSimple = val.every((v) => typeof v === "string" || typeof v === "number");
      if (isSimple) {
        return "[\n" + val.map((v) => `${space.repeat(1)}${formatValue(v, indent + 2)},`).join("\n") + `\n${space}]`;
      } else {
        return "[\n" + val.map((v) => formatValue(v, indent + 2)).join(",\n") + `\n${space}]`;
      }
    } else if (typeof val === "object" && val !== null) {
      return formatObject(val, indent);
    }
    return "null";
  }

  function formatObject(obj: any, indent = 2): string {
    const space = " ".repeat(indent);
    const inner = Object.entries(obj)
      .map(([k, v]) => `${space}${k}: ${formatValue(v, indent + 2)}`)
      .join(",\n");
    return `{\n${inner}\n${" ".repeat(indent - 2)}}`;
  }

  const formatted =
    "{\n" +
    Object.entries(cleaned)
      .map(([k, v]) => `  ${k}: ${formatValue(v, 4)}`)
      .join(",\n") +
    "\n}";

  console.log(formatted);
  process.exit();
}

getFilm();
