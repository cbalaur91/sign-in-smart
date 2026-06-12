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

export default function ThankYouEmail(props: FollowUpEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Thanks for visiting {props.propertyAddress}!</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <PropertyPhoto
            photoUrl={props.photoUrl}
            propertyAddress={props.propertyAddress}
          />
          <Section style={emailStyles.content}>
            <Text style={emailStyles.heading}>Thanks for stopping by!</Text>
            <Text style={emailStyles.text}>
              It was great having you at the open house. Here are the property
              details in case you&apos;d like another look.
            </Text>
            <PropertySummary {...props} />
            <Text style={emailStyles.text}>
              Questions about the home, offers, or next steps? Reply to this
              email
              {props.agentPhone ? ` or call ${props.agentName} at ${props.agentPhone}` : ""}{" "}
              — happy to help.
            </Text>
            <AgentCard {...props} />
          </Section>
          <EmailFooter {...props} />
        </Container>
      </Body>
    </Html>
  );
}
