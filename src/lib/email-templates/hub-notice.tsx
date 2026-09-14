import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

/**
 * Shared transactional notice used by the design review loop:
 * change acknowledgements, approval confirmations and question receipts.
 * Visual system mirrors preview-ready.tsx (ink header, gold rule, orange CTA).
 */

const SITE_NAME = 'Din Webbpartner'
const SITE_URL = 'https://dinwebbpartner.com'

const INK = '#14100c'
const INK_SOFT = '#1d140d'
const ORANGE = '#f47600'
const GOLD = '#fab72a'
const TEXT = '#2b2a28'
const MUTED = '#6d6a66'
const BORDER = '#e8e4dd'
const PANEL = '#faf7f2'

export interface HubNoticeProps {
  eyebrow?: string
  heading?: string
  intro?: string
  name?: string
  company?: string
  reference?: string
  /** Short, already sanitised bullet list (never raw customer text). */
  bullets?: string[]
  bulletsTitle?: string
  ctaUrl?: string
  ctaLabel?: string
  outro?: string
}

export const HubNoticeEmail = ({
  eyebrow, heading, intro, name, company, reference, bullets, bulletsTitle, ctaUrl, ctaLabel, outro,
}: HubNoticeProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>{heading || 'Uppdatering om ditt hemsideprojekt'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandMark}>{SITE_NAME}</Text>
          <Text style={brandTagline}>Hemsidor för små företag — Stockholm</Text>
        </Section>
        <Section style={goldRule}><Text style={goldRuleText}>&nbsp;</Text></Section>

        <Section style={card}>
          {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
          <Heading style={h1}>{heading}</Heading>

          {company ? (
            <Section style={companyPanel}>
              <Text style={companyLabel}>Projekt</Text>
              <Text style={companyName}>{company}</Text>
              {reference ? <Text style={companyRef}>Referens {reference}</Text> : null}
            </Section>
          ) : null}

          <Text style={text}>{name ? `Hej ${name}! ` : 'Hej! '}{intro}</Text>

          {bullets && bullets.length ? (
            <Section style={panel}>
              <Text style={panelTitle}>{bulletsTitle || 'Det här har vi noterat'}</Text>
              {bullets.map((b, i) => (
                <Text key={i} style={bulletText}>• {b}</Text>
              ))}
            </Section>
          ) : null}

          {ctaUrl ? (
            <Section style={ctaWrap}>
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={ctaTable}>
                <tbody>
                  <tr>
                    <td align="center" {...({ bgcolor: ORANGE } as any)} style={ctaCell}>
                      <a href={ctaUrl} style={ctaLink}>{ctaLabel || 'Öppna'}</a>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Text style={small}>
                Fungerar inte knappen? Kopiera länken:<br />
                <Link href={ctaUrl} style={link}>{ctaUrl}</Link>
              </Text>
            </Section>
          ) : null}

          {outro ? <Text style={text}>{outro}</Text> : null}

          <Text style={signoff}>
            Med vänliga hälsningar,<br />
            <strong style={signoffName}>{SITE_NAME}</strong>
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerBrand}>{SITE_NAME}</Text>
          <Text style={footerText}>
            Snygga, snabba hemsidor för små företag och privatpersoner.<br />
            <Link href={SITE_URL} style={footerLink}>dinwebbpartner.com</Link>
          </Text>
          <Text style={footerFine}>
            Du får det här mailet för att du har ett pågående hemsideprojekt hos oss
            {reference ? ` (referens ${reference})` : ''}.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const changeReceivedTemplate = {
  component: HubNoticeEmail,
  subject: (d: Record<string, any>) =>
    d?.reference ? `Vi har tagit emot dina ändringar (${d.reference})` : 'Vi har tagit emot dina ändringar',
  displayName: 'Ändringar mottagna',
  previewData: {
    eyebrow: 'Ändringar mottagna',
    heading: 'Tack — vi har tagit emot dina ändringar',
    intro: 'Vi har läst ditt svar och börjat arbeta på en ny version av sidan.',
    bulletsTitle: 'Det här har vi tolkat',
    bullets: ['Lägger till mer blått', 'Mindre rubrik'],
    company: 'Exempelföretaget AB',
    reference: 'ORD-EXEMPEL',
  },
} satisfies TemplateEntry

export const approvalConfirmedTemplate = {
  component: HubNoticeEmail,
  subject: (d: Record<string, any>) =>
    d?.reference ? `Din design är godkänd (${d.reference})` : 'Din design är godkänd',
  displayName: 'Godkännande bekräftat',
  previewData: {
    eyebrow: 'Godkänt',
    heading: 'Tack — din design är registrerad som godkänd',
    intro: 'Vi har registrerat ditt godkännande och stoppat vidare designändringar.',
    company: 'Exempelföretaget AB',
    reference: 'ORD-EXEMPEL',
  },
} satisfies TemplateEntry

export const questionAckTemplate = {
  component: HubNoticeEmail,
  subject: (d: Record<string, any>) =>
    d?.reference ? `Vi har tagit emot din fråga (${d.reference})` : 'Vi har tagit emot din fråga',
  displayName: 'Fråga mottagen',
  previewData: {
    eyebrow: 'Fråga mottagen',
    heading: 'Vi har tagit emot din fråga',
    intro: 'En av oss läser ditt meddelande och återkommer personligen.',
    company: 'Exempelföretaget AB',
    reference: 'ORD-EXEMPEL',
  },
} satisfies TemplateEntry

export const questionAnswerTemplate = {
  component: HubNoticeEmail,
  subject: (d: Record<string, any>) =>
    d?.reference ? `Svar på din fråga (${d.reference})` : 'Svar på din fråga',
  displayName: 'Svar på fråga',
  previewData: {
    eyebrow: 'Svar',
    heading: 'Här är svaret på din fråga',
    intro: 'Så här ser status ut för ditt projekt just nu.',
    company: 'Exempelföretaget AB',
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
const brandMark = { margin: '0', color: '#ffffff', fontSize: '20px', fontWeight: 700, letterSpacing: '0.6px' }
const brandTagline = {
  margin: '6px 0 0', color: GOLD, fontSize: '12px', letterSpacing: '1.4px', textTransform: 'uppercase' as const,
}
const goldRule = {
  backgroundColor: ORANGE,
  backgroundImage: `linear-gradient(90deg, ${ORANGE} 0%, ${GOLD} 100%)`,
  lineHeight: '4px', height: '4px', fontSize: '1px',
}
const goldRuleText = { margin: '0', fontSize: '1px', lineHeight: '4px' }
const card = {
  backgroundColor: '#ffffff', padding: '32px 28px 28px',
  borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`,
}
const eyebrowStyle = {
  margin: '0 0 10px', color: ORANGE, fontSize: '12px', fontWeight: 700,
  letterSpacing: '1.4px', textTransform: 'uppercase' as const,
}
const h1 = { margin: '0 0 20px', color: INK, fontSize: '26px', lineHeight: '1.22', fontWeight: 700 }
const companyPanel = {
  backgroundColor: PANEL, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${ORANGE}`,
  borderRadius: '12px', padding: '16px 18px', margin: '0 0 22px',
}
const companyLabel = {
  margin: '0 0 4px', color: MUTED, fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase' as const,
}
const companyName = { margin: '0', color: INK, fontSize: '19px', fontWeight: 700, lineHeight: '1.3' }
const companyRef = { margin: '6px 0 0', color: MUTED, fontSize: '12px' }
const text = { margin: '0 0 22px', color: TEXT, fontSize: '16px', lineHeight: '1.65' }
const panel = {
  backgroundColor: PANEL, border: `1px solid ${BORDER}`, borderRadius: '14px',
  padding: '18px 20px 6px', margin: '0 0 24px',
}
const panelTitle = { margin: '0 0 12px', color: INK, fontSize: '15px', fontWeight: 700 }
const bulletText = { margin: '0 0 10px', color: TEXT, fontSize: '14px', lineHeight: '1.5' }
const ctaWrap = { margin: '0 0 26px' }
const ctaTable = { margin: '0 auto', borderRadius: '12px' }
const ctaCell = {
  backgroundColor: ORANGE,
  backgroundImage: `linear-gradient(135deg, ${ORANGE} 0%, ${GOLD} 100%)`,
  borderRadius: '12px', padding: '16px 32px',
}
const ctaLink = {
  color: '#ffffff', fontSize: '17px', fontWeight: 700, textDecoration: 'none',
  display: 'inline-block', lineHeight: '1.2',
}
const small = {
  margin: '16px 0 0', color: MUTED, fontSize: '13px', lineHeight: '1.55',
  textAlign: 'center' as const, wordBreak: 'break-all' as const,
}
const link = { color: ORANGE }
const signoff = { margin: '0', color: TEXT, fontSize: '15px', lineHeight: '1.6' }
const signoffName = { color: INK }
const footer = {
  backgroundColor: INK,
  backgroundImage: `linear-gradient(135deg, ${INK} 0%, ${INK_SOFT} 100%)`,
  padding: '24px 28px', borderRadius: '0 0 16px 16px',
}
const footerBrand = { margin: '0 0 8px', color: '#ffffff', fontSize: '15px', fontWeight: 700 }
const footerText = { margin: '0 0 10px', color: '#c9c3ba', fontSize: '13px', lineHeight: '1.6' }
const footerLink = { color: GOLD, textDecoration: 'none' }
const footerFine = { margin: '0', color: '#8b8379', fontSize: '11px', lineHeight: '1.5' }
