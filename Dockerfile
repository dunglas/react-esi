FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS base-deps
WORKDIR /home/node/repo

COPY ./package.json ./pnpm-*.yaml ./
COPY ./lib/package.json ./lib/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile



# Express
FROM base AS express-deps
WORKDIR /home/node/repo
COPY --from=base-deps /home/node/repo ./

COPY ./examples/express/package.json ./examples/express/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile


FROM base AS express-build
WORKDIR /home/node/repo
COPY --from=express-deps /home/node/repo ./
COPY . /home/node/repo

RUN pnpm --filter !esi-next run build
RUN pnpm deploy --filter esi-express --prod /home/node/esi-express

FROM base AS express-prod
COPY --from=express-build /home/node/esi-express /home/node/esi-express
WORKDIR /home/node/esi-express
USER node
EXPOSE 3000
CMD [ "node", "dist/server.js" ]



# Nextjs
FROM base AS next-deps
WORKDIR /home/node/repo
COPY --from=base-deps /home/node/repo ./

COPY ./examples/next/package.json ./examples/next/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile


FROM base AS next-build
WORKDIR /home/node/repo
COPY --from=next-deps /home/node/repo ./
COPY . /home/node/repo

ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter !esi-express run build
RUN pnpm deploy --filter esi-next --prod /home/node/esi-next


FROM base AS next-prod
WORKDIR /home/node/esi-next

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next
COPY --from=next-build --chown=node:node /home/node/esi-next/public ./public
COPY --from=next-build --chown=node:node /home/node/esi-next/node_modules ./node_modules
COPY --from=next-build --chown=node:node /home/node/esi-next/.next/standalone ./
COPY --from=next-build --chown=node:node /home/node/esi-next/dist ./dist
COPY --from=next-build --chown=node:node /home/node/esi-next/.next/static ./.next/static

USER node
EXPOSE 3000
CMD [ "node", "dist/server.js" ]
