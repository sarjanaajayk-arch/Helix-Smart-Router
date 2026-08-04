import { Request, Response } from "express";




import { TaskType } from "../types/TaskType";
import { smartRouter } from "../container/AppContainer";
export class StreamingController {
  static async stream(
    req: Request,
    res: Response
  ): Promise<void> {
    const prompt =
      (req.query.prompt as string) ??
      "Hello from Helix";

   

    res.status(200);

    res.setHeader(
      "Content-Type",
      "text/event-stream; charset=utf-8"
    );
    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );
    res.setHeader(
      "Connection",
      "keep-alive"
    );
    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    res.write(
      "event: ready\ndata: connected\n\n"
    );

    let clientDisconnected = false;

    req.on("close", () => {
      clientDisconnected = true;
    });

    try {
      const stream = smartRouter.routeStream({
        prompt,
        taskType: TaskType.CHAT,
      });

      for await (const chunk of stream) {
        if (clientDisconnected) {
          break;
        }

        res.write(`data: ${chunk}\n\n`);
      }

      if (!clientDisconnected) {
        res.write(
          "event: end\ndata: done\n\n"
        );
      }
    } catch (error) {
      if (!clientDisconnected) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown streaming error";

        res.write(
          `event: error\ndata: ${message}\n\n`
        );
      }
    } finally {
      if (!clientDisconnected) {
        res.end();
      }
    }
  }
}