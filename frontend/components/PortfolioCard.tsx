import type { Asset } from "@/types/asset";

type PortfolioCardProps = {
    assets: Asset[];
};

export default function PortfolioCard({ assets }: PortfolioCardProps) {
    const totalCost = assets.reduce(
        (sum, asset) => sum + asset.avgCost * asset.quantity,
        0
    );

    const totalValue = assets.reduce(
        (sum, asset) => sum + asset.currentPrice * asset.quantity,
        0
    );

    const totalProfitLoss = totalValue - totalCost;
    const totalReturn = totalCost === 0 ? 0 : (totalProfitLoss / totalCost) * 100;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-sm text-gray-500 mb-2">
                    Total Portfolio Value
                </h2>
                <p className="text-3xl font-bold text-gray-900">
                    ${totalValue.toLocaleString()}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-sm text-gray-500 mb-2">
                    Total Profit / Loss
                </h2>
                <p
                    className={`text-3xl font-bold ${totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {totalProfitLoss >= 0 ? "+" : "-"}$
                    {Math.abs(totalProfitLoss).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                    })}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-sm text-gray-500 mb-2">
                    Total Return
                </h2>
                <p
                    className={`text-3xl font-bold ${totalReturn >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {totalReturn >= 0 ? "+" : "-"}
                    {Math.abs(totalReturn).toFixed(2)}%
                </p>
            </div>
        </div>
    );
}