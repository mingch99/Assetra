export default function PortfolioCard() {
    const totalValue = 125430;
    const totalProfitLoss = 15420;
    const monthlyReturn = 12.4;

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
                <p className="text-3xl font-bold text-green-600">
                    +${totalProfitLoss.toLocaleString()}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-sm text-gray-500 mb-2">
                    Monthly Return
                </h2>
                <p className="text-3xl font-bold text-green-600">
                    +{monthlyReturn}%
                </p>
            </div>
        </div>
    );
}