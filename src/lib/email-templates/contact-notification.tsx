import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  phone?: string
  company?: string
  message?: string
  source?: string
  extra?: Record<string, string | undefined>
}

const ContactNotificationEmail = ({ name, email, phone, company, message, source, extra }: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Ny förfrågan från {name || email || 'webbsida'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ny förfrågan från hemsidan</Heading>
        <Text style={meta}>{source || 'Kontaktformulär'}</Text>
        <Hr style={hr} />
        <Row label="Namn" value={name} />
        <Row label="E-post" value={email} />
        <Row label="Telefon" value={phone} />
        <Row label="Företag" value={company} />
        {extra && Object.entries(extra).map(([k, v]) =>
          v ? <Row key={k} label={k} value={v} /> : null
        )}
        {message ? (
          <>
            <Hr style={hr} />
            <Text style={label}>Meddelande</Text>
            <Text style={quote}>{message}</Text>
          </>
        ) : null}
      </Container>
    </Body>
  </Html>
)

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Text style={row}>
      <span style={rowLabel}>{label}: </span>
      <span style={rowValue}>{value}</span>
    </Text>
  ) : null

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Ny förfrågan: ${data.name || data.email || 'okänd avsändare'}`,
  displayName: 'Notis till admin',
  previewData: {
    name: 'Anna Andersson',
    email: 'anna@example.com',
    phone: '+46 70 123 45 67',
    company: 'Annas Restaurang',
    message: 'Jag behöver en ny hemsida.',
    source: 'Kontaktformulär',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }
const meta = { fontSize: '13px', color: '#64748b', margin: '0 0 8px' }
const hr = { borderColor: '#e2e8f0', margin: '16px 0' }
const row = { fontSize: '14px', color: '#0f172a', margin: '0 0 8px', lineHeight: '1.5' }
const rowLabel = { color: '#64748b', fontWeight: 600 }
const rowValue = { color: '#0f172a' }
const label = { fontSize: '13px', color: '#64748b', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const quote = { fontSize: '14px', color: '#0f172a', lineHeight: '1.6', margin: 0, padding: '14px 16px', borderLeft: '3px solid #2563eb', backgroundColor: '#f8fafc', borderRadius: '4px', whiteSpace: 'pre-wrap' as const }
