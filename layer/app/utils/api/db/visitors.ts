import type { HeaderTabUrl } from "../../common/types";
import config from "~~/config";

type D1RawResponse = { result: { success: boolean; results?: { columns: string[]; rows: unknown[][] } }[] };

const request = async (sql: string, params: string[]) => {
  // $fetch 遇到非 2xx 状态会抛错
  const res = await $fetch<D1RawResponse>(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_D1_ACCOUNT_ID!}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/raw`, {
    method: "POST",
    body: { sql, params },
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_D1_TOKEN!}`
    }
  });
  const result = res.result[0];
  if (!result?.success) {
    throw new Error("sql error");
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
