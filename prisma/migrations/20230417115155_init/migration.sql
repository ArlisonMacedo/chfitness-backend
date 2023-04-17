-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "pushings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day_assin" DATETIME NOT NULL,
    "day_venc" DATETIME NOT NULL,
    "count_day" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "pushings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
