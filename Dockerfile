FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm


# Express
FROM base AS deps-express
WORKDIR /home/node/repo

COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./
COPY ./examples/express/package.json ./examples/express/
COPY ./lib/package.json ./lib/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile


FROM base AS build-express
WORKDIR /home/node/repo
COPY --from=deps-express /home/node/repo ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . /home/node/repo

RUN pnpm --filter !esi-next run build
RUN pnpm deploy --filter esi-express --prod /home/node/esi-express

FROM base AS esi-express
COPY --from=build-express /home/node/esi-express /home/node/esi-express
WORKDIR /home/node/esi-express
USER node
EXPOSE 3000
CMD [ "node", "dist/server.js" ]



# Nextjs
FROM base AS deps-next
WORKDIR /home/node/repo

COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./
COPY ./examples/next/package.json ./examples/next/
COPY ./lib/package.json ./lib/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile


FROM base AS build-next
WORKDIR /home/node/repo
COPY --from=deps-next /home/node/repo ./
COPY . /home/node/repo

ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter !esi-express run build
RUN pnpm deploy --filter esi-next --prod /home/node/esi-next


FROM base AS esi-next
WORKDIR /home/node/esi-next

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next
COPY --from=build-next --chown=node:node /home/node/esi-next/public ./public
COPY --from=build-next --chown=node:node /home/node/esi-next/node_modules ./node_modules
COPY --from=build-next --chown=node:node /home/node/esi-next/.next/standalone ./
COPY --from=build-next --chown=node:node /home/node/esi-next/dist ./dist
COPY --from=build-next --chown=node:node /home/node/esi-next/.next/static ./.next/static

USER node
EXPOSE 3000
CMD [ "node", "dist/server.js" ]
