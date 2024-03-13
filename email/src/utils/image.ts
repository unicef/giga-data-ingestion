import fs from "fs";
import path from "path";

export function getBase64Image(imagePath: string): string {
  const absolutePath = path.join(__dirname, imagePath);
  const base64Image = fs.readFileSync(absolutePath).toString("base64");
  return base64Image;
}
