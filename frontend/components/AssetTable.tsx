const assets = [
    {
        name: "Apple",
        symbol: "AAPL",
        type: "Stock",
        quantity: 10,
        avgCost: 180,
        currentPrice: 195,
    },
    {
        name: "Bitcoin",
        symbol: "BTC",
        type: "Crypto",
        quantity: 0.2,
        avgCost: 60000,
        currentPrice: 67000,
    },
    {
        name: "Tesla",
        symbol: "TSLA",
        type: "Stock",
        quantity: 5,
        avgCost: 220,
        currentPrice: 210,
    },
];

export default function AssetTable() {
    return (
        <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">
                Asset Table
            </h2>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b text-gray-500">
                        <th className="py-3">Asset</th>
                        <th className="py-3">Type</th>
                        <th className="py-3">Quantity</th>
                        <th className="py-3">Avg Cost</th>
                        <th className="py-3">Current Price</th>
                        <th className="py-3">Market Value</th>
                        <th className="py-3">P/L</th>
                        <th className="py-3">Return %</th>
                    </tr>
                </thead>

                <tbody>
                    {assets.map((asset) => {
                        const costBasis =
                            asset.avgCost * asset.quantity;

                        const marketValue =
                            asset.currentPrice * asset.quantity;

                        const profitLoss =
                            marketValue - costBasis;

                        const returnRate =
                            (profitLoss / costBasis) * 100;

                        return (
                            <tr key={asset.symbol} className="border-b">
                                <td className="py-4">
                                    <div className="font-semibold">
                                        {asset.name}
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        {asset.symbol}
                                    </div>
                                </td>

                                <td className="py-4">{asset.type}</td>

                                <td className="py-4">
                                    {asset.quantity}
                                </td>

                                <td className="py-4">
                                    ${asset.avgCost}
                                </td>

                                <td className="py-4">
                                    ${asset.currentPrice}
                                </td>

                                <td className="py-4">
                                    ${marketValue.toFixed(2)}
                                </td>

                                <td
                                    className={`py-4 font-semibold ${profitLoss >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    ${profitLoss.toFixed(2)}
                                </td>

                                <td
                                    className={`py-4 font-semibold ${returnRate >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {returnRate.toFixed(2)}%
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}