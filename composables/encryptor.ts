import type cryptoJS from "crypto-js";
import { notify } from "~/utils/nuxt/notify";
import type { DecryptFunction } from "~/utils/common/types";
import { translate } from "~/utils/nuxt/i18n";
import { useUnmount } from "~/utils/hooks/useUnmount";

let CryptoJS: typeof cryptoJS;

const init = async () => {
  CryptoJS = CryptoJS || (await import("crypto-js")).default;
};

export const useEncryptor = () => {
  /** 密码本体 */
  const usePasswd = useState("passwd", () => "");
  /** 密码是否正确 */
  const passwdCorrect = useState("passwd-correct", () => false);
  /** 同一个错误密码只会提示一次错误信息 */
  const incorrectPwd = useState("incorrect-passwd", () => "");

  const destroyFns = useUnmount();

  const encrypt: DecryptFunction = async (s: string) => {
    if (!s) {
      return s;
    }
    try {
      await init();
      return CryptoJS.AES.encrypt(s, usePasswd.value).toString();
    } catch (e: any) {
      notify({
        type: "error",
        title: translate("encryption-failed"),
        description: e.toString()
      });
      throw e;
    }
  };
  // 解密操作是异步的，因为CryptoJs只有在使用时才被import。缺点是很多地方要改成await
  const decrypt: DecryptFunction = async (s: string) => {
    if (!s) {
      passwdCorrect.value = false;
      return s;
    }
    try {
      await init();
      const result = CryptoJS.AES.decrypt(s, usePasswd.value).toString(CryptoJS.enc.Utf8);
      if (result) {
        passwdCorrect.value = true;
        return result;
      }
      throw new Error(translate("passwd-incorrect"));
    } catch (e: any) {
      passwdCorrect.value = false;
      if (incorrectPwd.value !== usePasswd.value) {
        incorrectPwd.value = usePasswd.value;
        notify({
          type: "error",
          title: translate("decryption-failed") + ": " + usePasswd.value,
          description: e.toString()
        });
      }
      throw e;
    }
  };
  /**
   * 解密是 **一次性操作** ，所以解密成功后就不会再处理，解密失败则会一直监听
   * * 有密码 && 解密成功 -> Gotcha!
   * * 没有密码 || 解密失败 -> 开始监听
   *   * 密码为空，继续监听
   *   * 解密失败，继续监听
   *   * 解密成功，取消监听，Gotcha!
   * @param callback 实际的解密操作
   * @param firstIsFailed 第一次解密失败后的操作
   * @returns 取消监听函数
   */
  const decryptOrWatchToDecrypt = async (
    callback: (_decrypt: DecryptFunction) => Promise<void>,
    firstIsFailed: () => any = () => undefined
  ): Promise<void> => {
    try {
      if (!usePasswd.value) {
        throw new Error(translate("need-passwd"));
      }
      await callback(decrypt);
    } catch {
      firstIsFailed();
      const cancel = watch(usePasswd, async (pwd) => {
        if (!pwd) {
          return;
        }
        try {
          await callback(decrypt);
          cancel();
        } catch { /* empty */ }
      });
      destroyFns.push(cancel);
    }
  };

  return {
    usePasswd,
    passwdCorrect: readonly(passwdCorrect),
    init,
    encrypt,
    decryptOrWatchToDecrypt
  };
};
