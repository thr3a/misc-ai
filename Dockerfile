# ref: https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM node:22-bookworm-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates xz-utils

RUN curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz > ffmpeg.tar.gz \
  && tar xfv ffmpeg.tar.gz \
  && cp ./ffmpeg*-static/ffmpeg /usr/bin/

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/download/2024.08.06/yt-dlp_linux > yt-dlp_linux \
  && chmod 555 yt-dlp_linux

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=builder /app/yt-dlp_linux /usr/bin/yt-dlp_linux

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "node-server"]
