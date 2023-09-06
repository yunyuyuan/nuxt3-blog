import axios from "axios";
import config from "../../../config";
import { HeaderTabUrl } from "../../common";
// import { getCollection } from "./mongodb";

const request = (path: string, data: any) => {
  if (!process.env.MONGODB_PWD || !process.env.MONGODB_USER) {
    throw new Error("Need Mongodb Atlas Authentication");
  }

  return axios({
    method: "post",
    url: process.env.MONGODB_ENDPOINT + path,
    headers: {
      email: process.env.MONGODB_USER,
      password: process.env.MONGODB_PWD
    },
    data: {
      ...data,
      dataSource: process.env.MONGODB_DATA_SOURCE,
      database: config.MongoDb.database,
      collection: config.MongoDb.collection
    }
  });
};

export async function getVisitorsREST (type: HeaderTabUrl) {
  const res = await request("/action/find", {
    filter: {
      ntype: type
    },
    projection: { _id: 0, nid: 1, nvisitors: 1 }
  });
  return res.data.documents;
}

export async function increaseVisitorsREST ({ id, type, inc }: {id: number, type: HeaderTabUrl, inc?: boolean}) {
  const preset = {
    nid: id,
    ntype: type
  };
  const incN = inc ? 1 : 0;
  const res = await request("/action/updateOne", {
    filter: preset,
    update: {
      $inc: {
        nvisitors: incN
      }
    }
  });
  if (!res.data.modifiedCount) {
    await request("/action/insertOne", {
      document: {
        ...preset,
        nvisitors: config.MongoDb.initialVisitors
      }
    });
    return config.MongoDb.initialVisitors;
  }
  return (await request("/action/findOne", {
    filter: preset
  })).data.document.nvisitors;
}

export type VisitorsDb = {
  nid: number,
  ntype: HeaderTabUrl,
  nvisitors?: number,
}

// const sqlOptions = {
//   projection: { _id: 0, nid: 1, nvisitors: 1 }
// };

// export async function getVisitors (type: HeaderTabUrl) {
//   const collection = await getCollection<VisitorsDb>();
//   const query: Partial<VisitorsDb> = {
//     ntype: type
//   };
//   const results = await collection.find(query, sqlOptions);
//   return await results.toArray();
// }

// export async function increaseVisitors ({ id, type, inc }: {id: number, type: HeaderTabUrl, inc?: boolean}) {
//   const collection = await getCollection<VisitorsDb>();
//   const preset: VisitorsDb = {
//     nid: id,
//     ntype: type
//   };
//   const incN = inc ? 1 : 0;
//   const result = await collection.findOneAndUpdate(preset, {
//     $inc: {
//       nvisitors: incN
//     }
//   }, sqlOptions);
//   if (result.value) {
//     return result.value.nvisitors! + incN;
//   } else {
//     await collection.insertOne({
//       ...preset,
//       nvisitors: config.MongoDb.initialVisitors
//     });
//     return config.MongoDb.initialVisitors;
//   }
// }
