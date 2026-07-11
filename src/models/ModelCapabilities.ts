export interface ModelCapabilities {

    /* --------------------------------- */
    /* Core Language */
    /* --------------------------------- */

    supportsChat: boolean;

    supportsReasoning: boolean;

    supportsCoding: boolean;

    supportsVision: boolean;

    supportsStreaming: boolean;

    supportsFunctionCalling: boolean;

    supportsStructuredOutput: boolean;

    supportsEmbeddings: boolean;

    supportsImageGeneration: boolean;

    /* --------------------------------- */
    /* Future Capabilities (Optional) */
    /* --------------------------------- */

    supportsLongContext?: boolean;

    supportsOCR?: boolean;

    supportsDocumentQA?: boolean;

    supportsImageEditing?: boolean;

    supportsAudioInput?: boolean;

    supportsAudioGeneration?: boolean;

    supportsSpeechToText?: boolean;

    supportsTextToSpeech?: boolean;

    supportsVideoInput?: boolean;

    supportsVideoGeneration?: boolean;

    supportsToolCalling?: boolean;

    supportsReranking?: boolean;

    supportsRealtime?: boolean;
}