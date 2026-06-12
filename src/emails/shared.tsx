import { Hr, Img, Link, Section, Text } from "@react-email/components";

export type FollowUpEmailProps = {
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  photoUrl: string | null;
  agentName: string;
  agentBrokerage: string | null;
  agentPhone: string | null;
  agentEmail: string;
  unsubscribeUrl: string;
};

export const emailStyles = {
  body: {
    backgroundColor: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "560px",
    overflow: "hidden" as const,
  },
  content: { padding: "0 32px" },
  heading: {
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: "30px",
    margin: "24px 0 8px",
  },
  text: {
    color: "#475569",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },
  accent: { color: "#3b82f6" },
} as const;

export function formatEmailPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function PropertyPhoto({
  photoUrl,
  propertyAddress,
}: Pick<FollowUpEmailProps, "photoUrl" | "propertyAddress">) {
  if (!photoUrl) return null;
  return (
    <Img
      src={photoUrl}
      alt={propertyAddress}
      width="560"
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}

export function PropertySummary(props: FollowUpEmailProps) {
  const facts = [
    props.bedrooms ? `${props.bedrooms} Beds` : null,
    props.bathrooms ? `${props.bathrooms} Baths` : null,
    props.sqft ? `${props.sqft.toLocaleString()} sqft` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Section style={{ margin: "0 0 8px" }}>
      <Text
        style={{
          color: "#0f172a",
          fontSize: "16px",
          fontWeight: 600,
          lineHeight: "24px",
          margin: "0 0 2px",
        }}
      >
        {props.propertyAddress}
      </Text>
      <Text style={{ color: "#64748b", fontSize: "14px", margin: "0 0 6px" }}>
        {props.city}, {props.state} {props.zip}
      </Text>
      {props.price != null && (
        <Text
          style={{
            color: "#3b82f6",
            fontSize: "20px",
            fontWeight: 700,
            margin: "0 0 4px",
          }}
        >
          {formatEmailPrice(props.price)}
        </Text>
      )}
      {facts && (
        <Text style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
          {facts}
        </Text>
      )}
    </Section>
  );
}

export function AgentCard(props: FollowUpEmailProps) {
  return (
    <Section
      style={{
        backgroundColor: "#f1f5f9",
        borderRadius: "8px",
        margin: "8px 0 24px",
        padding: "16px 20px",
      }}
    >
      <Text
        style={{
          color: "#0f172a",
          fontSize: "15px",
          fontWeight: 600,
          margin: "0 0 2px",
        }}
      >
        {props.agentName}
      </Text>
      {props.agentBrokerage && (
        <Text style={{ color: "#64748b", fontSize: "13px", margin: "0 0 8px" }}>
          {props.agentBrokerage}
        </Text>
      )}
      <Text style={{ fontSize: "13px", margin: 0, lineHeight: "20px" }}>
        {props.agentPhone && (
          <>
            <Link
              href={`tel:${props.agentPhone}`}
              style={{ color: "#3b82f6" }}
            >
              {props.agentPhone}
            </Link>
            {" · "}
          </>
        )}
        <Link href={`mailto:${props.agentEmail}`} style={{ color: "#3b82f6" }}>
          {props.agentEmail}
        </Link>
      </Text>
    </Section>
  );
}

export function EmailFooter(props: FollowUpEmailProps) {
  return (
    <Section style={{ padding: "0 32px 24px" }}>
      <Hr style={{ borderColor: "#e2e8f0", margin: "0 0 16px" }} />
      <Text
        style={{
          color: "#94a3b8",
          fontSize: "12px",
          lineHeight: "18px",
          margin: 0,
        }}
      >
        Sent on behalf of {props.agentName}
        {props.agentBrokerage ? `, ${props.agentBrokerage}` : ""} via
        SignInSmart.{" "}
        <Link href={props.unsubscribeUrl} style={{ color: "#94a3b8" }}>
          Unsubscribe
        </Link>
      </Text>
    </Section>
  );
}
