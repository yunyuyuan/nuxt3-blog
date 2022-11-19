import { HeaderTabUrl } from "./../../../utils/types";
import { getCollection } from "./mongodb";

type VisitorsDb = {
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

export async function increaseVisitors ({ id, type }: {id: number, type: HeaderTabUrl}) {
  const collection = await getCollection<VisitorsDb>();
  const preset: VisitorsDb = {
    nid: id,
    ntype: type
  };
  const result = await collection.findOneAndUpdate(preset, {
    $inc: {
      nvisitors: 1
    }
  }, sqlOptions);
  if (result.value) {
    return result.value.nvisitors! + 1;
  } else {
    await collection.insertOne({
      ...preset,
      nvisitors: 1
    });
    return 1;
  }
}
