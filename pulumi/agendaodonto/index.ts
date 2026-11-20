import * as cloudflare from "@pulumi/cloudflare";
import * as oci from "@pulumi/oci";
import { oracleCompartmentId, labSubnet } from "../homelab/oracle/network";

// agendaodonto.com: separate project from the homelab.
// Its production VM sits in the homelab's Oracle network (homelab/oracle/network.ts).
import { cloudflareZoneIds } from "../shared";

// DNS. Root and staging point at Firebase Hosting; the wildcards point at servers.
export const agendaodontoRootRecord = new cloudflare.DnsRecord("agendaodonto-a-root", {
    content: "199.36.158.100",
    name: "agendaodonto.com",
    ttl: 1,
    type: "A",
    zoneId: cloudflareZoneIds.agendaodontoCom,
}, {
    protect: true,
});

export const agendaodontoWildcardRecord = new cloudflare.DnsRecord("agendaodonto-a-wildcard", {
    content: "204.216.135.129",
    name: "*.agendaodonto.com",
    ttl: 1,
    type: "A",
    zoneId: cloudflareZoneIds.agendaodontoCom,
}, {
    protect: true,
});

export const agendaodontoStagingRecord = new cloudflare.DnsRecord("agendaodonto-a-staging", {
    content: "199.36.158.100",
    name: "staging.agendaodonto.com",
    ttl: 1,
    type: "A",
    zoneId: cloudflareZoneIds.agendaodontoCom,
}, {
    protect: true,
});

export const agendaodontoStagingWildcardRecord = new cloudflare.DnsRecord("agendaodonto-a-wildcard-staging", {
    content: "134.65.26.46",
    name: "*.staging.agendaodonto.com",
    ttl: 1,
    type: "A",
    zoneId: cloudflareZoneIds.agendaodontoCom,
}, {
    protect: true,
});

export const agendaodontoGoogleVerification = new cloudflare.DnsRecord("agendaodonto-txt-google-verification", {
    content: "google-site-verification=rW-Q06WUaYpVfjgnoipfCVd9WI3IYaFphJx28iXHMpw",
    name: "agendaodonto.com",
    ttl: 1,
    type: "TXT",
    zoneId: cloudflareZoneIds.agendaodontoCom,
}, {
    protect: true,
});

// Production VM (Ampere A1). Its public IP is what *.agendaodonto.com points at.
export const agendaodontoProductionVm = new oci.core.Instance("agendaodonto-production-vm", {
    availabilityConfig: {
        recoveryAction: "RESTORE_INSTANCE",
    },
    availabilityDomain: "rDTj:SA-VINHEDO-1-AD-1",
    compartmentId: oracleCompartmentId,
    createVnicDetails: {
        displayName: "Agendaodonto Production Instance",
        hostnameLabel: "agendaodonto",
        privateIp: "10.0.0.10",
        subnetId: labSubnet.id,
    },
    displayName: "Agendaodonto Production Instance",
    faultDomain: "FAULT-DOMAIN-1",
    hostnameLabel: "agendaodonto",
    image: "ocid1.image.oc1.sa-vinhedo-1.aaaaaaaamgblooernxzyopfsr37jegqara4vbm7uwaqb2zp5f3tv2isjzqna",
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
    shape: "VM.Standard.A1.Flex",
    shapeConfig: {
        baselineOcpuUtilization: "BASELINE_1_1",
        memoryInGbs: 6,
        ocpus: 1,
        vcpus: 1,
    },
    sourceDetails: {
        bootVolumeSizeInGbs: "47",
        bootVolumeVpusPerGb: "10",
        sourceId: "ocid1.image.oc1.sa-vinhedo-1.aaaaaaaamgblooernxzyopfsr37jegqara4vbm7uwaqb2zp5f3tv2isjzqna",
        sourceType: "image",
    },
    state: "RUNNING",
}, {
    protect: true,
    // Oracle adds CreatedBy/CreatedOn tags itself; not managed here.
    ignoreChanges: ["definedTags", "createVnicDetails.definedTags"],
});
