import {
    AuthenticationType,
    CreateProviderCredentialRequest,
    ProviderType,
    UpdateProviderCredentialRequest
} from '../types/ProviderCredentialTypes';

export class ProviderCredentialValidator {

    public validateCreate(
        request: CreateProviderCredentialRequest
    ): string[] {
        const errors: string[] = [];

        if (!request.provider) {
            errors.push('Provider is required.');
        } else if (!Object.values(ProviderType).includes(request.provider)) {
            errors.push('Invalid provider.');
        }

        if (!request.authType) {
            errors.push('Authentication type is required.');
        } else if (!Object.values(AuthenticationType).includes(request.authType)) {
            errors.push('Invalid authentication type.');
        }

        if (!request.displayName || request.displayName.trim().length === 0) {
            errors.push('Display name is required.');
        } else if (request.displayName.length > 100) {
            errors.push('Display name cannot exceed 100 characters.');
        }

        if (!request.credential || request.credential.trim().length === 0) {
            errors.push('Credential is required.');
        } else if (request.credential.length < 10) {
            errors.push('Credential appears to be invalid.');
        }

        return errors;
    }

    public validateUpdate(
        request: UpdateProviderCredentialRequest
    ): string[] {
        const errors: string[] = [];

        if (
            request.displayName !== undefined &&
            request.displayName.trim().length === 0
        ) {
            errors.push('Display name cannot be empty.');
        }

        if (
            request.displayName &&
            request.displayName.length > 100
        ) {
            errors.push('Display name cannot exceed 100 characters.');
        }

        if (
            request.credential !== undefined &&
            request.credential.trim().length > 0 &&
            request.credential.length < 10
        ) {
            errors.push('Credential appears to be invalid.');
        }

        return errors;
    }

    public isValidProvider(provider: string): provider is ProviderType {
        return Object.values(ProviderType).includes(provider as ProviderType);
    }

    public isValidAuthenticationType(
        authType: string
    ): authType is AuthenticationType {
        return Object.values(AuthenticationType).includes(
            authType as AuthenticationType
        );
    }
}