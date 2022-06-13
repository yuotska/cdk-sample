import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { WorkshopPipelineStage } from './pipeline-stage';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";

import { Stack,  ScopedAws, StackProps } from '@aws-cdk/core';




// CodeComit repository
const girrepoAP = new codecommit.Repository(this, 'bousai-ap-repo', {
  repositoryName: "girrepoAP"
});


//Artifact
const sourceOutput = new CodePipeline.Artifact();
const buildOutput = new CodePipeline.Artifact();

const {
    accountId,
    stackName,
    region,
  } = new ScopedAws(this)

   
   
    //**************************************************** */
    // 1. プロジェクトの生成
    //**************************************************** */

const codeBuildProject = new CodeBuildStep.PipelineProject(this, `project`, {
    projectName: `Codebuild-Project`,
    environment: {
        buildImage: `aws/codebuild/docker:18.09.0`,
        ComputeType: `BUILD_GENERAL1_SMALL`,
        privileged: true,
        environmentVariables: {
            AWS_DEFAULT_REGION: { 
                type: CodeBuildStep.BuildEnvironmentVariableType.PLAINTEXT,
                value: '${region}' },

            REPOSITORY_NAME: { 
                type: CodeBuildStep.BuildEnvironmentVariableType.PLAINTEXT,
                value: '' },

            AWS_ACCOUNT_ID: { 
                type: CodeBuildStep.BuildEnvironmentVariableType.PLAINTEXT,
                value: '${accountId}' },
                  },    
        },

    buildSpec: CodeBuildStep.BuildSpec.fromObject({
        version: '0.2',
        phases: {
            pre_build: {
                commands: [ 
                    ' echo Logging in to Amazon ECR...',
                    "$(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)",
                    " REPOSITORY_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${REPOSITORY_NAME}",
                    " IMAGE_TAG=$(echo ${CODEBUILD_RESOLVED_SOURCE_VERSION} | head -c 7)",
                ]
                          
                },

            build: {
            commands: [  
                    'echo Build started on `date`',
                    'echo Building the Docker image... ',
                    'docker build -t ${IMAGE_REPO_NAME}:${IMAGE_TAG} .',
                    'docker tag ${REPOSITORY_NAME}:latest ${REPOSITORY_URI}:latest',
                    'docker tag ${REPOSITORY_NAME}:latest ${REPOSITORY_URI}:${IMAGE_TAG}',

                ]
            },

            post_build: {
                commands: [  
                        'docker push ${REPOSITORY_URI}:${IMAGE_TAG}',
                        'docker push ${REPOSITORY_URI}:latest',
                        'aws ecr start-image-scan --repository-name [] --image-id imageTag=latest',

                    ]
                },
            },
        }),
        outputs: [buildOutput]
    })


    //**************************************************** */
    // 2. ソースアクションの生成
    //**************************************************** */    
    const sourceAction = new CodePipeline.SourceAction({
        actionName: 'SourceAction',
        repo: 'template-aws-cdk-typescript-serverless-app',
        branch: 'Dev',
        output: sourceOutput,
        runOrder: 1,
    });
    
    

    //**************************************************** */
    // 3. ビルドアクションの生成
    //**************************************************** */
    
    
    const buildAction = new CodePipeline.CodeBuildAction({
        actionName: "CodeBuild",
        codeBuildProject,
        input: sourceOutput,
      });
    

    //**************************************************** */
    // 4. パイプラインの生成
    //**************************************************** */
    const pipeline = new CodePipeline.Pipeline(this, 'CodePipeline', {
        pipelineName: 'simple-ec2-deployflow-pipeline',
        stages: [
            {
                stageName: 'Source',
                actions: [sourceAction]
            },
            {
                stageName: 'Build',
                actions: [buildAction]
            }
        ]
        }); 
              
