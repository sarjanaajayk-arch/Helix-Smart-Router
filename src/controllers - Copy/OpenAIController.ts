import { Request, Response } from "express";
import { ProviderManager } from "../providers/ProviderManager";
import { SmartRouter } from "../orchestrator/SmartRouter";
import { TaskType } from "../types/TaskType";
import { OpenAIRequestConverter } from "../converters/OpenAIRequestConverter";
import { OpenAIResponseConverter } from "../converters/OpenAIResponseConverter";
import { OpenAIChatRequest } from "../models/OpenAIChatRequest";
import { OpenAIChatResponse } from "../models/OpenAIChatResponse";
import { RoutingRequest } from "../models/RoutingRequest";
import { RoutingResponse } from "../models/RoutingResponse";

const providerManager = new ProviderManager();
const smartRouter = new SmartRouter(providerManager);

export class OpenAIController {
    static async chatCompletions(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const openaiRequest: OpenAIChatRequest = req.body;

            console.log(`[OpenAIController.chatCompletions] Incoming request.model: ${openaiRequest.model}`);

            if (!openaiRequest.model || !openaiRequest.messages) {
                res.status(400).json({
                    error: {
                        message: "Model and messages are required",
                        type: "invalid_request_error",
                        code: "invalid_request",
                    },
                });
                return;
            }

            // Handle streaming request
            if (openaiRequest.stream === true) {
                console.log(`[OpenAIController.chatCompletions] Streaming request, model: ${openaiRequest.model}`);
                await OpenAIController.handleStreamingChatCompletions(req, res, openaiRequest);
                return;
            }

            // Non-streaming path (existing logic)
            const routingRequest: RoutingRequest =
                OpenAIRequestConverter.toRoutingRequest(openaiRequest);

            console.log(`[OpenAIController.chatCompletions] After converter, routingRequest.model: ${routingRequest.model}`);

            const routingResponse: RoutingResponse = await smartRouter.route(
                routingRequest
            );

            console.log(`[OpenAIController.chatCompletions] After smartRouter.route, response.model: ${routingResponse.model}`);

            const openaiResponse: OpenAIChatResponse =
                OpenAIResponseConverter.toOpenAIResponse(
                    routingResponse,
                    openaiRequest.model
                );

            console.log(`[OpenAIController.chatCompletions] Final response model: ${openaiResponse.model}`);

            res.status(200).json(openaiResponse);
        } catch (error) {
            console.error("OpenAI Chat Completions Error:", error);

            if (error instanceof Error) {
                console.error(error.stack);
            }

            res.status(500).json({
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal server error",
                    type: "internal_error",
                    code: "internal_error",
                },
            });
        }
    }

    private static async handleStreamingChatCompletions(
        req: Request,
        res: Response,
        openaiRequest: OpenAIChatRequest
    ): Promise<void> {
        console.log(`[OpenAIController.handleStreamingChatCompletions] Incoming openaiRequest.model: ${openaiRequest.model}`);
        
        const routingRequest: RoutingRequest =
            OpenAIRequestConverter.toRoutingRequest(openaiRequest);

        console.log(`[OpenAIController.handleStreamingChatCompletions] After converter, routingRequest.model: ${routingRequest.model}`);
        // Ensure stream flag is set (though conversion may already set it to false)
        routingRequest.stream = true;

        const stream = smartRouter.routeStream(routingRequest);

        // Set SSE headers
        res.status(200);
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        if (typeof res.flushHeaders === "function") {
            res.flushHeaders();
        }

        let clientDisconnected = false;
        req.on("close", () => {
            clientDisconnected = true;
            console.log("[SSE] Client disconnected");
        });

        // Generate a random ID and timestamp for the chat completion chunk
        const chunkId = `chatcmpl-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;
        const created = Math.floor(Date.now() / 1000);
        const model = openaiRequest.model;

        try {
            console.log("[SSE] Starting to iterate stream from SmartRouter");
            for await (const chunk of stream) {
                if (clientDisconnected) {
                    console.log("[SSE] Client disconnected, breaking");
                    break;
                }

                console.log("[SSE] Received chunk from SmartRouter, length:", chunk.length);

                // Construct OpenAI-compatible chunk
                const openaiChunk = {
                    id: chunkId,
                    object: "chat.completion.chunk",
                    created: created,
                    model: model,
                    choices: [
                        {
                            index: 0,
                            delta: {
                                content: chunk,
                            },
                            finish_reason: null,
                        },
                    ],
                };

                console.log("[SSE] Writing chunk to response");
                res.write(`data: ${JSON.stringify(openaiChunk)}\n\n`);
            }

            if (!clientDisconnected) {
                // Send final chunk with finish_reason
                const finalChunk = {
                    id: chunkId,
                    object: "chat.completion.chunk",
                    created: created,
                    model: model,
                    choices: [
                        {
                            index: 0,
                            delta: {},
                            finish_reason: "stop",
                        },
                    ],
                };

                console.log("[SSE] Writing final chunk");
                res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
                // Send the [DONE] marker
                console.log("[SSE] Writing [DONE] marker");
                res.write("data: [DONE]\n\n");
                console.log("[SSE] Calling res.end()");
                res.end();
                console.log("[SSE] Response ended");
            } else {
                console.log("[SSE] Client was disconnected, not sending final chunks");
            }
        } catch (error) {
            if (!clientDisconnected) {
                console.error("[SSE] Streaming error:", error);
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown streaming error";
                // We'll just end with [DONE] on error as well
                console.log("[SSE] Writing [DONE] on error");
                res.write(`data: [DONE]\n\n`);
                console.log("[SSE] Calling res.end() on error");
                res.end();
            } else {
                console.log("[SSE] Client disconnected during error, not sending response");
            }
        }
    }
    static async listModels(req: Request, res: Response): Promise<void> {
        try {
            const allModelsByProvider = await providerManager.getAllModels();
            const dataArray = [];
            for (const [providerName, models] of Object.entries(allModelsByProvider)) {
                for (const model of models) {
                    dataArray.push({
                        id: model.id,
                        object: "model",
                        created: Math.floor(Date.now() / 1000),
                        owned_by: providerName,
                    });
                }
            }
            res.status(200).json({
                object: "list",
                data: dataArray
            });
        } catch (error) {
            console.error("OpenAI Models Error:", error);
            res.status(500).json({
                error: {
                    message: error instanceof Error ? error.message : "Internal server error",
                    type: "internal_error",
                    code: "internal_error",
                }
            });
        }
    }
}