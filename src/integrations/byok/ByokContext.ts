import { ProviderCredentialContext } from "../../providers/credentials/ProviderCredentialContext";

export interface ByokContext {
    /**
     * Authenticated user making the request.
     */
    userId: string;

    /**
     * Provider credentials resolved for this request.
     * Undefined means Helix should fall back to server credentials.
     */
    credential?: ProviderCredentialContext;
}