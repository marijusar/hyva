import * as cheerio from "cheerio";

const MAX_LENGTH = 2000;

export class HomepageTextExtractor {
  static extract(html: string): string | null {
    const $ = cheerio.load(html);
    const title = $("title").first().text().trim();
    const description = $('meta[name="description"]').first().attr("content")?.trim() ?? "";

    const text = [title, description].filter(Boolean).join(" — ");
    return text ? text.slice(0, MAX_LENGTH) : null;
  }
}
