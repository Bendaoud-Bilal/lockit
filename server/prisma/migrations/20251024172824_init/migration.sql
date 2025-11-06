-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "master_password_hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "kdf_algorithm" TEXT NOT NULL DEFAULT 'argon2id',
    "argon2_iterations" INTEGER NOT NULL DEFAULT 3,
    "kdf_memory" INTEGER NOT NULL DEFAULT 65536,
    "kdf_parallelism" INTEGER NOT NULL DEFAULT 4,
    "encrypted_vault_key" TEXT NOT NULL,
    "vault_key_iv" TEXT NOT NULL,
    "vault_key_auth_tag" TEXT NOT NULL,
    "vault_salt" TEXT NOT NULL,
    "master_key_kdf_iterations" INTEGER NOT NULL DEFAULT 100000,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login" DATETIME
);

-- CreateTable
CREATE TABLE "recovery_keys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "key_hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" DATETIME,
    "revoked_at" DATETIME,
    CONSTRAINT "recovery_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "folders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "folder_id" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'login',
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "data_enc" TEXT NOT NULL,
    "data_iv" TEXT NOT NULL,
    "data_auth_tag" TEXT NOT NULL,
    "has_password" BOOLEAN NOT NULL DEFAULT true,
    "password_strength" INTEGER,
    "password_reused" BOOLEAN NOT NULL DEFAULT false,
    "password_last_changed" DATETIME,
    "compromised" BOOLEAN NOT NULL DEFAULT false,
    "state" TEXT NOT NULL DEFAULT 'active',
    "has_2fa" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "credentials_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "totp_secrets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "credential_id" INTEGER NOT NULL,
    "service_name" TEXT NOT NULL,
    "account_name" TEXT,
    "issuer" TEXT,
    "encrypted_secret" TEXT NOT NULL,
    "secret_iv" TEXT NOT NULL,
    "secret_auth_tag" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'SHA1',
    "digits" INTEGER NOT NULL DEFAULT 6,
    "period" INTEGER NOT NULL DEFAULT 30,
    "state" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "totp_secrets_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "credential_id" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT,
    "encrypted_data" TEXT NOT NULL,
    "data_iv" TEXT NOT NULL,
    "data_auth_tag" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sends" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "encrypted_content" TEXT NOT NULL,
    "content_iv" TEXT NOT NULL,
    "content_auth_tag" TEXT NOT NULL,
    "password_protected" BOOLEAN NOT NULL DEFAULT false,
    "max_access_count" INTEGER,
    "current_access_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "breach_alerts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "credential_id" INTEGER,
    "affected_email" TEXT NOT NULL,
    "breach_source" TEXT NOT NULL,
    "breach_date" DATETIME,
    "affected_data" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "breach_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "breach_alerts_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "folders_user_id_name_key" ON "folders"("user_id", "name");
