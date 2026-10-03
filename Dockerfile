# Build the static site, then serve dist/ with nginx (same runtime image as before the migration).
FROM --platform=$BUILDPLATFORM oven/bun:alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:stable
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80