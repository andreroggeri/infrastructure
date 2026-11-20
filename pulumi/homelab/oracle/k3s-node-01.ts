import * as oci from "@pulumi/oci";
import { oracleCompartmentId, labSubnet } from "./network";

// k3s server node in Oracle Cloud (VPN IP 10.8.0.13). Joins the cluster over WireGuard; see ansible/inventory.yaml.
export const k3sNode01 = new oci.core.Instance("oracle-k3s-node-01", {
    agentConfig: {
        pluginsConfigs: [
            {
                desiredState: "DISABLED",
                name: "Vulnerability Scanning",
            },
            {
                desiredState: "DISABLED",
                name: "Management Agent",
            },
            {
                desiredState: "DISABLED",
                name: "Custom Logs Monitoring",
            },
            {
                desiredState: "DISABLED",
                name: "Compute RDMA GPU Monitoring",
            },
            {
                desiredState: "DISABLED",
                name: "Compute Instance Monitoring",
            },
            {
                desiredState: "DISABLED",
                name: "Compute HPC RDMA Auto-Configuration",
            },
            {
                desiredState: "DISABLED",
                name: "Compute HPC RDMA Authentication",
            },
            {
                desiredState: "DISABLED",
                name: "Cloud Guard Workload Protection",
            },
            {
                desiredState: "DISABLED",
                name: "Block Volume Management",
            },
            {
                desiredState: "DISABLED",
                name: "Bastion",
            },
        ],
    },
    availabilityConfig: {
        recoveryAction: "RESTORE_INSTANCE",
    },
    availabilityDomain: "rDTj:SA-VINHEDO-1-AD-1",
    compartmentId: oracleCompartmentId,
    createVnicDetails: {
        displayName: "instance-20250406-2025",
        hostnameLabel: "k3s-node-01",
        privateIp: "10.0.0.8",
        subnetId: labSubnet.id,
    },
    displayName: "k3s-node-01",
    faultDomain: "FAULT-DOMAIN-3",
    hostnameLabel: "k3s-node-01",
    image: "ocid1.image.oc1.sa-vinhedo-1.aaaaaaaa2uccukdkrms7jkpuox7gxzqc76m4qoe6t4l5ighvzlwvrayjolda",
    launchOptions: {
        bootVolumeType: "PARAVIRTUALIZED",
        firmware: "UEFI_64",
        isConsistentVolumeNamingEnabled: true,
        isPvEncryptionInTransitEnabled: true,
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
        sourceId: "ocid1.image.oc1.sa-vinhedo-1.aaaaaaaa2uccukdkrms7jkpuox7gxzqc76m4qoe6t4l5ighvzlwvrayjolda",
        sourceType: "image",
    },
    state: "RUNNING",
}, {
    protect: true,
    // Oracle adds CreatedBy/CreatedOn tags itself; not managed here.
    ignoreChanges: ["definedTags", "createVnicDetails.definedTags"],
});
