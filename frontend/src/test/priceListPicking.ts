import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export async function pickFromPriceList(
  user: UserEvent,
  picker: 'Add service' | 'Add medication',
  itemName: string,
): Promise<void> {
  await user.click(screen.getByRole('button', { name: picker }))
  await user.click(await screen.findByRole('option', { name: new RegExp(`^${itemName}`) }))
}
