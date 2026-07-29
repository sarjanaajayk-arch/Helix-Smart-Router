import { normalizeMaxTokens } from './src/utils/tokenNormalizer';
import { ProviderType } from './src/types/ProviderType';

// Test cases
console.log('Testing token normalization...\n');

// Test 1: Gemini provider with no client max_tokens (should use provider default)
console.log('Test 1 - Gemini, no client max_tokens:');
const result1 = normalizeMaxTokens(ProviderType.GEMINI, undefined, 8192);
console.log(`Result: ${result1}`); // Expected: 2048 (provider default, clamped to model max)
console.log();

// Test 2: Gemini provider with client max_tokens within limits
console.log('Test 2 - Gemini, client max_tokens=1000:');
const result2 = normalizeMaxTokens(ProviderType.GEMINI, 1000, 8192);
console.log(`Result: ${result2}`); // Expected: 1000
console.log();

// Test 3: Gemini provider with client max_tokens exceeding model limit
console.log('Test 3 - Gemini, client max_tokens=10000 (exceeds model limit 8192):');
const result3 = normalizeMaxTokens(ProviderType.GEMINI, 10000, 8192);
console.log(`Result: ${result3}`); // Expected: 8192 (clamped to model max)
console.log();

// Test 4: Gemini provider with invalid client max_tokens (negative)
console.log('Test 4 - Gemini, client max_tokens=-5 (invalid):');
const result4 = normalizeMaxTokens(ProviderType.GEMINI, -5, 8192);
console.log(`Result: ${result4}`); // Expected: 2048 (provider default, clamped to model max)
console.log();

// Test 5: OpenRouter provider with no client max_tokens (should return undefined)
console.log('Test 5 - OpenRouter, no client max_tokens:');
const result5 = normalizeMaxTokens(ProviderType.OPENROUTER, undefined, 4096);
console.log(`Result: ${result5}`); // Expected: undefined (provider decides)
console.log();

// Test 6: OpenRouter provider with client max_tokens (should respect client value)
console.log('Test 6 - OpenRouter, client max_tokens=2000:');
const result6 = normalizeMaxTokens(ProviderType.OPENROUTER, 2000, 4096);
console.log(`Result: ${result6}`); // Expected: 2000
console.log();

// Test 7: OpenRouter provider with client max_tokens exceeding model limit
console.log('Test 7 - OpenRouter, client max_tokens=10000 (exceeds model limit 4096):');
const result7 = normalizeMaxTokens(ProviderType.OPENROUTER, 10000, 4096);
console.log(`Result: ${result7}`); // Expected: 4096 (clamped to model max)
console.log();

// Test 8: Unknown provider with no client max_tokens (should use conservative default)
console.log('Test 8 - Unknown provider, no client max_tokens:');
const result8 = normalizeMaxTokens('unknown' as ProviderType, undefined, 8192);
console.log(`Result: ${result8}`); // Expected: 2048 (conservative default, clamped to model max)
console.log();

// Test 9: Unknown provider with client max_tokens
console.log('Test 9 - Unknown provider, client max_tokens=1500:');
const result9 = normalizeMaxTokens('unknown' as ProviderType, 1500, 8192);
console.log(`Result: ${result9}`); // Expected: 1500
console.log();

// Test 10: Very large client max_tokens
console.log('Test 10 - Gemini, client max_tokens=100000 (very large):');
const result10 = normalizeMaxTokens(ProviderType.GEMINI, 100000, 8192);
console.log(`Result: ${result10}`); // Expected: 8192 (clamped to model max)
console.log();

console.log('All tests completed.');