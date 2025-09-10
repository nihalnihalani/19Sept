import { veoGenerate } from "../../../api";

export async function POST(req: Request) {
  return veoGenerate(req);
}
