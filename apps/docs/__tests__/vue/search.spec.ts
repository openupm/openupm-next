import { SearchIndex } from "@vuepress/plugin-search";
import {
  getPackageSearchResultDisplayName,
  getPackageNameFromSearchSuggestionLink,
  getPackageSearchResultTitle,
  isUnityNuGetPackageName,
  normalizeSearchQuery,
  usePackageSearchSuggestions,
} from "@/search";
import { getSearchExtraFields } from "@/searchExtraFields";
import { describe, it } from "vitest";
import chai from "chai";
chai.should();

describe("normalizeSearchQuery", () => {
  it("removes leading and trailing punctuation without stripping package separators", () => {
    normalizeSearchQuery(" org.nuget; ").should.equal("org.nuget");
    normalizeSearchQuery("(org.nuget.newtonsoft.json)").should.equal(
      "org.nuget.newtonsoft.json",
    );
  });
});

describe("isUnityNuGetPackageName", () => {
  it("only accepts generated UnityNuGet package names", () => {
    isUnityNuGetPackageName("org.nuget.system.text.json").should.equal(true);
    isUnityNuGetPackageName("org.kumas.nuget-importer").should.equal(false);
    isUnityNuGetPackageName("add").should.equal(false);
  });
});

describe("getPackageSearchResultTitle", () => {
  it("formats native package titles without SEO suffixes", () => {
    getPackageSearchResultTitle(
      "Display Name | com.example.package | Unity Package Manager (UPM)",
      "com.example.package",
    ).should.equal("Display Name | com.example.package");
  });

  it("formats NuGet package titles with the generated package name", () => {
    getPackageSearchResultTitle(
      "System.Text.Json | org.nuget.system.text.json | UnityNuGet Package | Unity Package Manager (UPM)",
      "org.nuget.system.text.json",
    ).should.equal("System.Text.Json | org.nuget.system.text.json");
  });

  it("does not duplicate package names when no display name exists", () => {
    getPackageSearchResultTitle(
      "com.example.package | Unity Package Manager (UPM)",
      "com.example.package",
    ).should.equal("com.example.package");
  });
});

describe("getPackageSearchResultDisplayName", () => {
  it("returns the display name from an SEO page title", () => {
    getPackageSearchResultDisplayName(
      "System.Text.Json | org.nuget.system.text.json | UnityNuGet Package | Unity Package Manager (UPM)",
      "org.nuget.system.text.json",
    ).should.equal("System.Text.Json");
  });
});

describe("getPackageNameFromSearchSuggestionLink", () => {
  it("parses package names from package detail links with anchors", () => {
    getPackageNameFromSearchSuggestionLink(
      "/packages/org.nuget.system.text.json/#versions",
    ).should.equal("org.nuget.system.text.json");
  });

  it("returns null for non-package links", () => {
    chai.expect(getPackageNameFromSearchSuggestionLink("/docs/")).to.equal(null);
  });
});

