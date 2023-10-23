FROM node:20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build

FROM base AS lib
COPY --from=prod-deps /app/lib/node_modules/ /app/lib/node_modules
COPY --from=build /app/lib/dist /app/lib/dist

FROM lib AS express
COPY --from=prod-deps /app/examples/express/node_modules/ /app/examples/express/node_modules
COPY --from=build /app/examples/express/dist /app/examples/express/dist
WORKDIR /app/examples/express
EXPOSE 3000
CMD [ "pnpm", "start" ]

FROM lib AS next
COPY --from=prod-deps /app/packages/app2/node_modules/ /app/packages/app2/node_modules
COPY --from=build /app/packages/app2/dist /app/packages/app2/dist
WORKDIR /app/packages/app2
EXPOSE 30001
CMD [ "pnpm", "start" ]