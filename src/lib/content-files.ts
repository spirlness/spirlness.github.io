import fs from "fs";
import path from "path";

export function readContentFile(directory: string, filename: string): string {
  if (path.basename(filename) !== filename || filename === "." || filename === "..") {
    throw new Error(`Invalid content filename: "${filename}"`);
  }

  const filePath = path.join(directory, filename);
  if (!fs.lstatSync(filePath).isFile()) {
    throw new Error(`Content file must be a regular file: "${filename}"`);
  }
  if (path.dirname(fs.realpathSync(filePath)) !== fs.realpathSync(directory)) {
    throw new Error(`Content file escapes its directory: "${filename}"`);
  }

  return fs.readFileSync(filePath, "utf8");
}
