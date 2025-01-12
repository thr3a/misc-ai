# builder-examples.md

# Builder examples

## Using remote builder for single-arch

If you're developing on ARM64 (like Apple Silicon), but you want to deploy on AMD64 (x86 64-bit), by default, Kamal will set up a local buildx configuration that does this through QEMU emulation. However, this can be quite slow, especially on the first build.

If you want to speed up this process by using a remote AMD64 host to natively build the AMD64 part of the image, you can set a remote builder:

```yaml
builder:
  arch: amd64
  remote: ssh://root@192.168.0.1
```

Kamal will use the remote to build when deploying from an ARM64 machine, or build locally when deploying from an AMD64 machine.

**Note:** You must have Docker running on the remote host being used as a builder. This instance should only be shared for builds using the same registry and credentials.

## Using remote builder for multi-arch

You can also build a multi-arch image. If a remote is set, Kamal will build the architecture matching your deployment server locally and the other architecture remotely.

So if you're developing on ARM64 (like Apple Silicon), it will build the ARM64 architecture locally and the AMD64 architecture remotely.

```yaml
builder:
  arch:
    - amd64
    - arm64
  remote: ssh://root@192.168.0.1
```

## Using local builder for single-arch

If you always want to build locally for a single architecture, Kamal will build the image using a local buildx instance.

```yaml
builder:
  arch: amd64
```

## Using a different Dockerfile or context when building

