import { veoDownload } from "../../../api";

export async function POST(req: Request) {
  return veoDownload(req);
}
