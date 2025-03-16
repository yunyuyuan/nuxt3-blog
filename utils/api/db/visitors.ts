import type { HeaderTabUrl } from "../../common/types";
import { cloudflareClient } from "./db-client";
import config from "~/config";

const request = async (sql: string, params: string[]) => {
  const databaseRawResponse = await cloudflareClient.d1.database.raw(process.env.CLOUDFLARE_D1_DATABASE_ID!, {
    account_id: process.env.CLOUDFLARE_D1_ACCOUNT_ID!,
    sql,
    params
  });
  const result = databaseRawResponse.result[0];
  if (!result.success) {
    throw "sql error";
  }
  return result.results;
};

export async function getVisitors(type: HeaderTabUrl) {
  const res = await request("SELECT * FROM visitors WHERE ntype = ?;", [type]);
  return res?.rows;
}

export async function increaseVisitors({ id, type, inc }: { id: number; type: HeaderTabUrl; inc?: boolean }) {
  const updateRes = await request(
    `UPDATE visitors SET nvisitors = ${inc ? "nvisitors + 1" : "nvisitors"} WHERE nid = ? AND ntype = ? RETURNING nvisitors;`,
    [id.toString(), type]
  );
  if (!updateRes) {
    return null;
  }
  if (!updateRes.rows?.length) {
    const insertRes = await request(
      "INSERT INTO visitors (nid, ntype, nvisitors) VALUES (?, ?, ?) RETURNING nvisitors;",
      [id.toString(), type, config.database.initialVisitors.toString()]
    );
    return insertRes?.rows?.[0]?.[0];
  } else {
    return updateRes.rows[0]?.[0];
  }
}
