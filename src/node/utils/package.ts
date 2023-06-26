// Utilities for handling package meta data.
import path from "path";
import spdx from "spdx-license-list";

import { PackageMeta } from "@shared/types";


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
 * Prepare package meta data with additional fields for client side rendering.
 * @param doc package meta data read from yaml file
 * @returns the passed in package meta data with additional fields
 */
export const preparePackageMeta = function (doc: any): PackageMeta {
  const ghUrl = convertRepoUrl(doc.repoUrl, "https");
  const url = new URL(doc.repoUrl);
  // owner
  doc.owner = url.pathname.split("/")[1];
  doc.ownerUrl = `https://${ghUrl.hostname}/${ghUrl.owner}`;
  // repo
  doc.repo = url.pathname.split("/")[2];
  // hunter
  if (doc.hunter) {
    doc.hunterUrl = `https://${ghUrl.hostname}/${doc.hunter}`;
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
  return doc;
};

/**
 * Get package namespace scope `com.orgname` from package name `com.orgname.pkgname`. 
 * @param packageName package name
 * @returns namespace scope
 */
export const getNamespace = function (packageName: string): string {
  return packageName
    .split(".")
    .slice(0, 2)
    .join(".");
};
