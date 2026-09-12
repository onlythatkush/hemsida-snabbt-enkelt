// Every transactional email must carry an unsubscribe token, otherwise the
// email API rejects the message with 400 missing_unsubscribe.

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Returns a stable unsubscribe token for the given address, creating one on
 * first use. Uses a service-role Supabase client.
 */
export async function getUnsubscribeToken(supabase: any, email: string): Promise<string> {
  const normalized = email.toLowerCase()

  const { data: existing } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', normalized)
    .maybeSingle()

  if (existing?.token) return existing.token as string

  const token = generateToken()
  await supabase
    .from('email_unsubscribe_tokens')
    .upsert({ token, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })

  const { data: stored } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', normalized)
    .maybeSingle()

  if (!stored?.token) throw new Error('Failed to store unsubscribe token')
  return stored.token as string
}
