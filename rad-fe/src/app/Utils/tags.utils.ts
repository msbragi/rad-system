export abstract class TagsUtils {
  constructor() {}

  /**
   * Compare 2 arrays of tags with regular expressions
   * @param allTags     Elenco completo dei tags
   * @param chkTags     Elenco tags da comparare (even with regexp strings)
   * @returns Array =>  Elenco dei tags validi
   * Example:
   *   const all   = 'DEU_01, DEU_02, DEU_03, XY_01, XY_02, AAAA'
   *   const check = 'DEU_.*, AAAA'
   *   const result = compareTags(all, check);
   */
  static compareTags(allTags: any, chkTags: any) {
    allTags = typeof allTags == "string" ? allTags.split(",") : allTags;
    chkTags = typeof chkTags == "string" ? chkTags.split(",") : chkTags;
    const valid: string[] = [];
    chkTags.map((u: string) => {
      const rx = new RegExp(u.trim());
      valid.push(...allTags.filter((t: string) => t.trim().match(rx)));
    });
    return valid;
  }

  // TODO: Cosa fare se il sorgente non ha tags?
  static areValidTags(sourceTags: any, chkTags: any) {
    // Is null or undefined return true;
    if (!sourceTags) {
      return true;
    }
    // Is empty string or empty array return true;
    sourceTags =
      typeof sourceTags == "string" ? sourceTags.trim().split(",") : sourceTags;
    if (sourceTags.length == 0 || sourceTags[0].trim() == "") {
      return true;
    }
    // Check if valid
    return this.compareTags(sourceTags, chkTags).length > 0;
  }

  static split(tags: any, delim: string = ",") {
    if (typeof tags === "string") {
      return tags.split(delim) || [];
    }
    return tags || "";
  }

  static join(tags: any, delim: string = ",") {
    if (Array.isArray(tags)) {
      return tags.join(delim) || "";
    }
    return tags || "";
  }
}
