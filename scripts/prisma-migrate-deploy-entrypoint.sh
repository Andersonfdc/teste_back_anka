#!/bin/bash
set -e

# ALTER THIS TO YOUR PROJECT NAME
echo "🚀 Starting Anka Backend Node Template Container..."

# ========== helpers ==========
psql_exec() {
  # runs a SQL against the target DB using psql; prints rows only (-At)
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -At -c "$1"
}

# Default: rolled-back (re-run later). Override with PRISMA_RESOLVE_MODE=applied to skip.
PRISMA_RESOLVE_MODE="${PRISMA_RESOLVE_MODE:-rolled-back}"

check_database_connection() {
    echo "⏳ Checking database connection..."
    echo "🔍 Listing all environment variable keys available in the container:"
    env | awk -F= '{print "   • "$1}' | sort

    if [[ -z "$DATABASE_URL" ]]; then
        echo "❌ DATABASE_URL environment variable is not set"
        exit 1
    fi

    echo "🔍 DATABASE_URL length: ${#DATABASE_URL}"
    echo "🔍 DATABASE_URL format check: ${DATABASE_URL//:*@*/:***@*}"

    if [[ "$DATABASE_URL" != "${DATABASE_URL// /}" ]]; then
        echo "⚠️  DATABASE_URL contains spaces"
    fi
    if [[ "$DATABASE_URL" != $(echo "$DATABASE_URL" | tr -d '[:cntrl:]') ]]; then
        echo "⚠️  DATABASE_URL contains control characters"
    fi

    echo "🔍 Testing regex pattern against DATABASE_URL..."
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        echo "✅ Regex pattern matched successfully"
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]%\?*}"

        echo "🔍 Extracted DB_USER: $DB_USER"
        echo "🔍 Extracted DB_HOST: $DB_HOST"
        echo "🔍 Extracted DB_PORT: $DB_PORT"
        echo "🔍 Extracted DB_NAME: $DB_NAME"
        echo "🔍 DB_PASSWORD length: ${#DB_PASSWORD}"

        if [[ -z "$DB_USER" || -z "$DB_PASSWORD" || -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_NAME" ]]; then
            echo "❌ One or more database connection parameters are empty"
            echo "🔍 DB_USER empty: $([ -z "$DB_USER" ] && echo "YES" || echo "NO")"
            echo "🔍 DB_PASSWORD empty: $([ -z "$DB_PASSWORD" ] && echo "YES" || echo "NO")"
            echo "🔍 DB_HOST empty: $([ -z "$DB_HOST" ] && echo "YES" || echo "NO")"
            echo "🔍 DB_PORT empty: $([ -z "$DB_PORT" ] && echo "YES" || echo "NO")"
            echo "🔍 DB_NAME empty: $([ -z "$DB_NAME" ] && echo "YES" || echo "NO")"
            exit 1
        fi

        echo "🔍 Testing database connection with pg_isready..."
        if PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
            echo "✅ Database connection established"
            return 0
        else
            echo "❌ Database connection failed"
            echo "🔍 Trying pg_isready with verbose output..."
            PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v
            exit 1
        fi
    else
        echo "❌ Invalid DATABASE_URL format - regex pattern did not match"
        echo "🔍 Expected format: postgresql://user:password@host:port/database"
        echo "🔍 Your URL pattern: ${DATABASE_URL//:*@*/:***@*}"
        # ... (keep your detailed format checks) ...
        exit 1
    fi
}

resolve_failed_migrations() {
  echo "🧹 Checking for failed Prisma migrations (P3009 guardrail)..."

  # 1) Ensure the migrations table exists
  local tbl
  tbl=$(psql_exec "SELECT to_regclass('_prisma_migrations');")
  if [[ "$tbl" != "_prisma_migrations" ]]; then
    echo "ℹ️  _prisma_migrations table not found (fresh DB?). Skipping resolve step."
    return 0
  fi

  # 2) Find stuck/failed migrations: finished_at is NULL AND rolled_back_at is NULL
  #    (this is how Prisma indicates an incomplete/failed migration)
  local failed_list
  failed_list=$(psql_exec "
    SELECT migration_name
    FROM _prisma_migrations
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
    ORDER BY started_at ASC;
  ")

  if [[ -z "$failed_list" ]]; then
    echo "✅ No failed/stuck migrations found."
    return 0
  fi

  echo "⚠️  Found failed/stuck migrations:"
  echo "$failed_list" | sed 's/^/   • /'

  # 3) Resolve each one so 'deploy' can proceed
  #    Default: mark as rolled-back -> Prisma will attempt it again on deploy
  #    Optional: PRISMA_RESOLVE_MODE=applied to mark as applied (skips re-run)
  while IFS= read -r mig; do
    [[ -z "$mig" ]] && continue
    echo "🛠  Resolving: $mig  (mode=$PRISMA_RESOLVE_MODE)"
    if ! npx prisma migrate resolve --$PRISMA_RESOLVE_MODE "$mig"; then
      echo "❌ Failed to resolve migration: $mig"
      exit 1
    fi
  done <<< "$failed_list"
}

show_migration_status() {
  echo "🔎 Prisma migration status:"
  npx prisma migrate status || true
}

run_migrations() {
    echo "🔄 Running database migrations..."
    if npx prisma migrate deploy; then
        echo "✅ Database migrations completed successfully"
    else
        echo "❌ Database migration failed!"
        exit 1
    fi
}

generate_prisma_client() {
    echo "🔄 Generating Prisma client..."
    npx prisma generate
}

start_application() {
    echo "🚀 Starting Node.js application..."
    exec "$@"
}

main() {
    check_database_connection
    resolve_failed_migrations
    show_migration_status
    run_migrations
    generate_prisma_client
    start_application "$@"
}

trap 'echo "🛑 Received shutdown signal, exiting..."; exit 143' SIGTERM SIGINT
main "$@"
