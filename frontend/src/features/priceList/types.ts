export type PriceListKind = 'service' | 'medication'

export type PriceListStatus = 'active' | 'all' | 'retired'

export interface PriceListItemDto {
  id: string
  name: string
  price: number
  unit?: string | null
  isVaccine?: boolean
  isRabies?: boolean
  validityDays?: number | null
  isActive: boolean
  createdAt: string
}

export interface PriceListPageDto {
  items: PriceListItemDto[]
  totalCount: number
  page: number
  pageSize: number
}

export interface PriceListQueryDto {
  search?: string
  status: number
  page: number
  pageSize: number
}

export interface PriceListWriteRequest {
  name: string
  price: number
  unit?: string | null
  isVaccine?: boolean
  isRabies?: boolean
  validityDays?: number | null
}

export interface PriceListItem {
  id: string
  kind: PriceListKind
  name: string
  price: number
  unit?: string
  vaccine?: VaccineInfo
  isActive: boolean
}

export interface VaccineInfo {
  isRabies: boolean
  validityDays: number
}

export interface PriceListPage {
  items: PriceListItem[]
  totalCount: number
  page: number
  pageSize: number
}

export interface PriceListFilters {
  search?: string
  status: PriceListStatus
}

export interface PriceItemFormValues {
  name: string
  price: string
  unit: string
  isVaccine: boolean
  isRabies: boolean
  validityDays: string
}

export type ChargeLineKind = 'service' | 'medication' | 'extra'

export interface ChargeLineDto {
  id: string
  kind: ChargeLineKind
  itemId?: string | null
  name: string
  unitPrice: number
  quantity: number
  dose?: string | null
  vaccine?: ChargeVaccineDto | null
}

export interface ChargeVaccineDto {
  isRabies: boolean
  batch: string | null
  dueOn: string
}

export interface ExaminationChargesDto {
  lines: ChargeLineDto[]
}

export interface ChargeLine {
  id: string
  kind: ChargeLineKind
  itemId?: string
  name: string
  unitPrice: number
  quantity: number
  dose?: string
  vaccine?: ChargeVaccine
}

export interface ChargeVaccine {
  isRabies: boolean
  batch?: string
  dueOn: string
}

export interface ChargeDraftVaccine {
  isRabies: boolean
  validityDays: number
  batch: string
  dueOn: string
}

export interface ChargeDraft {
  key: string
  kind: ChargeLineKind
  itemId?: string
  name: string
  unitPrice: string
  quantity: string
  dose: string
  vaccine?: ChargeDraftVaccine
}

export interface ChargeDraftErrors {
  name?: string
  unitPrice?: string
  quantity?: string
  dose?: string
  batch?: string
  dueOn?: string
}
