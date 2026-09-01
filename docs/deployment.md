# Deployment Procedure

CI/CD has been set up with Azure DevOps. To deploy, simply merge changes into the
relevant branch:

`main` > DEV

`staging` > STG

`production` > PRD

The version number promoted along with the code comes from the `VERSION` file at the
repository root. See [Versioning](versioning.md) for how to cut a release.

To manually trigger deployments, go to
the [Pipelines](https://unicef.visualstudio.com/OI-GIGA/_build) page and trigger
the relevant pipeline:

- giga-data-ingestion-deploy-dev
- giga-data-ingestion-deploy-stg
- giga-data-ingestion-deploy-prd
