import { getR2Config, R2AllowedTypes } from "../../../app/utils/api/r2";

// 后台用它判断上传是否可用；纯静态托管上这个地址不存在，请求失败即视为不可用
export default defineEventHandler(() => {
  const cfg = getR2Config();
  return {
    enabled: cfg.enabled,
    serverKey: cfg.enabled && !!cfg.serverSecret,
    maxBytes: cfg.maxBytes,
    types: R2AllowedTypes
  };
});
