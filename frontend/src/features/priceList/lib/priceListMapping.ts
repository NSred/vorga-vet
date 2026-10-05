import type {
  PriceItemFormValues,
  PriceListItem,
  PriceListItemDto,
  PriceListKind,
  PriceListPage,
  PriceListPageDto,
  PriceListStatus,
  PriceListWriteRequest,
} from '../types'
import { parsePrice } from './price'

export const DEFAULT_VALIDITY_DAYS = 365

const STATUS_TO_API: Record<PriceListStatus, number> = { active: 0, all: 1, retired: 2 }

export function statusToApi(status: PriceListStatus): number {
  return STATUS_TO_API[status]
}

export function toPriceListItem(kind: PriceListKind, dto: PriceListItemDto): PriceListItem {
  const item: PriceListItem = {
    id: dto.id,
    kind,
    name: dto.name,
    price: dto.price,
    isActive: dto.isActive,
  }
  if (dto.unit) item.unit = dto.unit
  if (dto.isVaccine) {
    item.vaccine = {
      isRabies: Boolean(dto.isRabies),
      validityDays: dto.validityDays ?? DEFAULT_VALIDITY_DAYS,
    }
  }
  return item
}

export function toPriceListPage(kind: PriceListKind, dto: PriceListPageDto): PriceListPage {
  return {
    items: dto.items.map((item) => toPriceListItem(kind, item)),
    totalCount: dto.totalCount,
    page: dto.page,
    pageSize: dto.pageSize,
  }
}

export function emptyFormValues(): PriceItemFormValues {
  return { name: '', price: '', unit: '', isVaccine: false, isRabies: false, validityDays: '365' }
}

export function formValuesOf(item: PriceListItem): PriceItemFormValues {
  return {
    name: item.name,
    price: String(item.price).replace('.', ','),
    unit: item.unit ?? '',
    isVaccine: Boolean(item.vaccine),
    isRabies: Boolean(item.vaccine?.isRabies),
    validityDays: String(item.vaccine?.validityDays ?? DEFAULT_VALIDITY_DAYS),
  }
}

export function toWriteRequest(
  kind: PriceListKind,
  values: PriceItemFormValues,
): PriceListWriteRequest {
  const request: PriceListWriteRequest = {
    name: values.name.trim(),
    price: parsePrice(values.price) ?? Number.NaN,
  }
  if (kind === 'medication') {
    request.unit = values.unit.trim() || null
    request.isVaccine = Boolean(values.isVaccine)
    request.isRabies = Boolean(values.isVaccine && values.isRabies)
    request.validityDays = values.isVaccine ? Number(values.validityDays) : null
  }
  return request
}
