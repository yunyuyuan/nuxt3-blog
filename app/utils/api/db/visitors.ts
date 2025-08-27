import axios from "axios";
import type { HeaderTabUrl } from "../../common/types";
import config from "../../../../config";

const request = async (sql: string, params: string[]) => {
  const res = await axios.post(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_D1_ACCOUNT_ID!}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/raw`,
    { sql, params },
    {
      headers: {
        "Authorization": `Bearer ${process.env.CLOUDFLARE_D1_TOKEN!}`,
        "Content-Type": "application/json"
      }
    }
  );
  if (res.status !== 200) {
    throw res.statusText;
  }
  const result = res.data.result[0];
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
