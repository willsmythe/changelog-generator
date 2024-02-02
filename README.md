# Changelog Generator

GitHub Action that generates a markdown changelog of closed issues in a GitHub project.

## Using in a workflow

```yml

```

## Running locally

### Install dependencies (one-time)

```bash
npm install
```

### Set inputs

See `action.yml` for all inputs, but as an example:

```bash
export INPUT_TOKEN=xxxx
export INPUT_PROJECTS=github/7714
export INPUT_DAYS=21
export INPUT_EXCLUDE_LABELS=no changelog,epic,Stale
export INPUT_HIGHLIGHT_LABELS=bug,performance,feature
```

### Build and run

```bash
npm run br
```
