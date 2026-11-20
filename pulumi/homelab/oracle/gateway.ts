import * as oci from "@pulumi/oci";
import { oracleCompartmentId, labSubnet } from "./network";

// "Gateway Instance": WireGuard client at 10.8.0.11 (ansible/inventory.yaml, host "gateway").
// TODO: document what it serves.
export const gatewayVm = new oci.core.Instance("oracle-gateway", {
    availabilityConfig: {
        recoveryAction: "RESTORE_INSTANCE",
    },
    availabilityDomain: "rDTj:SA-VINHEDO-1-AD-1",
    compartmentId: oracleCompartmentId,
    createVnicDetails: {
        displayName: "Gateway Instance",
        hostnameLabel: "gateway-instance",
        privateIp: "10.0.0.7",
        subnetId: labSubnet.id,
    },
    displayName: "Gateway Instance",
    faultDomain: "FAULT-DOMAIN-1",
    hostnameLabel: "gateway-instance",
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
