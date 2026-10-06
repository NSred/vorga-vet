import type { Appointment } from '../types'

export interface PlacedBlock {
  appointment: Appointment
  row: number
  span: number
}

export interface PackedLanes<T extends PlacedBlock> {
  blocks: (T & { lane: number })[]
  laneCount: number
  busyRows: Set<number>
}

export function packLanes<T extends PlacedBlock>(placed: T[]): PackedLanes<T> {
  const sorted = [...placed].sort(
    (a, b) => a.row - b.row || a.appointment.startsAt.localeCompare(b.appointment.startsAt),
  )

  const laneEnds: number[] = []
  const busyRows = new Set<number>()
  const blocks = sorted.map((block) => {
    let lane = laneEnds.findIndex((end) => end <= block.row)
    if (lane < 0) lane = laneEnds.length
    laneEnds[lane] = block.row + block.span
    for (let row = block.row; row < block.row + block.span; row += 1) busyRows.add(row)
    return { ...block, lane }
  })

  return { blocks, laneCount: Math.max(1, laneEnds.length), busyRows }
}