describe("usePackageSearchSuggestions", () => {
  it("should return an empty array for an empty query", () => {
    const searchIndex = [] as SearchIndex;
    const query = "";
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an("array").that.is.empty;
  });

  it("should return an array of package search suggestions for a single query token", () => {
    const searchIndex = [
      {
        path: "/packages/com.example.package1/",
        pathLocale: "/",
        title: "package1",
        extraFields: [],
        headers: [],
      },
      {
        path: "/packages/com.example.package2/",
        pathLocale: "/",
        title: "package2",
        extraFields: [],
        headers: [],
      },
      {
        path: "/packages/topics/2d/",
        pathLocale: "/",
        title: "topics - 2d",
        extraFields: [],
        headers: [],
      },
    ];
    const query = "package1";
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an("array").that.has.lengthOf(1);
    suggestions[0].should.deep.equal({
      displayName: "package1",
      name: "com.example.package1",
      title: "package1 | com.example.package1",
    });
  });

  it("should return an array of package search suggestions for multiple query tokens", () => {
    const searchIndex = [
      {
        path: "/packages/com.example.package1/",
        pathLocale: "/",
        title: "fetch rest",
        extraFields: [],
        headers: [],
      },
      {
        path: "/packages/com.example.package2/",
        pathLocale: "/",
        title: "rest fetch",
        extraFields: [],
        headers: [],
      },
      {
        path: "/packages/topics/2d/",
        pathLocale: "/",
        title: "topics - 2d",
        extraFields: [],
        headers: [],
      },
    ];
    const query = "fetch rest";
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an("array").that.has.lengthOf(2);
    suggestions[0].should.deep.equal({
      displayName: "fetch rest",
      name: "com.example.package1",
      title: "fetch rest | com.example.package1",
    });
    suggestions[1].should.deep.equal({
      displayName: "rest fetch",
      name: "com.example.package2",
      title: "rest fetch | com.example.package2",
    });
  });

  it("should return an array of package search suggestions for multiple query tokens that contains plural words", () => {
    const searchIndex = [
      {
        path: "/packages/com.example.package1/",
        pathLocale: "/",
        title: "fetches",
        extraFields: [],
        headers: [],
      },
      {
        path: "/packages/com.example.package2/",
        pathLocale: "/",
        title: "fetch",
        extraFields: [],
        headers: [],
      },
    ];
    const query = "fetches";
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an("array").that.has.lengthOf(2);
    suggestions[0].should.deep.equal({
      displayName: "fetches",
      name: "com.example.package1",
      title: "fetches | com.example.package1",
    });
    suggestions[1].should.deep.equal({
      displayName: "fetch",
      name: "com.example.package2",
      title: "fetch | com.example.package2",
    });
  });

  it("should return an empty array of package search suggestions for multiple query tokens that don't get matched", () => {
    const searchIndex = [
      {
        path: "/packages/com.example.package1/",
        pathLocale: "/",
        title: "fetch api",
        extraFields: [],
        headers: [],
      },
      {
        path: "/packages/com.example.package2/",
        pathLocale: "/",
        title: "rest api",
        extraFields: [],
        headers: [],
      },
      {
        path: "/packages/topics/2d/",
        pathLocale: "/",
        title: "topics - 2d",
        extraFields: [],
        headers: [],
      },
    ];
    const query = "fetch rest";
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an("array").that.is.empty;
  });

  it("should match package names with trailing punctuation", () => {
    const searchIndex = [
      {
        path: "/packages/org.nuget.newtonsoft.json/",
        pathLocale: "/",
        title: "Newtonsoft.Json | UnityNuGet Package",
        extraFields: ["org.nuget.newtonsoft.json", "Newtonsoft.Json"],
        headers: [],
      },
    ];
    const suggestions = usePackageSearchSuggestions(searchIndex, "org.nuget;");
    suggestions.should.deep.equal([
      {
        displayName: "Newtonsoft.Json",
        name: "org.nuget.newtonsoft.json",
        title: "Newtonsoft.Json | org.nuget.newtonsoft.json",
      },
    ]);
  });
});

describe("getSearchExtraFields", () => {
  it("indexes NuGet package names and original IDs", () => {
    const fields = getSearchExtraFields({
      frontmatter: {
        packageKind: "unitynuget",
        name: "org.nuget.newtonsoft.json",
        nugetId: "Newtonsoft.Json",
        description:
          "Newtonsoft.Json is available as org.nuget.newtonsoft.json through the OpenUPM registry UnityNuGet uplink.",
      },
    } as never);

    fields.should.deep.equal([
      "org.nuget.newtonsoft.json",
      "Newtonsoft.Json",
      "Newtonsoft.Json is available as org.nuget.newtonsoft.json through the OpenUPM registry UnityNuGet uplink.",
    ]);
  });

  it("does not add extra fields to native package pages", () => {
    const fields = getSearchExtraFields({
      frontmatter: {
        name: "com.example.package",
      },
    } as never);

    fields.should.deep.equal([]);
  });
});
