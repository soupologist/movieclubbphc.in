import dotenv from "dotenv";
dotenv.config();

import dbConnect from "@/lib/dbConnect";
import Film from "@/models/Film";

// Define recursive type for deepClean-compatible data
type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject extends Record<string, JSONValue> {}
interface JSONArray extends Array<JSONValue> {}

async function getFilm() {
  await dbConnect();

  const film = await Film.findOne({ id: "our-narrow-slice" }).lean();

  if (!film) {
    console.log("Film not found");
    process.exit();
  }

  function deepClean(obj: unknown): JSONValue {
    if (Array.isArray(obj)) {
      return obj.map(deepClean) as JSONArray;
    } else if (obj && typeof obj === "object") {
      const cleaned: JSONObject = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== "_id" && key !== "__v") {
          cleaned[key] = deepClean(value);
        }
      }
      return cleaned;
    }
    return obj as JSONValue;
  }

  const cleaned = deepClean(film);

  function formatValue(val: JSONValue, indent = 2): string {
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
    } else if (val && typeof val === "object") {
      return formatObject(val as JSONObject, indent);
    }
    return "null";
  }

  function formatObject(obj: JSONObject, indent = 2): string {
    const space = " ".repeat(indent);
    const inner = Object.entries(obj)
      .map(([k, v]) => `${space}${k}: ${formatValue(v, indent + 2)}`)
      .join(",\n");
    return `{\n${inner}\n${" ".repeat(indent - 2)}}`;
  }

  const formatted =
    "{\n" +
    Object.entries(cleaned as JSONObject)
      .map(([k, v]) => `  ${k}: ${formatValue(v, 4)}`)
      .join(",\n") +
    "\n}";

  console.log(formatted);
  process.exit();
}

getFilm();
