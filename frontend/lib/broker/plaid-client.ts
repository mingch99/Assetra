import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

let cachedClient: PlaidApi | null = null;

export function isPlaidConfigured(): boolean {
  return Boolean(
    process.env.PLAID_CLIENT_ID?.trim() && process.env.PLAID_SECRET?.trim()
  );
}

export function getPlaidClient(): PlaidApi {
  if (cachedClient) return cachedClient;

  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !secret) {
    throw new Error(
      "Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET."
    );
  }

  const envName = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  const basePath =
    envName === "production"
      ? PlaidEnvironments.production
      : envName === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox;

  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  cachedClient = new PlaidApi(configuration);
  return cachedClient;
}

export async function createPlaidLinkToken(userId: string): Promise<string> {
  const client = getPlaidClient();
  const webhook = process.env.PLAID_WEBHOOK_URL?.trim() || undefined;

  const response = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Assetra",
    products: [Products.Investments],
    country_codes: [CountryCode.Us, CountryCode.Ca],
    language: "en",
    ...(webhook ? { webhook } : {}),
  });

  return response.data.link_token;
}

export async function exchangePlaidPublicToken(publicToken: string) {
  const client = getPlaidClient();
  const response = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
}

export async function fetchPlaidInvestmentsHoldings(accessToken: string) {
  const client = getPlaidClient();
  const response = await client.investmentsHoldingsGet({
    access_token: accessToken,
  });
  return response.data;
}

export async function fetchPlaidItem(accessToken: string) {
  const client = getPlaidClient();
  const response = await client.itemGet({ access_token: accessToken });
  return response.data.item;
}

export async function fetchPlaidInstitution(institutionId: string) {
  const client = getPlaidClient();
  const response = await client.institutionsGetById({
    institution_id: institutionId,
    country_codes: [CountryCode.Us, CountryCode.Ca],
  });
  return response.data.institution;
}

export async function removePlaidItem(accessToken: string) {
  const client = getPlaidClient();
  await client.itemRemove({ access_token: accessToken });
}
