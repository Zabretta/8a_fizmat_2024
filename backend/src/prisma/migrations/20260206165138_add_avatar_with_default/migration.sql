-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '👤',
    "online" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("code", "createdAt", "id", "nickname", "online") SELECT "code", "createdAt", "id", "nickname", "online" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
CREATE UNIQUE INDEX "User_avatar_key" ON "User"("avatar");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