If you need to pass a different Dockerfile or context to the build command (e.g., if you're using a monorepo or you have different Dockerfiles), you can do so in the builder options:

```yaml
# Use a different Dockerfile
builder:
  dockerfile: Dockerfile.xyz

# Set context
builder:
  context: ".."

# Set Dockerfile and context
builder:
  dockerfile: "../Dockerfile.xyz"
  context: ".."
```

## Using multistage builder cache

Docker multistage build cache can speed up your builds. Currently, Kamal only supports using the GHA cache or the Registry cache:

```yaml
# Using GHA cache
builder:
  cache:
    type: gha

# Using Registry cache
builder:
  cache:
    type: registry

# Using Registry cache with different cache image
builder:
  cache:
    type: registry
    # default image name is <image>-build-cache
    image: application-cache-image

# Using Registry cache with additional cache-to options
builder:
  cache:
    type: registry
    options: mode=max,image-manifest=true,oci-mediatypes=true
```

### GHA cache configuration

To make it work on the GitHub action workflow, you need to set up the buildx and expose authentication configuration for the cache.

Example setup (in .github/workflows/sample-ci.yml):

```yaml
- name: Set up Docker Buildx for cache
  uses: docker/setup-buildx-action@v3

- name: Expose GitHub Runtime for cache
  uses: crazy-max/ghaction-github-runtime@v3
```

When set up correctly, you should see the cache entry/entries on the GHA workflow actions cache section.

For further insights into build cache optimization, check out the documentation on Docker's official website: https://docs.docker.com/build/cache/.

## Using build secrets for new images

Some images need a secret passed in during build time, like a GITHUB\_TOKEN, to give access to private gem repositories. This can be done by setting the secret in `.kamal/secrets`, then referencing it in the builder configuration:

```bash
# .kamal/secrets

GITHUB_TOKEN=$(gh config get -h github.com oauth_token)
```

```yaml
# config/deploy.yml

builder:
  secrets:
    - GITHUB_TOKEN
```

This build secret can then be referenced in the Dockerfile:

```dockerfile
# Copy Gemfiles
COPY Gemfile Gemfile.lock ./

# Install dependencies, including private repositories via access token (then remove bundle cache with exposed GITHUB_TOKEN)
RUN --mount=type=secret,id=GITHUB_TOKEN \
  BUNDLE_GITHUB__COM=x-access-token:$(cat /run/secrets/GITHUB_TOKEN) \
  bundle install && \
  rm -rf /usr/local/bundle/cache
```

## Configuring build args for new images

Build arguments that aren't secret can also be configured:

```yaml
builder:
  args:
    RUBY_VERSION: 3.2.0
```

This build argument can then be used in the Dockerfile:

```dockerfile
ARG RUBY_VERSION
FROM ruby:$RUBY_VERSION-slim as base
```

# overview.md

# Kamal Configuration

Configuration is read from the `config/deploy.yml`.

## Destinations

When running commands, you can specify a destination with the `-d` flag,
e.g., `kamal deploy -d staging`.

In this case, the configuration will also be read from `config/deploy.staging.yml`
and merged with the base configuration.

## Anchors

Kamal will not accept unrecognized keys in the configuration file.

However, you might want to declare a configuration block using YAML anchors
and aliases to avoid repetition.

You can prefix a configuration section with `x-` to indicate that it is an
anchor. Kamal will ignore the anchor and not raise an error. See Anchors for more information.

## The service name

This is a required value. It is used as the container name prefix.

```yaml
service: myapp
```

## The Docker image name

The image will be pushed to the configured registry.

```yaml
image: my-image
```

## Labels

Additional labels to add to the container:

```yaml
labels:
  my-label: my-value
```

## Volumes

Additional volumes to mount into the container:

```yaml
volumes:
  - /path/on/host:/path/in/container:ro
```

## Registry

The Docker registry configuration, see Docker Registry:

```yaml
registry:
  ...
```

## Servers

The servers to deploy to, optionally with custom roles, see Servers:

```yaml
servers:
  ...
```

## Environment variables

See Environment variables:

```yaml
env:
  ...
```

## Asset path

Used for asset bridging across deployments, default to `nil`.

If there are changes to CSS or JS files, we may get requests
for the old versions on the new container, and vice versa.

To avoid 404s, we can specify an asset path.
Kamal will replace that path in the container with a mapped
volume containing both sets of files.
This requires that file names change when the contents change
(e.g., by including a hash of the contents in the name).

To configure this, set the path to the assets:

```yaml
asset_path: /path/to/assets
```

## Hooks path

Path to hooks, defaults to `.kamal/hooks`.
See Hooks for more information:

```yaml
hooks_path: /user_home/kamal/hooks
```

## Require destinations

Whether deployments require a destination to be specified, defaults to `false`:

```yaml
require_destination: true
```

## Primary role

This defaults to `web`, but if you have no web role, you can change this:

```yaml
primary_role: workers
```

## Allowing empty roles

Whether roles with no servers are allowed. Defaults to `false`:

```yaml
allow_empty_roles: false
```

## Retain containers

How many old containers and images we retain, defaults to 5:

```yaml
retain_containers: 3
```

## Minimum version

The minimum version of Kamal required to deploy this configuration, defaults to `nil`:

```yaml
minimum_version: 1.3.0
```

## Readiness delay

Seconds to wait for a container to boot after it is running, default 7.

This only applies to containers that do not run a proxy or specify a healthcheck:

```yaml
readiness_delay: 4
```

## Deploy timeout

How long to wait for a container to become ready, default 30:

```yaml
deploy_timeout: 10
```

## Drain timeout

How long to wait for a container to drain, default 30:

```yaml
drain_timeout: 10
```

## Run directory

Directory to store kamal runtime files in on the host, default `.kamal`:

```yaml
run_directory: /etc/kamal
```

## SSH options

See SSH:

```yaml
ssh:
  ...
```

## Builder options

See Builders:

```yaml
builder:
  ...
```

## Accessories

Additional services to run in Docker, see Accessories:

```yaml
accessories:
  ...
```

## Proxy

Configuration for kamal-proxy, see Proxy:

```yaml
proxy:
  ...
```

## SSHKit

See SSHKit:

```yaml
sshkit:
  ...
```

## Boot options

See Booting:

```yaml
boot:
  ...
```

## Logging

Docker logging configuration, see Logging:

```yaml
logging:
  ...
```

## Aliases

Alias configuration, see Aliases:

```yaml
aliases:
  ...
```

# environment-variables.md

# Environment variables

Environment variables can be set directly in the Kamal configuration or
read from `.kamal/secrets`.

## Reading environment variables from the configuration

Environment variables can be set directly in the configuration file.

These are passed to the `docker run` command when deploying.

```yaml
env:
  DATABASE_HOST: mysql-db1
  DATABASE_PORT: 3306
```

## Secrets

Kamal uses dotenv to automatically load environment variables set in the `.kamal/secrets` file.

If you are using destinations, secrets will instead be read from `.kamal/secrets.<DESTINATION>` if
it exists.

Common secrets across all destinations can be set in `.kamal/secrets-common`.

This file can be used to set variables like `KAMAL_REGISTRY_PASSWORD` or database passwords.
You can use variable or command substitution in the secrets file.

```shell
KAMAL_REGISTRY_PASSWORD=$KAMAL_REGISTRY_PASSWORD
RAILS_MASTER_KEY=$(cat config/master.key)
```

You can also use secret helpers for some common password managers.

```shell
SECRETS=$(kamal secrets fetch ...)

REGISTRY_PASSWORD=$(kamal secrets extract REGISTRY_PASSWORD $SECRETS)
DB_PASSWORD=$(kamal secrets extract DB_PASSWORD $SECRETS)
```

If you store secrets directly in `.kamal/secrets`, ensure that it is not checked into version control.

To pass the secrets, you should list them under the `secret` key. When you do this, the
other variables need to be moved under the `clear` key.

Unlike clear values, secrets are not passed directly to the container
but are stored in an env file on the host:

```yaml
env:
  clear:
    DB_USER: app
  secret:
    - DB_PASSWORD
```

## Tags

Tags are used to add extra env variables to specific hosts.
See Servers for how to tag hosts.

Tags are only allowed in the top-level env configuration (i.e., not under a role-specific env).

The env variables can be specified with secret and clear values as explained above.

```yaml
env:
  tags:
    <tag1>:
      MYSQL_USER: monitoring
    <tag2>:
      clear:
        MYSQL_USER: readonly
      secret:
        - MYSQL_PASSWORD
```

## Example configuration

```yaml
env:
  clear:
    MYSQL_USER: app
  secret:
    - MYSQL_PASSWORD
  tags:
    monitoring:
      MYSQL_USER: monitoring
    replica:
      clear:
        MYSQL_USER: readonly
      secret:
        - READONLY_PASSWORD
```

# aliases.md

# Aliases

Aliases are shortcuts for Kamal commands.

For example, for a Rails app, you might open a console with:

```shell
kamal app exec -i --reuse "bin/rails console"
```

By defining an alias, like this:

```yaml
aliases:
  console: app exec -i --reuse "bin/rails console"
```

You can now open the console with:

```shell
kamal console
```

## Configuring aliases

Aliases are defined in the root config under the alias key.

Each alias is named and can only contain lowercase letters, numbers, dashes, and underscores:

```yaml
aliases:
  uname: app exec -p -q -r web "uname -a"
```

# anchors.md

# Anchors

You can re-use parts of your Kamal configuration by defining them as anchors and referencing them with aliases.

For example, you might need to define a shared healthcheck for multiple worker roles. Anchors
begin with `x-` and are defined at the root level of your deploy.yml file.

```yaml
x-worker-healthcheck: &worker-healthcheck
  health-cmd: bin/worker-healthcheck
  health-start-period: 5s
  health-retries: 5
  health-interval: 5s
```

To use this anchor in your deploy configuration, reference it via the alias.

```yaml
servers:
  worker:
    hosts:
      - 867.53.0.9
    cmd: bin/jobs
    options:
      <<: *worker-healthcheck
```

# accessories.md

# Accessories

Accessories can be booted on a single host, a list of hosts, or on specific roles.
The hosts do not need to be defined in the Kamal servers configuration.

Accessories are managed separately from the main service — they are not updated
when you deploy, and they do not have zero-downtime deployments.

Run `kamal accessory boot <accessory>` to boot an accessory.
See `kamal accessory --help` for more information.

## Configuring accessories

First, define the accessory in the `accessories`:

```yaml
accessories:
  mysql:
```

## Service name

This is used in the service label and defaults to `<service>-<accessory>`,
where `<service>` is the main service name from the root configuration:

```yaml
    service: mysql
```

## Image

The Docker image to use, prefix it with a registry if not using Docker Hub:

```yaml
    image: mysql:8.0
```

## Accessory hosts

Specify one of `host`, `hosts`, or `roles`:

```yaml
    host: mysql-db1
    hosts:
      - mysql-db1
      - mysql-db2
    roles:
      - mysql
```

## Custom command

You can set a custom command to run in the container if you do not want to use the default:

```yaml
    cmd: "bin/mysqld"
```

## Port mappings

See https://docs.docker.com/network/, and
especially note the warning about the security implications of exposing ports publicly.

```yaml
    port: "127.0.0.1:3306:3306"
```

## Labels

```yaml
    labels:
      app: myapp
```

## Options

These are passed to the Docker run command in the form `--<name> <value>`:

```yaml
    options:
      restart: always
      cpus: 2
```

## Environment variables

See Environment variables for more information:

```yaml
    env:
      ...
```

## Copying files

You can specify files to mount into the container.
The format is `local:remote`, where `local` is the path to the file on the local machine
and `remote` is the path to the file in the container.

They will be uploaded from the local repo to the host and then mounted.

ERB files will be evaluated before being copied.

```yaml
    files:
      - config/my.cnf.erb:/etc/mysql/my.cnf
      - config/myoptions.cnf:/etc/mysql/myoptions.cnf
```

## Directories

You can specify directories to mount into the container. They will be created on the host
before being mounted:

```yaml
    directories:
      - mysql-logs:/var/log/mysql
```

## Volumes

Any other volumes to mount, in addition to the files and directories.
They are not created or copied before mounting:

```yaml
    volumes:
      - /path/to/mysql-logs:/var/log/mysql
```

## Network

The network the accessory will be attached to.

Defaults to kamal:

```yaml
    network: custom
```

## Proxy

You can run your accessory behind the Kamal proxy. See Proxy for more information.

```yaml
    proxy:
      ...
```

# ssh.md

# SSH configuration

Kamal uses SSH to connect and run commands on your hosts.
By default, it will attempt to connect to the root user on port 22.

If you are using a non-root user, you may need to bootstrap your servers manually before using them with Kamal. On Ubuntu, you’d do:

```shell
sudo apt update
sudo apt upgrade -y
sudo apt install -y docker.io curl git
sudo usermod -a -G docker app
```

## SSH options

The options are specified under the ssh key in the configuration file.

```yaml
ssh:
```

## The SSH user

Defaults to `root`:

```yaml
  user: app
```

## The SSH port

Defaults to 22:

```yaml
  port: "2222"
```

## Proxy host

Specified in the form <host> or <user>@<host>:

```yaml
  proxy: root@proxy-host
```

## Proxy command

A custom proxy command, required for older versions of SSH:

```yaml
  proxy_command: "ssh -W %h:%p user@proxy"
```

## Log level

Defaults to `fatal`. Set this to `debug` if you are having SSH connection issues.

```yaml
  log_level: debug
```

## Keys only

Set to `true` to use only private keys from the `keys` and `key_data` parameters,
even if ssh-agent offers more identities. This option is intended for
situations where ssh-agent offers many different identities or you
need to overwrite all identities and force a single one.

```yaml
  keys_only: false
```

## Keys

An array of file names of private keys to use for public key
and host-based authentication:

```yaml
  keys: [ "~/.ssh/id.pem" ]
```

## Key data

An array of strings, with each element of the array being
a raw private key in PEM format.

```yaml
  key_data: [ "-----BEGIN OPENSSH PRIVATE KEY-----" ]
```

## Config

Set to true to load the default OpenSSH config files (~/.ssh/config,
/etc/ssh\_config), to false ignore config files, or to a file path
(or array of paths) to load specific configuration. Defaults to true.

```yaml
  config: true
```

# sshkit.md

# SSHKit

SSHKit is the SSH toolkit used by Kamal.

The default, settings should be sufficient for most use cases, but
when connecting to a large number of hosts, you may need to adjust.

## SSHKit options

The options are specified under the sshkit key in the configuration file.

```yaml
sshkit:
```

## Max concurrent starts

Creating SSH connections concurrently can be an issue when deploying to many servers.
By default, Kamal will limit concurrent connection starts to 30 at a time.

```yaml
  max_concurrent_starts: 10
```

## Pool idle timeout

Kamal sets a long idle timeout of 900 seconds on connections to try to avoid
re-connection storms after an idle period, such as building an image or waiting for CI.

```yaml
  pool_idle_timeout: 300
```

# roles.md

# Roles

Roles are used to configure different types of servers in the deployment.
The most common use for this is to run web servers and job servers.

Kamal expects there to be a `web` role, unless you set a different `primary_role`
in the root configuration.

## Role configuration

Roles are specified under the servers key:

```yaml
servers:
```

## Simple role configuration

This can be a list of hosts if you don't need custom configuration for the role.

You can set tags on the hosts for custom env variables (see Environment variables):

```yaml
  web:
    - 172.1.0.1
    - 172.1.0.2: experiment1
    - 172.1.0.2: [ experiment1, experiment2 ]
```

## Custom role configuration

When there are other options to set, the list of hosts goes under the `hosts` key.

By default, only the primary role uses a proxy.

For other roles, you can set it to `proxy: true` to enable it and inherit the root proxy
configuration or provide a map of options to override the root configuration.

For the primary role, you can set `proxy: false` to disable the proxy.

You can also set a custom `cmd` to run in the container and overwrite other settings
from the root configuration.

```yaml
  workers:
    hosts:
      - 172.1.0.3
      - 172.1.0.4: experiment1
    cmd: "bin/jobs"
    options:
      memory: 2g
      cpus: 4
    logging:
      ...
    proxy:
      ...
    labels:
      my-label: workers
    env:
      ...
    asset_path: /public
```

# index.md

# logging.md

# Custom logging configuration

Set these to control the Docker logging driver and options.

## Logging settings

These go under the logging key in the configuration file.

This can be specified at the root level or for a specific role.

```yaml
logging:
```

## Driver

The logging driver to use, passed to Docker via `--log-driver`:

```yaml
  driver: json-file
```

## Options

Any logging options to pass to the driver, passed to Docker via `--log-opt`:

```yaml
  options:
    max-size: 100m
```

# builders.md

# Builder

The builder configuration controls how the application is built with `docker build`.

See Builder examples for more information.

## Builder options

Options go under the builder key in the root configuration.

```yaml
builder:
```

## Arch

The architectures to build for — you can set an array or just a single value.

Allowed values are `amd64` and `arm64`:

```yaml
  arch:
    - amd64
```

## Remote

The connection string for a remote builder. If supplied, Kamal will use this
for builds that do not match the local architecture of the deployment host.

```yaml
  remote: ssh://docker@docker-builder
```

## Local

If set to false, Kamal will always use the remote builder even when building
the local architecture.

Defaults to true:

```yaml
  local: true
```

## Builder cache

The type must be either 'gha' or 'registry'.

The image is only used for registry cache and is not compatible with the Docker driver:

```yaml
  cache:
    type: registry
    options: mode=max
    image: kamal-app-build-cache
```

## Build context

If this is not set, then a local Git clone of the repo is used.
This ensures a clean build with no uncommitted changes.

To use the local checkout instead, you can set the context to `.`, or a path to another directory.

```yaml
  context: .
```

## Dockerfile

The Dockerfile to use for building, defaults to `Dockerfile`:

```yaml
  dockerfile: Dockerfile.production
```

## Build target

If not set, then the default target is used:

```yaml
  target: production
```

## Build arguments

Any additional build arguments, passed to `docker build` with `--build-arg <key>=<value>`:

```yaml
  args:
    ENVIRONMENT: production
```

## Referencing build arguments

```shell
ARG RUBY_VERSION
FROM ruby:$RUBY_VERSION-slim as base
```

## Build secrets

Values are read from `.kamal/secrets`:

```yaml
  secrets:
    - SECRET1
    - SECRET2
```

## Referencing build secrets

```shell
# Copy Gemfiles
COPY Gemfile Gemfile.lock ./

# Install dependencies, including private repositories via access token
# Then remove bundle cache with exposed GITHUB_TOKEN
RUN --mount=type=secret,id=GITHUB_TOKEN \
  BUNDLE_GITHUB__COM=x-access-token:$(cat /run/secrets/GITHUB_TOKEN) \
  bundle install && \
  rm -rf /usr/local/bundle/cache
```

## SSH

SSH agent socket or keys to expose to the build:

```yaml
  ssh: default=$SSH_AUTH_SOCK
```

## Driver

The build driver to use, defaults to `docker-container`:

```yaml
  driver: docker
```

## Provenance

It is used to configure provenance attestations for the build result.
The value can also be a boolean to enable or disable provenance attestations.

```yaml
  provenance: mode=max
```

## SBOM (Software Bill of Materials)

It is used to configure SBOM generation for the build result.
The value can also be a boolean to enable or disable SBOM generation.

```yaml
  sbom: true
```

# docker-registry.md

# Registry

The default registry is Docker Hub, but you can change it using `registry/server`.

By default, Docker Hub creates public repositories. To avoid making your images public,
set up a private repository before deploying, or change the default repository privacy
settings to private in your Docker Hub settings.

A reference to a secret (in this case, `DOCKER_REGISTRY_TOKEN`) will look up the secret
in the local environment:

```yaml
registry:
  server: registry.digitalocean.com
  username:
    - DOCKER_REGISTRY_TOKEN
  password:
    - DOCKER_REGISTRY_TOKEN
```

## Using AWS ECR as the container registry

You will need to have the AWS CLI installed locally for this to work.
AWS ECR’s access token is only valid for 12 hours. In order to avoid having to manually regenerate the token every time, you can use ERB in the `deploy.yml` file to shell out to the AWS CLI command and obtain the token:

```yaml
registry:
  server: <your aws account id>.dkr.ecr.<your aws region id>.amazonaws.com
  username: AWS
  password: <%= %x(aws ecr get-login-password) %>
```

## Using GCP Artifact Registry as the container registry

To sign into Artifact Registry, you need to
create a service account
and set up roles and permissions.
Normally, assigning the `roles/artifactregistry.writer` role should be sufficient.

Once the service account is ready, you need to generate and download a JSON key and base64 encode it:

```shell
base64 -i /path/to/key.json | tr -d "\\n"
```

You'll then need to set the `KAMAL_REGISTRY_PASSWORD` secret to that value.

Use the environment variable as the password along with `_json_key_base64` as the username.
Here’s the final configuration:

```yaml
registry:
  server: <your registry region>-docker.pkg.dev
  username: _json_key_base64
  password:
    - KAMAL_REGISTRY_PASSWORD
```

## Validating the configuration

You can validate the configuration by running:

```shell
kamal registry login
```

# booting.md

# Booting

When deploying to large numbers of hosts, you might prefer not to restart your services on every host at the same time.

Kamal’s default is to boot new containers on all hosts in parallel. However, you can control this with the boot configuration.

## Fixed group sizes

Here, we boot 2 hosts at a time with a 10-second gap between each group:

```yaml
boot:
  limit: 2
  wait: 10
```

## Percentage of hosts

Here, we boot 25% of the hosts at a time with a 2-second gap between each group:

```yaml
boot:
  limit: 25%
  wait: 2
```

# servers.md

# Servers

Servers are split into different roles, with each role having its own configuration.

For simpler deployments, though, where all servers are identical, you can just specify a list of servers.
They will be implicitly assigned to the `web` role.

```yaml
servers:
  - 172.0.0.1
  - 172.0.0.2
  - 172.0.0.3
```

## Tagging servers

Servers can be tagged, with the tags used to add custom env variables (see Environment variables).

```yaml
servers:
  - 172.0.0.1
  - 172.0.0.2: experiments
  - 172.0.0.3: [ experiments, three ]
```

## Roles

For more complex deployments (e.g., if you are running job hosts), you can specify roles and configure each separately (see Roles):

```yaml
servers:
  web:
    ...
  workers:
    ...
```

# cron.md

# Cron

You can use a specific container to run your Cron jobs:

```yaml
servers:
  cron:
    hosts:
      - 192.168.0.1
    cmd:
      bash -c "(env && cat config/crontab) | crontab - && cron -f"
```

This assumes that the Cron settings are stored in `config/crontab`. Cron does not automatically propagate environment variables, the example above copies them into the crontab.

# proxy.md

# Proxy

Kamal uses kamal-proxy to provide
gapless deployments. It runs on ports 80 and 443 and forwards requests to the
application container.

The proxy is configured in the root configuration under `proxy`. These are
options that are set when deploying the application, not when booting the proxy.

They are application-specific, so they are not shared when multiple applications
run on the same proxy.

The proxy is enabled by default on the primary role but can be disabled by
setting `proxy: false`.

It is disabled by default on all other roles but can be enabled by setting
`proxy: true` or providing a proxy configuration.

```yaml
proxy:
```

## Hosts

The hosts that will be used to serve the app. The proxy will only route requests
to this host to your app.

If no hosts are set, then all requests will be forwarded, except for matching
requests for other apps deployed on that server that do have a host set.

Specify one of `host` or `hosts`.

```yaml
  host: foo.example.com
  hosts:
    - foo.example.com
    - bar.example.com
```

## App port

The port the application container is exposed on.

Defaults to 80:

```yaml
  app_port: 3000
```

## SSL

kamal-proxy can provide automatic HTTPS for your application via Let's Encrypt.

This requires that we are deploying to one server and the host option is set.
The host value must point to the server we are deploying to, and port 443 must be
open for the Let's Encrypt challenge to succeed.

If you set `ssl` to `true`, `kamal-proxy` will stop forwarding headers to your app,
unless you explicitly set `forward_headers: true`

Defaults to `false`:

```yaml
  ssl: true
```

## Forward headers

Whether to forward the `X-Forwarded-For` and `X-Forwarded-Proto` headers.

If you are behind a trusted proxy, you can set this to `true` to forward the headers.

By default, kamal-proxy will not forward the headers if the `ssl` option is set to `true`, and
will forward them if it is set to `false`.

```yaml
  forward_headers: true
```

## Response timeout

How long to wait for requests to complete before timing out, defaults to 30 seconds:

```yaml
  response_timeout: 10
```

## Healthcheck

When deploying, the proxy will by default hit `/up` once every second until we hit
the deploy timeout, with a 5-second timeout for each request.

Once the app is up, the proxy will stop hitting the healthcheck endpoint.

```yaml
  healthcheck:
    interval: 3
    path: /health
    timeout: 3
```

## Buffering

Whether to buffer request and response bodies in the proxy.

By default, buffering is enabled with a max request body size of 1GB and no limit
for response size.

You can also set the memory limit for buffering, which defaults to 1MB; anything
larger than that is written to disk.

```yaml
  buffering:
    requests: true
    responses: true
    max_request_body: 40_000_000
    max_response_body: 0
    memory: 2_000_000
```

## Logging

Configure request logging for the proxy.
You can specify request and response headers to log.
By default, `Cache-Control`, `Last-Modified`, and `User-Agent` request headers are logged:

```yaml
  logging:
    request_headers:
      - Cache-Control
      - X-Forwarded-Proto
    response_headers:
      - X-Request-ID
      - X-Request-Start
```
