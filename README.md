# github-version-and-merge-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) that Versions and merges PRs after PR comments

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t github-version-and-merge-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> github-version-and-merge-bot
```

## Contributing

If you have suggestions for how github-version-and-merge-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2021 Richard Palmer <rich@rdjpalmer.com>
