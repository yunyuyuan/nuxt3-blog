import config from "../../../config";
import { HeaderTabUrl } from "../../../utils/common";
import { getCollection } from "./mongodb";

export type VisitorsDb = {
  nid: number,
  ntype: HeaderTabUrl,
  nvisitors?: number,
}

const sqlOptions = {
  projection: { _id: 0, nid: 1, nvisitors: 1 }
};

export async function getVisitors (type: HeaderTabUrl) {
  const collection = await getCollection<VisitorsDb>();
  const query: Partial<VisitorsDb> = {
    ntype: type
  };
  const results = await collection.find(query, sqlOptions);
  return await results.toArray();
}

export async function increaseVisitors ({ id, type, inc }: {id: number, type: HeaderTabUrl, inc?: boolean}) {
  const collection = await getCollection<VisitorsDb>();
  const preset: VisitorsDb = {
    nid: id,
    ntype: type
  };
  const incN = inc ? 1 : 0;
  const result = await collection.findOneAndUpdate(preset, {
    $inc: {
      nvisitors: incN
    }
  }, sqlOptions);
  if (result.value) {
    return result.value.nvisitors! + incN;
  } else {
    await collection.insertOne({
      ...preset,
      nvisitors: config.MongoDb.initialVisitors
    });
    return config.MongoDb.initialVisitors;
  }
}
