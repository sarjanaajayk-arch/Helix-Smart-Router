import { ProviderCredentialModel } from "../models/ProviderCredentialModel";
import { ProviderCredentialRepository } from "../repositories/ProviderCredentialRepository";
import { CredentialEncryptionService } from "./CredentialEncryptionService";
import { ProviderConnectionTester } from "./ProviderConnectionTester";
import { ProviderCredentialValidator } from "../validators/ProviderCredentialValidator";

import {
    CreateProviderCredentialRequest,
    ProviderCredentialSummary,
    TestConnectionResult,
    UpdateProviderCredentialRequest,
    CredentialStatus,
} from "../types/ProviderCredentialTypes";

export class ProviderCredentialsService {
    constructor(
        private readonly repository: ProviderCredentialRepository,
        private readonly encryptionService: CredentialEncryptionService,
        private readonly validator: ProviderCredentialValidator,
        private readonly connectionTester: ProviderConnectionTester
    ) {}

    public async createCredential(
        userId: string,
        request: CreateProviderCredentialRequest
    ): Promise<ProviderCredentialModel> {

        const errors = this.validator.validateCreate(request);

        if (errors.length > 0) {
            throw new Error(errors.join(" "));
        }

        const exists = await this.repository.exists(
            userId,
            request.provider,
            request.displayName
        );

        if (exists) {
            throw new Error(
                "A credential with this display name already exists."
            );
        }

        const encryptedCredential =
            this.encryptionService.encryptCredential(request.credential);

        return this.repository.create({
            userId,
            provider: request.provider,
            authType: request.authType,
            displayName: request.displayName,
            credential: encryptedCredential,
            status: CredentialStatus.INACTIVE,
            metadata: {},
        });
    }

    public async updateCredential(
        id: string,
        request: UpdateProviderCredentialRequest
    ): Promise<ProviderCredentialModel | null> {

        const errors = this.validator.validateUpdate(request);

        if (errors.length > 0) {
            throw new Error(errors.join(" "));
        }

        const updates: Partial<ProviderCredentialModel> = {};

        if (request.displayName !== undefined) {
            updates.displayName = request.displayName;
        }

        if (request.credential !== undefined) {
            updates.credential =
                this.encryptionService.encryptCredential(
                    request.credential
                );
        }

        if (request.status !== undefined) {
            updates.status = request.status;
        }

        return this.repository.update(id, updates);
    }

    public async deleteCredential(
        id: string
    ): Promise<boolean> {
        return this.repository.delete(id);
    }

    public async getCredential(
        id: string
    ): Promise<ProviderCredentialModel | null> {
        return this.repository.findById(id);
    }

    public async listCredentials(
        userId: string
    ): Promise<ProviderCredentialSummary[]> {

        const credentials =
            await this.repository.findByUserId(userId);

        return credentials.map((credential) => ({
            id: credential.id,
            userId: credential.userId,
            provider: credential.provider,
            authType: credential.authType,
            displayName: credential.displayName,
            status: credential.status,
            createdAt: credential.createdAt,
            updatedAt: credential.updatedAt,
            lastTestedAt: credential.lastTestedAt,
        }));
    }

    /**
     * Returns the active credential including the encrypted secret.
     * This is used internally by the Smart Router / BYOK integration.
     */
    public async getActiveCredential(
    userId: string,
    provider: CreateProviderCredentialRequest["provider"]
): Promise<ProviderCredentialModel | null> {

    const credentials =
        await this.repository.findByProvider(
            userId,
            provider
        );

    const credential = credentials.find(
        c => c.status === CredentialStatus.ACTIVE
    );

    if (!credential) {
        return null;
    }

    return {
        ...credential,
        credential: this.encryptionService.decryptCredential(
            credential.credential
        ),
    };
}

    public async testCredential(
        id: string
    ): Promise<TestConnectionResult> {

        const credential =
            await this.repository.findById(id);

        if (!credential) {
            throw new Error("Credential not found.");
        }

        const decrypted =
            this.encryptionService.decryptCredential(
                credential.credential
            );

        const result =
            await this.connectionTester.testConnection(
                credential.provider,
                decrypted
            );

        await this.repository.updateStatus(
            id,
            result.status
        );

        await this.repository.update(id, {
            lastTestedAt: new Date(),
        });

        return result;
    }
}