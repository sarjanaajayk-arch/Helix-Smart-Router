import { ProviderManager } from "../providers/ProviderManager";
import { SmartRouter } from "../orchestrator/SmartRouter";

export const providerManager = new ProviderManager();
export const smartRouter = new SmartRouter(providerManager);