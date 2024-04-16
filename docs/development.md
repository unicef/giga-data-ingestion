# Development Lifecycle

## Trunk Based Development

![Trunk Based Development](https://trunkbaseddevelopment.com/trunk1b.png)

The giga-data-ingestion project follows the concept of Trunk-based Development,
wherein User Stories are worked on PRs. PRs then get merged to `main` once approved by
the team.

The main branch serves as the most up-to-date version of the code base.

### Naming Format

**Branch Names:**

Refer to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

**PR Title:** `[<Feature/Fix/Release/Hotfix>](<issue-id>) <Short desc>`

**PR Template:** [pull_request_template.md](../.github/pull_request_template.md)

### Development Workflow

- Branch off from `main` to ensure you get the latest code.
- Name your branch according to the Naming Conventions.
- Keep your commits self-contained and your PRs small and tailored to a specific feature
  as much as possible.
- Push your commits, open a PR and fill in the PR template.
- Request a review from 1 other developer.
- Once approved, rebase/squash your commits into `main`.

## Local Development

### Prerequisites

- [ ] [Docker](https://docs.docker.com/engine/)
- [ ] [Kubernetes](https://kubernetes.io/docs/tasks/tools/)
- [ ] [Helm](https://helm.sh/docs/intro/install/)
- [ ] [pyenv](https://github.com/pyenv/pyenv)
- [ ] [Poetry](https://python-poetry.org/docs/#installation)
- [ ] [Task](https://taskfile.dev/installation/#install-script)
- [ ] [ADR Tools](https://github.com/npryce/adr-tools)

### Install backend dependencies

```shell
cd api
pyenv install 3.11
poetry env use 3.11
poetry install
```

### Install frontend dependencies

```shell
cd ui
nvm install 18
nvm use
npm i
```

### Install pre-commit

```shell
pip install pre-commit
pre-commit install
```

### File Structure Walkthrough

- `docs/` - This folder contains all Markdown files for creating Backstage TechDocs.

### Pre-requisites

`@TODO: Fill with pre-reqs such as access to Cloud Platform, Bitwarden Collection, Github etc`

### Cloning and Installation

`@TODO: Fill with set-up/installation guide. Feel free to subdivide to sections or multiple MD files through mkdocs.yml`

### Environment Setup

`@TODO: Fill with instructions for exporting local env variables. Distinguish variables being used in local vs dev vs prod`

### Running the Application

`@TODO: Fill with steps on running the app locally. Feel free to subdivide to sections or multiple MD files through mkdocs.yml`




#### Common Issues


###### Updating the schema
When making changes to the models you will need to also update the fixtures:

0. `[Only do this if running step 1 does not work]`. You might need to manually add in temporary values to the fixtures you updated. [sample fixtures file](api/data_ingestion/fixtures/qos_school_list.yaml). If you updated the migrations and are spinning up a new database, the container will continuously try to load up the old fixtures file which will cause it to continuously error.
1. Update the actual fixtures file [sample fixture file](api/scripts/generate_qos_fixtures.py)
2. Run `task load-fixtures -- [YOUR_FIXTURE_NAME]`

###### [Adding non nullable columns to existing table](https://stackoverflow.com/questions/33705697/alembic-integrityerror-column-contains-null-values-when-adding-non-nullable)
