import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

import { template as contactConfirmation } from './contact-confirmation'
import { template as contactNotification } from './contact-notification'
import { template as previewReady } from './preview-ready'
import {
  approvalConfirmedTemplate,
  changeReceivedTemplate,
  questionAckTemplate,
  questionAnswerTemplate,
} from './hub-notice'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'contact-notification': contactNotification,
  'preview-ready': previewReady,
  'change-received': changeReceivedTemplate,
  'approval-confirmed': approvalConfirmedTemplate,
  'question-ack': questionAckTemplate,
  'question-answer': questionAnswerTemplate,
}
