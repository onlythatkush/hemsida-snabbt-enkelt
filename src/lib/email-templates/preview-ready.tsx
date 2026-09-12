import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Din Webbpartner'

interface Props {
  name?: string
  company?: string
  previewUrl?: string
  reference?: string
}

const PreviewReadyEmail = ({ name, company, previewUrl, reference }: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din hemsida är redo för förhandsvisning</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{SITE_NAME}</Text>
        <Heading style={h1}>Din hemsida är redo att titta på</Heading>
        <Text style={text}>
          {name ? `Hej ${name}!` : 'Hej!'} Vi har byggt ett första förslag på hemsidan
          {company ? ` för ${company}` : ''}. Nu kan du gå in och se den i lugn och ro —
          på både mobil och dator.
        </Text>

        {previewUrl ? (
          <Section style={ctaWrap}>
            <Button style={button} href={previewUrl}>Öppna din förhandsvisning</Button>
            <Text style={small}>
              Fungerar inte knappen? Kopiera länken:<br />
              <Link href={previewUrl} style={link}>{previewUrl}</Link>
            </Text>
          </Section>
        ) : null}

        <Hr style={hr} />
        <Text style={text}>
          <strong>Vad händer nu?</strong><br />
          Titta igenom sidan och svara på det här mailet med dina tankar — text, bilder,
          färger eller struktur. Vi justerar tills du är nöjd innan sidan publiceras.
        </Text>
        {reference ? <Text style={meta}>Referens: {reference}</Text> : null}
        <Text style={footer}>
          Med vänliga hälsningar,<br />{SITE_NAME} — Stockholm
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PreviewReadyEmail,
  subject: 'Din hemsida är redo för förhandsvisning',
  displayName: 'Preview redo',
  previewData: {
    name: 'Anna Andersson',
    company: 'Rörjour Bohus VVS',
    previewUrl: 'https://dinwebbpartner.com/kund-preview/ORD-EXEMPEL?token=demo',
    reference: 'ORD-EXEMPEL',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#b4762a', margin: '0 0 12px' }
const h1 = { fontSize: '26px', lineHeight: '1.25', color: '#141414', margin: '0 0 16px' }
const text = { fontSize: '16px', lineHeight: '1.6', color: '#3a3a3a', margin: '0 0 16px' }
const ctaWrap = { margin: '28px 0' }
const button = {
  backgroundColor: '#141414', color: '#ffffff', borderRadius: '10px',
  padding: '14px 26px', fontSize: '16px', fontWeight: 600, textDecoration: 'none',
  display: 'inline-block',
}
const small = { fontSize: '13px', lineHeight: '1.5', color: '#6b6b6b', margin: '16px 0 0', wordBreak: 'break-all' as const }
const link = { color: '#b4762a' }
const hr = { borderColor: '#e8e8e8', margin: '28px 0' }
const meta = { fontSize: '13px', color: '#8a8a8a', margin: '0 0 16px' }
const footer = { fontSize: '14px', lineHeight: '1.6', color: '#6b6b6b', margin: '24px 0 0' }
