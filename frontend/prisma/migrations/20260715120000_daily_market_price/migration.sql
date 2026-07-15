-- CreateTable
CREATE TABLE "DailyMarketPrice" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DOUBLE PRECISION,
    "high" DOUBLE PRECISION,
    "low" DOUBLE PRECISION,
    "close" DOUBLE PRECISION NOT NULL,
    "adjClose" DOUBLE PRECISION,
    "volume" BIGINT,
    "source" TEXT NOT NULL DEFAULT 'yahoo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyMarketPrice_symbol_date_idx" ON "DailyMarketPrice"("symbol", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMarketPrice_symbol_date_key" ON "DailyMarketPrice"("symbol", "date");
