/**
 * JSON for a <script> tag (JSON-LD, embedded data). Text edited in the panel could contain «</script>»
 * and close the tag early; escaping «<» keeps it as data. JSON.parse reads it back unchanged.
 */
export const safeJson = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');
