-- Add terminal push subscriptions separately from user subscriptions.
CREATE TABLE "PushSubscriptionBorne" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscriptionBorne_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscriptionBorne_endpoint_key" ON "PushSubscriptionBorne"("endpoint");
CREATE INDEX "PushSubscriptionBorne_terminalId_idx" ON "PushSubscriptionBorne"("terminalId");
ALTER TABLE "PushSubscriptionBorne" ADD CONSTRAINT "PushSubscriptionBorne_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConfigurationPlateforme" ADD COLUMN "notificationsBorneActives" BOOLEAN NOT NULL DEFAULT false;