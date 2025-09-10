import { geminiEdit } from "../../../api";

export async function POST(req: Request) {
  return geminiEdit(req);
}