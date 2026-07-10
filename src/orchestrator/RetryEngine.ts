export class RetryEngine {

    public static async execute<T>(
        operation: () => Promise<T>,
        retries: number = 3,
        delay: number = 1000
    ): Promise<T> {

        let lastError: unknown;

        for (let attempt = 1; attempt <= retries; attempt++) {

            try {
                return await operation();
            } catch (error) {

                lastError = error;

                if (attempt < retries) {

                    await new Promise(resolve =>
                        setTimeout(resolve, delay)
                    );

                }

            }

        }

        throw lastError;

    }

}