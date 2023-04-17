/*
  Warnings:

  - You are about to alter the column `count_day` on the `pushings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pushings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day_assin" DATETIME NOT NULL,
    "day_venc" DATETIME NOT NULL,
    "count_day" INTEGER,
    "userId" TEXT NOT NULL,
    CONSTRAINT "pushings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pushings" ("count_day", "day_assin", "day_venc", "id", "userId") SELECT "count_day", "day_assin", "day_venc", "id", "userId" FROM "pushings";
DROP TABLE "pushings";
ALTER TABLE "new_pushings" RENAME TO "pushings";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
