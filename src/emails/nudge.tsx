import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  AgentCard,
  EmailFooter,
  PropertyPhoto,
  PropertySummary,
  emailStyles,
  type FollowUpEmailProps,
} from "./shared";

export default function NudgeEmail(props: FollowUpEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Still thinking about {props.propertyAddress}?</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <PropertyPhoto
            photoUrl={props.photoUrl}
            propertyAddress={props.propertyAddress}
          />
          <Section style={emailStyles.content}>
            <Text style={emailStyles.heading}>
              Still thinking about this one?
            </Text>
            <PropertySummary {...props} />
            <Text style={emailStyles.text}>
              Reply to this email to schedule a private showing — {""}
              {props.agentName} would love to walk you through it again.
            </Text>
            <AgentCard {...props} />
          </Section>
          <EmailFooter {...props} />
        </Container>
      </Body>
    </Html>
  );
}
