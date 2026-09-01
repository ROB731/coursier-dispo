CREATE TABLE "NotificationBorne" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "message" TEXT NOT NULL,
    "envoyeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationBorne_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationBorne_terminalId_envoyeAt_idx" ON "NotificationBorne"("terminalId", "envoyeAt");
ALTER TABLE "NotificationBorne" ADD CONSTRAINT "NotificationBorne_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE CASCADE ON UPDATE CASCADE;