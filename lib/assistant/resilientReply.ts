/** No database/provider imports: import failures must also degrade to local reference.
 * No retries, races or background paid work are started here.
 */
export async function resilientReply<T>(remote: () => Promise<T>, reference: () => T): Promise<T> {
  try {
    return await remote();
  } catch {
    return reference();
  }
}
