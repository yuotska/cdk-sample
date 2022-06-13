import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { WorkshopPipelineStage } from './pipeline-stage';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";




// CodeComit repository
const girrepoAP = new codecommit.Repository(this, 'bousai-ap-repo', {
  repositoryName: "girrepoAP"
});


//Artifact
const sourceOutput = new CodePipeline.Artifact();
const buildOutput = new CodePipeline.Artifact();

   
   
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
                value: '' },

            REPOSITORY_NAME: { 
                type: CodeBuildStep.BuildEnvironmentVariableType.PLAINTEXT,
                value: '' },

            AWS_ACCOUNT_ID: { 
                type: CodeBuildStep.BuildEnvironmentVariableType.PLAINTEXT,
                value: '' },
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
              
        
        // buildSpec: BuildSpec.fromObject(PipelineConfig.buildStage.buildSpec),
        // cache: Cache.local(LocalCacheMode.DOCKER_LAYER, LocalCacheMode.CUSTOM),  


//   const codeBuildProject =  new CodeBuildStep.PipelineProject(this, 'Project', {
//         buildSpec: CodeBuildStep.BuildSpec.fromObject({
//           version: '0.2',
//           env: {
//             'exported-variables': [
//               'MY_VAR',
//             ],
//           },
//           phases: {
//             build: {
//               commands: 'export MY_VAR="some value"',
//             },
//           },
//         }),
//       }),    outputs: [buildOutput]  

//   project: new CodeBuildStep.PipelineProject(this, 'Project', {
//         buildSpec: CodeBuildStep.BuildSpec.fromObject({
//           version: '0.2',
//           env: {
//             'exported-variables': [
//               'MY_VAR',
//             ],
//           },
//           phases: {
//             build: {
//               commands: 'export MY_VAR="some value"',
//             },
//           },
//         }),
//       }),    outputs: [buildOutput] project: new CodeBuildStep.PipelineProject(this, 'Project', {
//     buildSpec: CodeBuildStep.BuildSpec.fromObject({
//       version: '0.2',
//       env: {
//         'exported-variables': [
//           'MY_VAR',
//         ],
//       },
//       phases: {
//         build: {
//           commands: 'export MY_VAR="some value"',
//         },
//       },
//     }),
//   }),    outputs: [buildOutput] 




// // The basic pipeline declaration. This sets the initial structure
//     // of our pipeline

// const CICDpipeline = new CodePipeline(this, 'Pipeline', {
//     pipelineName: 'WorkshopPipeline',
//     //Stage
//     synth: new CodeBuildStep('SynthStep', {
//       input: CodePipelineSource.codeCommit(girrepoAP, 'master'),


//       installCommands: [
//         'npm install -g aws-cdk'
//       ],
//       commands: [
//         'npm ci',
//         'npm run build',
//         'npx cdk synth'
//       ]
//     }
//     )
//   });



//   // Pipeline 

//       /**
//      * Pipeline を定義し、あらかじめ作っておいたアクションを任意のステージに設置する
//     **/
//        const pipeline = new Pipeline(stack, 'GreetingApplicationDeploy-pipeline', {
//         pipelineName: 'GreetingApplicationDeploy-pipeline',
//     });

//     pipeline.addStage({
//         stageName: 'GitHubSourceAction-stage',
//         actions: [sourceAction],
//     });

//     pipeline.addStage({
//         stageName: 'GreetingApplicationDeploy-stage',
//         actions: [approvalAction, applicationDeployAction],
//     });

//     return stack;
// }
