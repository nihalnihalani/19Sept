import { veoOperation } from "../../../api";

export async function POST(req: Request) {
  return veoOperation(req);
}
