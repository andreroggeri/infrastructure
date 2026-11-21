import * as oci from "@pulumi/oci";
import { oracleCompartmentId, labSubnet } from "./network";
import * as cloudflare from "@pulumi/cloudflare";
import { cloudflareZoneIds } from "../../shared";

// WireGuard server (UDP 51820). Every homelab node joins the 10.8.0.0/24 VPN through it.
// Configured by ansible (make vpn). Source/dest check is off so it can route VPN traffic.
export const vpnServer = new oci.core.Instance("oracle-vpn-server", {
    availabilityConfig: {
        isLiveMigrationPreferred: true,
        recoveryAction: "RESTORE_INSTANCE",
    },
    availabilityDomain: "rDTj:SA-VINHEDO-1-AD-1",
    compartmentId: oracleCompartmentId,
    createVnicDetails: {
        displayName: "VPN Instance",
        hostnameLabel: "vpn-instance",
        privateIp: "10.0.0.2",
        skipSourceDestCheck: true,
        subnetId: labSubnet.id,
    },
    displayName: "VPN Instance",
    faultDomain: "FAULT-DOMAIN-1",
    hostnameLabel: "vpn-instance",
    image: "ocid1.image.oc1.sa-vinhedo-1.aaaaaaaavqwljptwjkxsosxtzykl7sm7gzzcwrolj4imjfdwzi2gdwb3dbxa",
    launchOptions: {
        bootVolumeType: "PARAVIRTUALIZED",
        firmware: "UEFI_64",
        isConsistentVolumeNamingEnabled: true,
        networkType: "PARAVIRTUALIZED",
        remoteDataVolumeType: "PARAVIRTUALIZED",
    },
    metadata: {
        ssh_authorized_keys: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE2hAh1V1Rir22FyZnv3Cdm3xegbXaAoWC37J9V2P8Rw",
    },
    shape: "VM.Standard.E2.1.Micro",
    shapeConfig: {
        memoryInGbs: 1,
        ocpus: 1,
        vcpus: 2,
    },
    sourceDetails: {
        bootVolumeSizeInGbs: "47",
        bootVolumeVpusPerGb: "10",
        sourceId: "ocid1.image.oc1.sa-vinhedo-1.aaaaaaaavqwljptwjkxsosxtzykl7sm7gzzcwrolj4imjfdwzi2gdwb3dbxa",
        sourceType: "image",
    },
    state: "RUNNING",
}, {
    protect: true,
    // Oracle adds CreatedBy/CreatedOn tags itself; not managed here.
    ignoreChanges: ["definedTags", "createVnicDetails.definedTags"],
});

// Public name the WireGuard clients connect to.
export const vpnServerRecord = new cloudflare.DnsRecord("dns-a-wg-roggeri-com-br", {
    content: vpnServer.publicIp,
    name: "wg.roggeri.com.br",
    ttl: 1,
    type: "A",
    zoneId: cloudflareZoneIds.roggeriComBr,
}, {
    protect: true,
});
