import { AIModel } from "../models/AIModel";
import { ModelCapabilities } from "../models/ModelCapabilities";
import { ProviderType } from "../types/ProviderType";
import { MODEL_REGISTRY } from "./ModelRegistry";

export class ModelRegistryService {

    static getAllModels(): AIModel[] {
        return MODEL_REGISTRY;
    }

    static getEnabledModels(): AIModel[] {
        return MODEL_REGISTRY.filter(model => model.enabled);
    }

    static getModelById(id: string): AIModel | undefined {
        return MODEL_REGISTRY.find(model => model.id === id);
    }

    static getModelsByProvider(provider: ProviderType): AIModel[] {
        return MODEL_REGISTRY.filter(
            model => model.provider === provider
        );
    }

    static getModelsByCapability(
        capability: keyof ModelCapabilities
    ): AIModel[] {

        return MODEL_REGISTRY.filter(
            model => model.capabilities[capability]
        );
    }
}