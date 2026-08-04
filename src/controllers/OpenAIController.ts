import { ModelRegistry } from "../orchestrator/ModelRegistry";
import { byokContainer } from "../integrations/byok/ByokContainer";
import { ProviderCredentialResolver } from "../integrations/byok/ProviderCredentialResolver";
import { ProviderCredentialsService } from "../byok/services/ProviderCredentialsService";
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

import {
    providerManager,
    smartRouter,
} from "../container/AppContainer";

export class OpenAIController {
    static async chatCompletions(
        req: Request,
        res: Response
    ): Promise<void> {
        console.log("🔥 STEP 1 - Controller reached");
        console.log("🔥 CONTROLLER REACHED");
        console.log("🔥 STEP 1 - Controller entered");

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

            // Non-streaming path
            const routingRequest: RoutingRequest =
                OpenAIRequestConverter.toRoutingRequest(openaiRequest);

            console.log("🔥 BYOK CHECKPOINT 1");

            // ------------------------------------------------------------
            // Temporary BYOK integration (development)
            // ------------------------------------------------------------

            const provider = ModelRegistry.getProvider(
                routingRequest.model!
            );

            if (provider !== undefined) {
                const credential =
                    await byokContainer.resolver.resolve(
                        "test-user",
                        provider!
                    );

                routingRequest.credentialContext = credential;

                console.log("🔥 BYOK CHECKPOINT 2", credential);

                console.log("[BYOK DEBUG]", {
                    foundCredential: credential !== undefined,
                    userId: "test-user",
                    provider,
                    routingCredential: routingRequest.credentialContext,
                });
            }

            console.log(
                "🔥 BYOK CHECKPOINT 3",
                routingRequest.credentialContext
            );

            console.log(
                `[OpenAIController.chatCompletions] After converter, routingRequest.model: ${routingRequest.model}`
            );

            const routingResponse: RoutingResponse =
                await smartRouter.route(routingRequest);

            console.log(
                "🔥 BYOK CHECKPOINT 4",
                routingRequest.credentialContext
            );

            console.log(
                `[OpenAIController.chatCompletions] After smartRouter.route, response.model: ${routingResponse.model}`
            );

            const openaiResponse: OpenAIChatResponse =
                OpenAIResponseConverter.toOpenAIResponse(
                    routingResponse,
                    openaiRequest.model
                );

            console.log(
                `[OpenAIController.chatCompletions] Final response model: ${openaiResponse.model}`
            );

            res.status(200).json(openaiResponse);
        } catch (error: any) {
            console.error("========================================");
            console.error("🔥 RAW CONTROLLER ERROR");
            console.error(error);

            if (error instanceof Error) {
                console.error("MESSAGE:", error.message);
                console.error("STACK:");
                console.error(error.stack);
            }

            if (error?.response) {
                console.error("HTTP STATUS:", error.response.status);
                console.error("HTTP DATA:", error.response.data);
            }

            if (error?.cause) {
                console.error("CAUSE:", error.cause);
            }

            console.error("========================================");

            res.status(500).json({
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : String(error),
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

        // ------------------------------------------------------------
        // Temporary BYOK integration (development)
        // ------------------------------------------------------------

        const provider = ModelRegistry.getProvider(
            routingRequest.model!
        );

        if (provider !== undefined) {
            const credential =
                await byokContainer.resolver.resolve(
                    "test-user",
                    provider
                );

            routingRequest.credentialContext = credential;
        }

        console.log(`[OpenAIController.handleStreamingChatCompletions] After converter, routingRequest.model: ${routingRequest.model}`);
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
        // ...
        const allModelsByProvider = await providerManager.getAllModels();

        console.log("========== AVAILABLE MODELS ==========");
        console.dir(allModelsByProvider, { depth: null });
        console.log("======================================");

        const dataArray = [];

        for (const [providerName, models] of Object.entries(allModelsByProvider)) {

            console.log(
                `Provider ${providerName}:`,
                models.map(m => m.id)
            );

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
            data: dataArray,
        });

    } catch (error: unknown) {
        console.error("OpenAI Models Error:", error);

        const message = error instanceof Error ? error.message : String(error) || "Internal server error";

        res.status(500).json({
            error: {
                message,
                type: "internal_error",
                code: "internal_error",
            },
        });
    }
}
}