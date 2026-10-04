import type {
  Attachment,
  AttachmentDto,
  AttachmentKind,
  Examination,
  ExaminationDto,
} from '../types'

const KINDS: Record<number, AttachmentKind> = {
  0: 'xray',
  1: 'ultrasound',
}

function optional<T>(value: T | null): T | undefined {
  return value ?? undefined
}

export function attachmentKindFromApi(value: number): AttachmentKind {
  const kind = KINDS[value]
  if (!kind) throw new Error(`Unknown attachment kind: ${value}`)
  return kind
}

export function toAttachment(dto: AttachmentDto): Attachment {
  return {
    id: dto.id,
    kind: attachmentKindFromApi(dto.kind),
    fileName: dto.fileName,
    contentType: dto.contentType,
    sizeBytes: dto.sizeBytes,
    uploadedAt: dto.uploadedAt,
  }
}

export function toExamination(dto: ExaminationDto): Examination {
  return {
    id: dto.id,
    patientId: dto.patientId,
    patientName: optional(dto.patientName),
    appointmentId: optional(dto.appointmentId),
    performedByFirstName: dto.performedByFirstName,
    performedByLastName: dto.performedByLastName,
    startedAt: dto.startedAt,
    endedAt: optional(dto.endedAt),
    anamnesis: optional(dto.anamnesis),
    diagnosis: optional(dto.diagnosis),
    therapy: optional(dto.therapy),
    cost: optional(dto.cost),
    isPaid: dto.isPaid,
    paidAt: optional(dto.paidAt),
    createdAt: dto.createdAt,
    attachments: dto.attachments.map(toAttachment),
  }
}

const KINDS_TO_API = Object.fromEntries(
  Object.entries(KINDS).map(([value, kind]) => [kind, Number(value)]),
) as Record<AttachmentKind, number>

export function attachmentKindToApi(kind: AttachmentKind): number {
  return KINDS_TO_API[kind]
}
