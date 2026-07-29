-- CreateTable
CREATE TABLE "MarketFeature" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ma20" DOUBLE PRECISION,
    "return7d" DOUBLE PRECISION,
    "return30d" DOUBLE PRECISION,
    "volatility30d" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketFeature_symbol_date_idx" ON "MarketFeature"("symbol", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MarketFeature_symbol_date_key" ON "MarketFeature"("symbol", "date");
