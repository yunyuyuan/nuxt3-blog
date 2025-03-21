import cheerio from "cheerio";

export default function extractTextFromHtml(html: string) {
  const opts = {
    normalizeWhitespace: true,
    preserveNewlines: false,
    excludeSelectors: ["script", "style", "noscript", "iframe", "svg", ".encrypt-block"]
  };

  // 加载HTML
  const $ = cheerio.load(html);

  // 移除不需要的元素
  if (opts.excludeSelectors && opts.excludeSelectors.length) {
    $(opts.excludeSelectors.join(", ")).remove();
  }

  // 获取纯文本
  let text = $("body").text();

  // 处理空白字符
  if (opts.normalizeWhitespace) {
    if (opts.preserveNewlines) {
      // 保留换行符，但规范化其他空白
      const lines = text.split("\n");
      text = lines
        .map(line => line.replace(/\s+/g, " ").trim())
        .filter(line => line)
        .join("\n");
    } else {
      // 将所有空白字符（包括换行符）规范化为单个空格
      text = text.replace(/\s+/g, " ").trim();
    }
  }

  return text;
}
