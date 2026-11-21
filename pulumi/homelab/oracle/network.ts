import * as pulumi from "@pulumi/pulumi";
import * as oci from "@pulumi/oci";

export const config = new pulumi.Config();

// Oracle Cloud, region sa-vinhedo-1, compartment "andre-tf-compartment" (created by the old Terraform repo).
// One VCN and one public subnet shared by every Oracle VM, including agendaodonto's.
export const oracleCompartmentId = "ocid1.compartment.oc1..aaaaaaaaezdkqowt5pg4ttqotza7hdaicotdsos3l2qvabg5dwnubx6vvita";

export const labVcn = new oci.core.Vcn("oracle-lab-vcn", {
    cidrBlock: "10.0.0.0/23",
    cidrBlocks: ["10.0.0.0/23"],
    compartmentId: oracleCompartmentId,
    displayName: "Lab VCN",
    dnsLabel: "labvcn",
    freeformTags: {
        environment: "lab",
        "managed-by": "terraform",
    },
}, {
    protect: true,
    // Oracle adds CreatedBy/CreatedOn tags itself; not managed here.
    ignoreChanges: ["definedTags", "createVnicDetails.definedTags"],
});

export const internetGateway = new oci.core.InternetGateway("oracle-internet-gateway", {
    compartmentId: oracleCompartmentId,
    displayName: "Internet Gateway Default OCI",
    freeformTags: {
        environment: "lab",
        "managed-by": "terraform",
    },
    vcnId: labVcn.id,
}, {
    protect: true,
    // Oracle adds CreatedBy/CreatedOn tags itself; not managed here.
    ignoreChanges: ["definedTags", "createVnicDetails.definedTags"],
});

export const labRouteTable = new oci.core.RouteTable("oracle-lab-route-table", {
    compartmentId: oracleCompartmentId,
    displayName: "Default Route Table for Lab VCN",
    freeformTags: {
        environment: "lab",
        "managed-by": "terraform",
    },
    routeRules: [
        {
            destination: "0.0.0.0/0",
            destinationType: "CIDR_BLOCK",
            networkEntityId: internetGateway.id,
            routeType: "STATIC",
        },
        {
            destination: "10.8.0.0/24",
            destinationType: "CIDR_BLOCK",
            // Sends WireGuard traffic (10.8.0.0/24) to the VPN server's private IP.
            networkEntityId: "ocid1.privateip.oc1.sa-vinhedo-1.ab3ggljr5f2tjx3hiisjuazh4zwp7j2gtlnsbphrez6rwonarphlsey4jogq",
            routeType: "STATIC",
        },
    ],
    vcnId: labVcn.id,
}, {
    protect: true,
    // Oracle adds CreatedBy/CreatedOn tags itself; not managed here.
    ignoreChanges: ["definedTags", "createVnicDetails.definedTags"],
});

export const labSecurityList = new oci.core.SecurityList("oracle-lab-security-list", {
    compartmentId: oracleCompartmentId,
    displayName: "Default Lab security list",
    egressSecurityRules: [{
        destination: "0.0.0.0/0",
        destinationType: "CIDR_BLOCK",
        protocol: "all",
    }],
    freeformTags: {
        environment: "lab",
        "managed-by": "terraform",
    },
    ingressSecurityRules: [
        {
            // WireGuard clients (10.8.0.0/24). Covers traffic from the VPN server into the VCN.
            protocol: "all",
            source: "10.8.0.0/24",
            sourceType: "CIDR_BLOCK",
        },
        {
            description: "Allow HTTP from anywhere",
            protocol: "6",
            source: "0.0.0.0/0",
            sourceType: "CIDR_BLOCK",
            tcpOptions: {
                max: 80,
                min: 80,
            },
        },
        {
            description: "Allow HTTPS from anywhere",
            protocol: "6",
            source: "0.0.0.0/0",
            sourceType: "CIDR_BLOCK",
            tcpOptions: {
                max: 443,
                min: 443,
            },
        },
        {
            description: "Allow UDP traffic from anywhere for VPN access",
            protocol: "17",
            source: "0.0.0.0/0",
            sourceType: "CIDR_BLOCK",
            udpOptions: {
                max: 51820,
                min: 51820,
            },
        },
        {
            description: "Allow all from vcn subnet",
            protocol: "all",
            source: "10.0.0.0/8",
            sourceType: "CIDR_BLOCK",
        },
        {
            description: "Allow all traffic from my home IP",
            protocol: "6",
            source: config.requireSecret("oracleAllowedHomeIp"),
            sourceType: "CIDR_BLOCK",
            tcpOptions: {
                max: 65535,
                min: 1,
            },
        },
    ],
    vcnId: labVcn.id,
}, {
    protect: true,
    // Oracle adds CreatedBy/CreatedOn tags itself; not managed here.
    ignoreChanges: ["definedTags", "createVnicDetails.definedTags"],
});

export const labSubnet = new oci.core.Subnet("oracle-public-lab-subnet", {
    cidrBlock: "10.0.0.0/28",
    compartmentId: oracleCompartmentId,
    dhcpOptionsId: "ocid1.dhcpoptions.oc1.sa-vinhedo-1.aaaaaaaapkumkxcgnn7w3s2jqm4oyw6c4oehy662mbb7t4akm5nnecgcc5gq",
    displayName: "Public Lab Subnet",
    dnsLabel: "lab",
    freeformTags: {
        environment: "lab",
        "managed-by": "terraform",
    },
    ipv4cidrBlocks: ["10.0.0.0/28"],
    routeTableId: labRouteTable.id,
    securityListIds: [labSecurityList.id],
    vcnId: labVcn.id,
}, {
    protect: true,
    // Oracle adds CreatedBy/CreatedOn tags itself; not managed here.
    ignoreChanges: ["definedTags", "createVnicDetails.definedTags"],
});
