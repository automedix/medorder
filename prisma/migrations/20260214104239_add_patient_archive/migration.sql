-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "careHomeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archiveNote" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patients_careHomeId_fkey" FOREIGN KEY ("careHomeId") REFERENCES "care_homes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_patients" ("careHomeId", "createdAt", "dateOfBirth", "firstName", "id", "isActive", "lastName", "updatedAt") SELECT "careHomeId", "createdAt", "dateOfBirth", "firstName", "id", "isActive", "lastName", "updatedAt" FROM "patients";
DROP TABLE "patients";
ALTER TABLE "new_patients" RENAME TO "patients";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
