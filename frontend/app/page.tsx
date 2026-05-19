import PortfolioCard from "@/components/PortfolioCard";
import AssetForm from "@/components/AssetForm";
import AssetTable from "@/components/AssetTable";


export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold mb-6">
        Assetra Portfolio Dashboard
      </h1>

      <PortfolioCard />

      <AssetForm />

      <AssetTable />
    </main>
  );
}