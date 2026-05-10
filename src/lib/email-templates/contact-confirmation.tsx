import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Din Webbpartner'

interface Props {
  name?: string
  message?: string
}

const ContactConfirmationEmail = ({ name, message }: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Tack för din förfrågan till {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{name ? `Tack ${name}!` : 'Tack för din förfrågan!'}</Heading>
        <Text style={text}>
          Vi har tagit emot ditt meddelande och återkommer inom 24 timmar (vardagar) med
          förslag, prisidé och tidsplan — helt kostnadsfritt och utan förpliktelser.
        </Text>
        {message ? (
          <>
            <Text style={label}>Ditt meddelande:</Text>
            <Text style={quote}>{message}</Text>
          </>
        ) : null}
        <Text style={text}>
          Under tiden — har du frågor är du varmt välkommen att svara direkt på det här mailet.
        </Text>
        <Text style={footer}>Med vänliga hälsningar,<br />{SITE_NAME} — Stockholm</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'Tack för din förfrågan — vi återkommer inom 24 timmar',
  displayName: 'Bekräftelse till kund',
  previewData: { name: 'Anna', message: 'Jag behöver en hemsida för min restaurang.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 18px' }
const label = { fontSize: '13px', color: '#64748b', fontWeight: 600, margin: '20px 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const quote = { fontSize: '14px', color: '#0f172a', lineHeight: '1.6', margin: '0 0 22px', padding: '14px 16px', borderLeft: '3px solid #2563eb', backgroundColor: '#f8fafc', borderRadius: '4px', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '13px', color: '#64748b', margin: '32px 0 0' }
