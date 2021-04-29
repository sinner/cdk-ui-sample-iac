# Sample App UI CDK Project

This is site UI CDK Project. It defines the infrastructure of this Vue.js Application for the Dealview Morningstar product and it has been made using the CDK Typescript Template.

The `cdk.json` file tells the CDK Toolkit how to execute your app and that file contains all the environment configuration for the application (in the `context` property).

We have defined a Multi CDK Stack approach (`dev`, `qa`, `stg` and `prod`). The infrastructure environment will depend on the `NODE_ENV` environment variable value.

## AWS CDK prerequisites

To use the AWS CDK, you need an AWS account and a corresponding access key. If you don't have an AWS account yet, see Create and Activate an AWS Account. To find out how to obtain an access key ID and secret access key for your AWS account, see Understanding and Getting Your Security Credentials.

If you have the AWS CLI installed, the simplest way to set up your workstation with your AWS credentials is to open a command prompt and type:

```shell
aws configure
```

After installing Node.js 12.x or greater, install the AWS CDK Toolkit (the cdk command):

```shell
npm install -g aws-cdk
```

Test the installation by issuing `cdk --version`.

## Bootstraping APP

If it is the first time you run a deployment of the infrastructure you will need to run the bootstraping process. Deploying AWS CDK apps into an AWS environment (a combination of an AWS account and region) may require that you provision resources the AWS CDK needs to perform the deployment. Creating them is called bootstrapping. To bootstrap, issue:

```shell
cdk bootstrap --toolkit-stack-name my-site-stack --bootstrap-bucket-name my-site-toolkit-s3-bucket
```

## Useful commands

Remember that before using the CDK commands you should define the environment variable `NODE_ENV`, the infrastructure environment that will be created will depend on this environment variable value:

| NODE_ENV Valid Values |
|-----------------------|
| dev                   |
| qa                    |
| stg                   |
| prod                  |

```shell
export NODE_ENV=dev
```

 * `npm run build`                                     # compile typescript to js (It won't be needed)
 * `npm run watch`                                     # watch for changes and compile (It won't be needed)
 * `npm run test`                                      # perform the jest unit tests
 * `cdk diff`                                          # compare deployed stack with current state
 * `cdk synth`                                         # emits the synthesized CloudFormation template
 * `cdk deploy --toolkit-stack-name my-site-stack`      # deploy this stack to your default AWS account/region

_NOTE 00: If you are using several credentials add the parameter `--proofile default` to the `cdk` commands. Example: `cdk deploy --toolkit-stack-name my-site-stack --proofile default` and validate that you have the `default` profile in your `~/.aws/config` file and its proper credentials in the `~/.aws/credentials` file._

_NOTE 01: Before running a `cdk deploy ...` command you must make sure that the `dist/` directory has been created on the root of the project, it should be created just after running the build process of the Vue.js application._
