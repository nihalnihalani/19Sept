import { imagenGenerate } from "../../../api";

export async function POST(req: Request) {
  return imagenGenerate(req);
}
