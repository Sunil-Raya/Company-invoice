import { getCompaniesWithStats } from "./src/services/companiesService.js";

async function test() {
  try {
    const data = await getCompaniesWithStats();
    console.log("SUCCESS:", data.length, "companies fetched.");
  } catch (e) {
    console.error("ERROR FETCHING:", e);
  }
}

test();
