// Utilities for handling package metadata.
import path from "path";
import spdx from "spdx-license-list";

import { PackageMetadataLocal } from "@shared/types";

/**
 * Get cleaned GitHub repo url.
 * @param url GitHub repo url
 * @param format the format of the returned url, either https or git
 * @returns cleaned GitHub repo url
 */
export const convertRepoUrl = function (url: string, format?: string): string {
  if (!format) format = "https";
  if (url.startsWith("git@github.com:"))
    url = url.replace("git@github.com:", "https://github.com/");
  if (url.endsWith(".git"))
    url = url.slice(0, url.length - 4);
  const parsedUrl = new URL(url);
  const repo = parsedUrl.pathname.split("/").slice(1, 3).join("/");
  if (format == "git") return `git@${parsedUrl.host}:${repo}.git`;
  else if (format == "https") return `https://${parsedUrl.host}/${repo}`;
  else throw new Error("format should be either https or git.");
};

/**
 * Parse package metadata from yaml file.
 * @param doc package metadata read from yaml file
 * @returns the passed in package metadata with additional fields
 */
export const parsePackageMetadata = function (doc: any): PackageMetadataLocal {
  const ghUrl = convertRepoUrl(doc.repoUrl, "https");
  const url = new URL(ghUrl);
  // owner
  doc.owner = url.pathname.split("/")[1];
  doc.ownerUrl = `https://${url.hostname}/${doc.owner}`;
  // repo
  doc.repo = url.pathname.split("/")[2];
  // hunter
  if (doc.hunter) {
    doc.hunterUrl = `https://${url.hostname}/${doc.hunter}`;
  } else {
    doc.hunter = "";
    doc.hunterUrl = null;
  }
  // license
  if (!doc.licenseSpdxId) doc.licenseSpdxId = null;
  if (doc.licenseSpdxId && spdx[doc.licenseSpdxId]) {
    doc.licenseName = spdx[doc.licenseSpdxId].name;
  }
  if (doc.parentRepoUrl) {
    // parentRepoUrl
    doc.parentRepoUrl = convertRepoUrl(doc.parentRepoUrl, "https");
    const parentGHUrl = new URL(doc.parentRepoUrl);
    // parentOwner
    doc.parentOwner = parentGHUrl.pathname.split("/")[1];
    // parentOwnerUrl
    doc.parentOwnerUrl = `https://${parentGHUrl.hostname}/${doc.parentOwner}`;
    // parentRepo
    doc.parentRepo = parentGHUrl.pathname.split("/")[2];
  } else {
    doc.parentRepoUrl = null;
    doc.parentOwner = null;
    doc.parentOwnerUrl = null;
    doc.parentRepo = null;
  }
  // readme
  if (!doc.readme) {
    doc.readme = "main:README.md";
  }
  doc.readme = doc.readme.trim();
  if (doc.readme.indexOf(":") == -1) {
    doc.readme = "main:" + doc.readme;
  }
  const [readmeBranch, readmePath] = doc.readme.split(":");
  const dirname = path.dirname(readmePath);
  doc.readmeBranch = readmeBranch;
  doc.readmeBase = dirname == "." ? readmeBranch : [readmeBranch, dirname].join("/");
  // topics
  if (!doc.topics) doc.topics = [];
  return doc;
};
