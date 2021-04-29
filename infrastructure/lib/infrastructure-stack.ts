import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53Target from '@aws-cdk/aws-route53-targets/lib';
import * as cm from '@aws-cdk/aws-certificatemanager';
import { Runtime, Function, Code } from "@aws-cdk/aws-lambda";

const env = process.env.NODE_ENV;
const appName = 'my-site';

// This is from your Route53 Hosted Zone Configuration
const zone = {
  id: 'XASDEARCAP92DNG21O',
  domain: 'my-domain.com',
};
const region = 'us-east-1';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName = `${appName}-s3-bucket-${env}`;
    const siteBucket = new s3.Bucket(this, bucketName, {
      bucketName,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [s3.HttpMethods.GET],
          maxAge: 3000,
        }
      ],
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new cdk.CfnOutput(this, 'SiteBucket', { value: siteBucket.bucketName });

    const bucketDeploymentName = `${appName}-s3-deployment-${env}`;
    new s3deploy.BucketDeployment(this, bucketDeploymentName, {
      sources: [ s3deploy.Source.asset('./../dist') ],
      destinationBucket: siteBucket,
    });

    const redirectFunctionName = `${appName}-redirect-lambda-edge-${env}`;

    const lambdaEdgeFunction = new Function(this, redirectFunctionName, {
      functionName: redirectFunctionName,
      description: 'Site UI Redirect Edge Lambda Function - It will validate if a 404 error is an actual error or the URL should be managed by the UI',
      code: Code.fromAsset(`${__dirname}/resources/lambda-edge/origin-response`),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_12_X,
    });

    const hostedZoneName = `${appName}-hosted-zone-${env}`;
    const hostedZone = route53.PublicHostedZone.fromHostedZoneAttributes(
      this,
      hostedZoneName,
      {
        hostedZoneId: zone.id,
        zoneName: zone.domain,
      }
    );

    const appDomain = `${appName}-${env}.${zone.domain}`;

    const sslCertificatesName = `${appName}-ssl-certificates-${env}`;
    const sslCertificates = new cm.DnsValidatedCertificate(this, sslCertificatesName, {
      domainName: appDomain,
      hostedZone,
      region,
    }).certificateArn;

    const cloudfrontPermissionsName = `${appName}-oia-${env}`;
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, cloudfrontPermissionsName, {
      comment: "Created by CDK to Get Access from Cloudfront Distribution to my site private S3 Bucket",
    });
    siteBucket.grantRead(cloudfrontOAI);

    const cloudFrontName: string = `${appName}-cloudfront-${env}`;
    const cloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(this, cloudFrontName, {
      comment: `CDN for My Site - ${cloudFrontName}`,
      aliasConfiguration: {
        acmCertRef: sslCertificates,
        names: [ appDomain ],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: cloudfrontOAI,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              compress: true,
              allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              lambdaFunctionAssociations: [
                {
                  eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
                  lambdaFunction: lambdaEdgeFunction.currentVersion,
                }
              ],
            },
          ],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
    });
    new cdk.CfnOutput(this, 'DistributionId', { value: cloudFrontDistribution.distributionId });

    const recordsetName = `${appName}-r53-recordset-${env}`;
    const recordSet = new route53.ARecord(this, recordsetName, {
      recordName: appDomain,
      target: route53.RecordTarget.fromAlias(new route53Target.CloudFrontTarget(cloudFrontDistribution)),
      zone: hostedZone,
    });
    new cdk.CfnOutput(this, 'SiteDomain', { value: recordSet.domainName });

    // code
    
  }
}
