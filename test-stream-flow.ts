import { ProviderManager } from "./src/providers/ProviderManager";
import { SmartRouter } from "./src/orchestrator/SmartRouter";
import { TaskType } from "./src/types/TaskType";
import { OpenAIRequestConverter } from "./src/converters/OpenAIRequestConverter";
import { RoutingRequest } from "./src/models/RoutingRequest";
import { OpenAIChatRequest } from "./src/models/OpenAIChatRequest";

async function testStreamFlow() {
    console.log("=== Testing streaming flow ===\n");
    
    const providerManager = new ProviderManager();
    const smartRouter = new SmartRouter(providerManager);
    
    const openaiRequest: OpenAIChatRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Say hello in one word" }],
        stream: true,
    };
    
    console.log("1. Converting OpenAI request to RoutingRequest...");
    const routingRequest: RoutingRequest = OpenAIRequestConverter.toRoutingRequest(openaiRequest);
    routingRequest.stream = true;
    console.log("   routingRequest:", JSON.stringify(routingRequest, null, 2));
    
    console.log("\n2. Calling smartRouter.routeStream()...");
    const stream = smartRouter.routeStream(routingRequest);
    console.log("   Got stream generator");
    
    console.log("\n3. Iterating stream...");
    let chunkCount = 0;
    try {
        for await (const chunk of stream) {
            chunkCount++;
            console.log(`   Chunk ${chunkCount}:`, JSON.stringify(chunk));
            if (chunkCount >= 5) break;
        }
        console.log(`\n   Stream completed. Total chunks: ${chunkCount}`);
    } catch (error) {
        console.error("   Stream error:", error);
    }
    
    console.log("\n=== Test complete ===");
}

testStreamFlow().catch(console.error);