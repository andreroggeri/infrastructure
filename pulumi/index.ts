// Entry point: one folder per project.
import "./homelab";
import "./agendaodonto";

// Read the token with: pulumi stack output otpRelayToken --show-secrets
export { otpRelayToken, otpRelayHostname, otpRelayAddresses } from "./homelab/otp-relay";
