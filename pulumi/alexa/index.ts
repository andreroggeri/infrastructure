import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import { accountId } from "../shared";

// Alexa smart home skill → Lambda (us-east-1) → Cloudflare Access → Home Assistant.
// Imported 2026-11-20. Uses the "homelab" AWS profile (see Pulumi.homelab.yaml).
const config = new pulumi.Config();

const lambdaRole = new aws.iam.Role("smart-home-lambda-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Action: "sts:AssumeRole", Effect: "Allow", Principal: { Service: "lambda.amazonaws.com" } }],
    }),
    description: "Allows Lambda functions to call AWS services on your behalf. Use in home assistant",
    name: "smart-home-lambda",
}, { protect: true });

new aws.iam.RolePolicyAttachment("smart-home-lambda-basic-execution", {
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    role: lambdaRole.name,
}, { protect: true });

const logGroup = new aws.cloudwatch.LogGroup("smart-home-alexa-logs", {
    logGroupClass: "STANDARD",
    name: "/aws/lambda/smart-home-alexa",
}, { protect: true });

export const alexaFunction = new aws.lambda.Function("smart-home-alexa", {
    name: "smart-home-alexa",
    code: new pulumi.asset.FileArchive("./alexa/lambda"),
    handler: "lambda_function.lambda_handler",
    runtime: aws.lambda.Runtime.Python3d13,
    architectures: ["x86_64"],
    packageType: "Zip",
    role: lambdaRole.arn,
    environment: {
        variables: {
            BASE_URL: "https://home.roggeri.com.br",
            // Cloudflare Access service token "Alexa Skill Lambda" (below).
            CF_CLIENT_ID: "1a6c2320b69ee8ba28c8b068ff667bfe.access",
            CF_CLIENT_SECRET: config.requireSecret("alexaCfClientSecret"),
            DEBUG: "True",
        },
    },
    ephemeralStorage: { size: 512 },
    loggingConfig: { logFormat: "Text", logGroup: logGroup.name },
    tracingConfig: { mode: "PassThrough" },
}, { protect: true });

// Lets the Alexa skill invoke the function.
new aws.lambda.Permission("smart-home-alexa-allow-alexa", {
    action: "lambda:InvokeFunction",
    eventSourceToken: "amzn1.ask.skill.3f38f8b8-28cd-46ae-ba9e-778cf25e041a",
    function: alexaFunction.name,
    principal: "alexa-connectedhome.amazon.com",
    statementId: "lambda-18b98993-70e6-4eb0-b621-66fd5803eda3",
}, { protect: true });

// Cloudflare side: the service token the Lambda sends, and the Access policy that lets it in.
export const service_token_alexa_lambda = new cloudflare.ZeroTrustAccessServiceToken("service-token-alexa-lambda", {
    accountId,
    // Expires yearly. Refresh it in Zero Trust (Access → Service auth) before it lapses, or Alexa breaks.
    duration: "8760h",
    // Bumped by each "Rotate" in the dashboard; must match Cloudflare or updates fail.
    clientSecretVersion: 3,
    previousClientSecretExpiresAt: "2026-11-20T19:35:52Z",
    enabled: true,
    name: "Alexa Skill Lambda",
}, {
    protect: true,
});

export const policy_allow_access_from_the_aws_lambda = new cloudflare.ZeroTrustAccessPolicy("policy-allow-access-from-the-aws-lambda", {
    accountId,
    decision: "non_identity",
    includes: [{
        serviceToken: {
            tokenId: service_token_alexa_lambda.id,
        },
    }],
    name: "Allow access from the AWS Lambda",
}, {
    protect: true,
});
