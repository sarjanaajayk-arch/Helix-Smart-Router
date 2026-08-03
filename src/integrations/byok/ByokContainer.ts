import { PostgreSQLProviderCredentialRepository } from "../../byok/repositories/PostgreSQLProviderCredentialRepository";
import { ProviderCredentialRepository } from "../../byok/repositories/ProviderCredentialRepository";
import { CredentialEncryptionService } from "../../byok/services/CredentialEncryptionService";
import { ProviderCredentialValidator } from "../../byok/validators/ProviderCredentialValidator";
import { ProviderConnectionTester } from "../../byok/services/ProviderConnectionTester";
import { ProviderCredentialsService } from "../../byok/services/ProviderCredentialsService";
import { ProviderCredentialResolver } from "./ProviderCredentialResolver";

const encryptionSecret =
    process.env.BYOK_ENCRYPTION_SECRET ??
    process.env.HELIX_ENCRYPTION_SECRET ??
    "helix-development-secret";

const repository = new PostgreSQLProviderCredentialRepository();

const encryptionService =
    new CredentialEncryptionService(encryptionSecret);

const validator =
    new ProviderCredentialValidator();

const connectionTester =
    new ProviderConnectionTester();

const credentialsService =
    new ProviderCredentialsService(
        repository,
        encryptionService,
        validator,
        connectionTester
    );

export const byokContainer = {
    repository,
    encryptionService,
    validator,
    connectionTester,
    credentialsService,
    resolver: new ProviderCredentialResolver(
        credentialsService
    ),
};