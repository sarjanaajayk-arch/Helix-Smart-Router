require("dotenv").config();
const { ProviderManager } = require("./dist/providers/ProviderManager");
const { SmartRouter } = require("./dist/orchestrator/SmartRouter");
const { OpenAIRequestConverter } = require("./dist/converters/OpenAIRequestConverter");

async function testStreamFlow() {
    console.log("=== Testing streaming flow ===\n");
    
    const providerManager = new ProviderManager();
    const smartRouter = new SmartRouter(providerManager);
    
    const openaiRequest = {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Say hello in one word" }],
        stream: true,
    };
    
    console.log("1. Converting OpenAI request to RoutingRequest...");
    const routingRequest = OpenAIRequestConverter.toRoutingRequest(openaiRequest);
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