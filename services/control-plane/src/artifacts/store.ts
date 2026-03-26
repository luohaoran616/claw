import fs from "node:fs/promises";
import path from "node:path";

export interface WrittenArtifact {
  path: string;
  sizeBytes: number;
}

export class ArtifactWriter {
  constructor(private readonly rootDir: string) {}

  async writeJsonArtifact(args: {
    handoffId: string;
    taskRunId: string | null;
    fileName: string;
    payload: unknown;
  }): Promise<WrittenArtifact> {
    const dir = args.taskRunId
      ? path.join(this.rootDir, args.handoffId, args.taskRunId)
      : path.join(this.rootDir, args.handoffId);

    await fs.mkdir(dir, { recursive: true });
    const outputPath = path.join(dir, args.fileName);
    const body = `${JSON.stringify(args.payload, null, 2)}\n`;
    await fs.writeFile(outputPath, body, "utf8");
    const stats = await fs.stat(outputPath);

    return {
      path: outputPath,
      sizeBytes: Number(stats.size)
    };
  }
}
