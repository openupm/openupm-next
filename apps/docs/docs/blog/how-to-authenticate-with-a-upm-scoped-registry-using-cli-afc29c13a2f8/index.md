---
title: "How to Authenticate with a UPM Scoped Registry using CLI"
author: "Favo Yang"
date: "2020-08-02"
readingTime: "4 min read"
originalUrl: "https://medium.com/openupm/how-to-authenticate-with-a-upm-scoped-registry-using-cli-afc29c13a2f8"
description: "A practical walkthrough of using openupm-cli to write Unity scoped registry authentication into .upmconfig.toml."
editLink: false
---
# How to Authenticate with a UPM Scoped Registry using CLI

<BlogPostMeta />


Starting from Unity 2019.3.4f1, developers can authenticate with a scoped NPM registry by following [verbose instructions](https://forum.unity.com/threads/npm-registry-authentication.836308/). Eventually, Unity will add authentication UI support in Unity Hub. Before that, you can use the `openupm login` command to simplify the process to make your life easier.

## How it works

![Image 4](./images/how-to-authenticate-with-a-upm-scoped-registry-using-cli-afc29c13a2f8-01-image-4.jpg)

Authentication is important for sharing private packages with your team members to fulfill security requirements. Unity allows you to configure the `.upmconfig.toml` file to authenticate with a scoped registry. The file is located at:

*   Windows: `%USERPROFILE%/.upmconfig.toml`
*   Windows (System user) : `%ALLUSERSPROFILE%Unity/config/ServiceAccounts/.upmconfig.toml`
*   Linux and macOS: `~/.upmconfig.toml`

You can verify the authentication by viewing the file content later.

There are two ways to authenticate with an npm server:

*   using token (recommended): a server-generated persistent string for the grant of access and publishing rights.
*   using basic authentication: the `username:password` pair (base64 encoded) is stored locally to authenticate with the server on each request.

Both are supported by openupm-cli `login` command since 1.11.0. Please upgrade to the latest version first.

```bash
npm install openupm-cli@latest -g
```
> After login, all openupm-cli commands will use `.upmconfig.toml` configuration to authenticate with your private scoped registry.

## Using token

```bash
openupm login -u <username> -e <email> -r <registry> -p <password>
openupm login -u user1 -e user1@example.com -r http://127.0.0.1:4873
```
If you don’t provide a username, email, or password, it will prompt you to input the value.

If your npm server doesn’t require an email field, you can provide a dummy one like `yourname@example.com`.

Notice that for the npm server allows user creation via CLI, providing a new username will create a new user.

The token is usually persistent so that requesting a new token is not meant to invalidate old ones depends on your npm vendor.

The token is also stored (or updated) to the `.npmrc` file for convenience.

```ini
//127.0.0.1:4873/:_authToken="token string here"
```
After the authentication your `.upmconfig.toml` will look like:

```toml
[npmAuth."http://127.0.0.1:4873"]
email = "user1@example.com"
alwaysAuth = false
token = "token string here"
```

## Using basic authentication

Adding `--basic-auth` option to use basic authentication. You should only use this option when your npm vendor does not offer the authentication token. Make sure you understand the risk that the `username:password` base64 encoded string (still a plain text) is stored in your local machine.

```bash
openupm login -u <username> -e <email> -r <registry> -p <password> --basic-auth
openupm login -u user1 -e user1@example.com -r http://127.0.0.1:4873 --basic-auth
```
Notice that your username and password is not verified during the login process, but simply stored to the `.upmconfig.toml` file. Because verifying the password against your npm server will generate a token, which is not what you want here. Basically, type your password carefully.

Unlike using the token, `.npmrc` lacks syntax to support multiple registries for basic authentication. Hence, the `.npmrc` is not updated for the basic authentication.

After the authentication your `.upmconfig.toml` will look like:

```toml
[npmAuth."http://127.0.0.1:4873"]
email = "user1@example.com"
alwaysAuth = false
_auth = "base64 encoded username:password pair"
```

## Always auth

Adding `--always-auth` option if tarball files hosted on a different domain other than the registry domain.

```bash
openupm login -u <username> -e <email> -r <registry> -p <password> --always-auth
openupm login -u user1 -e user1@example.com -r http://127.0.0.1:4873 --always-auth
```
## Windows Subsystem for Linux (WSL)

By default, the command treats the Windows Subsystem for Linux (WSL) as a Linux system. But if you want to authenticate for the Windows (probably where your Unity installed on), add the `--wsl` option.

> _Known issue: run with_`--wsl`_option may clear the terminal screen during the process._

## Authenticate for Windows system user

Make sure you have the right permission, then add the `--system-user` option to authenticate for the Windows system user.

## The trailing slash issue

The registry address should match exactly with your `manifest.json`. This can be confusing because:

*   The `manifest.json` file usually uses a registry address without a trailing slash.
*   The `.npmrc` file always added the trailing slash.

To make it clear, the command always trimmed the trailing slash when storing it to the `.upmconfig.toml` file. Make sure the `manifest.json` file follow the same rule: i.e. use `http://127.0.0.1:4873` instead of `http://127.0.0.1:4873/`.

If you find any issue to authenticate with an npm registry vendor, please ask for help on [this thread](https://forum.unity.com/threads/npm-registry-authentication.836308/) or [create an issue](https://github.com/openupm/openupm-cli/issues/new).


<BlogPostNav />
