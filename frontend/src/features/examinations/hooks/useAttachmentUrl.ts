import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { examinationKeys } from '../api/examinationKeys'
import { getAttachmentBlob } from '../api/examinationsApi'

export interface AttachmentUrl {
  url: string | null
  isPending: boolean
  isError: boolean
}

export function useAttachmentUrl(attachmentId: string | null): AttachmentUrl {
  const { data, isPending, isError } = useQuery({
    queryKey: examinationKeys.attachment(attachmentId ?? ''),
    queryFn: () => getAttachmentBlob(attachmentId ?? ''),
    enabled: attachmentId !== null,
    staleTime: Infinity,
  })

  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!data) {
      setUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(data)
    setUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
      setUrl(null)
    }
  }, [data])

  return { url, isPending: attachmentId !== null && isPending, isError }
}
