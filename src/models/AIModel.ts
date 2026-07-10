import { ProviderType } from "../types/ProviderType";
import { ModelCapabilities } from "./ModelCapabilities";

export interface AIModel {

    id: string;

    name: string;

    provider: ProviderType;

    contextWindow: number;

    maxOutputTokens: number;

    priority: number;

    temperature: number;

    enabled: boolean;

    inputPricePerMillionTokens: number;

    outputPricePerMillionTokens: number;

    capabilities: ModelCapabilities;
}