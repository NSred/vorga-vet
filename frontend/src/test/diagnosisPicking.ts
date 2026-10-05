import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export async function typeDiagnosis(user: UserEvent, text: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Diagnosis' }))
  await user.type(screen.getByLabelText('Search Diagnosis'), text)
  await user.click(await screen.findByRole('button', { name: `＋ Create diagnosis "${text}"` }))
  const dialog = await screen.findByRole('dialog', { name: 'New diagnosis' })
  await user.click(within(dialog).getByRole('button', { name: 'Use without adding' }))
}
