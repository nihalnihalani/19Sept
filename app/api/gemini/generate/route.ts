import { geminiGenerate } from "../../../api";

export async function POST(req: Request) {
  return geminiGenerate(req);
}
