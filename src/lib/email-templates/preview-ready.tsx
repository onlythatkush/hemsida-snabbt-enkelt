import {
  Body, Column, Container, Head, Heading, Html, Link, Preview, Row, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Din Webbpartner'
const SITE_URL = 'https://dinwebbpartner.com'

// Brand tokens mirrored from the website design system (src/styles.css):
// ink charcoal, orange primary and gold glow, 16px radii, soft depth.
const INK = '#14100c'
const INK_SOFT = '#1d140d'
const ORANGE = '#f47600'
const GOLD = '#fab72a'
const TEXT = '#2b2a28'
const MUTED = '#6d6a66'
const BORDER = '#e8e4dd'
const PANEL = '#faf7f2'

interface Props {
  name?: string
  company?: string
  previewUrl?: string
  reference?: string
}

const PreviewReadyEmail = ({ name, company, previewUrl, reference }: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>
      {company ? `${company} — din nya hemsida är redo att titta på` : 'Din nya hemsida är redo att titta på'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Brand header — dark charcoal panel with gold hairline */}
        <Section style={header}>
          <Text style={brandMark}>{SITE_NAME}</Text>
          <Text style={brandTagline}>Hemsidor för små företag — Stockholm</Text>
        </Section>
        <Section style={goldRule}>
          <Text style={goldRuleText}>&nbsp;</Text>
        </Section>

        {/* Main card */}
        <Section style={card}>
          <Text style={eyebrow}>Förhandsvisning klar</Text>
          <Heading style={h1}>Din nya hemsida är redo att titta på</Heading>

          {company ? (
            <Section style={companyPanel}>
              <Text style={companyLabel}>Projekt</Text>
              <Text style={companyName}>{company}</Text>
              {reference ? <Text style={companyRef}>Referens {reference}</Text> : null}
            </Section>
          ) : null}

          <Text style={text}>
            {name ? `Hej ${name}!` : 'Hej!'} Vi har byggt ett första förslag
            {company ? ` på hemsidan för ${company}` : ' på din hemsida'}. Titta igenom den i lugn
            och ro — den fungerar lika bra i mobilen som på datorn.
          </Text>

          {previewUrl ? (
            <Section style={ctaWrap}>
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={ctaTable}>
                <tbody>
                  <tr>
                    <td align="center" bgcolor={ORANGE} style={ctaCell}>
                      <a href={previewUrl} style={ctaLink}>Se din nya hemsida</a>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Text style={small}>
                Fungerar inte knappen? Kopiera länken:<br />
                <Link href={previewUrl} style={link}>{previewUrl}</Link>
              </Text>
            </Section>
          ) : null}

          <Section style={stepsPanel}>
            <Text style={stepsTitle}>Vad händer nu?</Text>
            <Row>
              <Column style={stepNumCol}><Text style={stepNum}>1</Text></Column>
              <Column><Text style={stepText}>Titta igenom sidan på mobil och dator.</Text></Column>
            </Row>
            <Row>
              <Column style={stepNumCol}><Text style={stepNum}>2</Text></Column>
              <Column><Text style={stepText}>Svara på det här mailet med dina tankar om text, bilder och färger.</Text></Column>
            </Row>
            <Row>
              <Column style={stepNumCol}><Text style={stepNum}>3</Text></Column>
              <Column><Text style={stepText}>Vi justerar tills du är nöjd — sedan publicerar vi.</Text></Column>
            </Row>
          </Section>

          <Text style={signoff}>
            Med vänliga hälsningar,<br />
            <strong style={signoffName}>{SITE_NAME}</strong>
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerBrand}>{SITE_NAME}</Text>
          <Text style={footerText}>
            Snygga, snabba hemsidor för små företag och privatpersoner.<br />
            <Link href={SITE_URL} style={footerLink}>dinwebbpartner.com</Link>
            {' · '}
            <Link href="mailto:dinwebbpartner@hotmail.com" style={footerLink}>dinwebbpartner@hotmail.com</Link>
          </Text>
          <Text style={footerFine}>
            Du får det här mailet för att du begärt en hemsida av oss
            {reference ? ` (referens ${reference})` : ''}.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PreviewReadyEmail,
  subject: 'Din nya hemsida är redo att titta på',
  displayName: 'Preview redo',
  previewData: {
    name: 'Anna Andersson',
    company: 'Exempelföretaget AB',
    previewUrl: 'https://dinwebbpartner.com/kund-preview/ORD-EXEMPEL?token=demo',
    reference: 'ORD-EXEMPEL',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: '0',
  padding: '0',
}
const container = { maxWidth: '600px', width: '100%', margin: '0 auto', padding: '0' }

const header = {
  backgroundColor: INK,
  backgroundImage: `linear-gradient(135deg, ${INK} 0%, ${INK_SOFT} 100%)`,
  padding: '28px 28px 24px',
  borderRadius: '16px 16px 0 0',
}
const brandMark = {
  margin: '0',
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '0.6px',
}
const brandTagline = {
  margin: '6px 0 0',
  color: GOLD,
  fontSize: '12px',
  letterSpacing: '1.4px',
  textTransform: 'uppercase' as const,
}

const goldRule = {
  backgroundColor: ORANGE,
  backgroundImage: `linear-gradient(90deg, ${ORANGE} 0%, ${GOLD} 100%)`,
  lineHeight: '4px',
  height: '4px',
  fontSize: '1px',
}
const goldRuleText = { margin: '0', fontSize: '1px', lineHeight: '4px' }

const card = {
  backgroundColor: '#ffffff',
  padding: '32px 28px 28px',
  borderLeft: `1px solid ${BORDER}`,
  borderRight: `1px solid ${BORDER}`,
}
const eyebrow = {
  margin: '0 0 10px',
  color: ORANGE,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1.4px',
  textTransform: 'uppercase' as const,
}
const h1 = { margin: '0 0 20px', color: INK, fontSize: '28px', lineHeight: '1.22', fontWeight: 700 }

const companyPanel = {
  backgroundColor: PANEL,
  border: `1px solid ${BORDER}`,
  borderLeft: `4px solid ${ORANGE}`,
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '0 0 22px',
}
const companyLabel = {
  margin: '0 0 4px',
  color: MUTED,
  fontSize: '11px',
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
}
const companyName = { margin: '0', color: INK, fontSize: '19px', fontWeight: 700, lineHeight: '1.3' }
const companyRef = { margin: '6px 0 0', color: MUTED, fontSize: '12px' }

const text = { margin: '0 0 22px', color: TEXT, fontSize: '16px', lineHeight: '1.65' }

const ctaWrap = { margin: '0 0 26px' }
const ctaTable = { margin: '0 auto', borderRadius: '12px' }
const ctaCell = {
  backgroundColor: ORANGE,
  backgroundImage: `linear-gradient(135deg, ${ORANGE} 0%, ${GOLD} 100%)`,
  borderRadius: '12px',
  padding: '16px 32px',
}
const ctaLink = {
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
  lineHeight: '1.2',
}
const small = {
  margin: '16px 0 0',
  color: MUTED,
  fontSize: '13px',
  lineHeight: '1.55',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
}
const link = { color: ORANGE }

const stepsPanel = {
  backgroundColor: PANEL,
  border: `1px solid ${BORDER}`,
  borderRadius: '14px',
  padding: '20px 20px 8px',
  margin: '0 0 24px',
}
const stepsTitle = { margin: '0 0 12px', color: INK, fontSize: '15px', fontWeight: 700 }
const stepNumCol = { width: '32px', verticalAlign: 'top' as const }
const stepNum = {
  margin: '0 0 12px',
  color: ORANGE,
  fontSize: '15px',
  fontWeight: 700,
  lineHeight: '1.5',
}
const stepText = { margin: '0 0 12px', color: TEXT, fontSize: '14px', lineHeight: '1.5' }

const signoff = { margin: '0', color: TEXT, fontSize: '15px', lineHeight: '1.6' }
const signoffName = { color: INK }

const footer = {
  backgroundColor: INK,
  backgroundImage: `linear-gradient(135deg, ${INK} 0%, ${INK_SOFT} 100%)`,
  padding: '24px 28px',
  borderRadius: '0 0 16px 16px',
}
const footerBrand = { margin: '0 0 8px', color: '#ffffff', fontSize: '15px', fontWeight: 700 }
const footerText = { margin: '0 0 10px', color: '#c9c3ba', fontSize: '13px', lineHeight: '1.6' }
const footerLink = { color: GOLD, textDecoration: 'none' }
const footerFine = { margin: '0', color: '#8b8379', fontSize: '11px', lineHeight: '1.5' }
