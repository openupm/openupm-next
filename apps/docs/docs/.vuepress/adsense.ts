const readmeInArticleAdSelector = "[data-openupm-readme-ad='in-article']";
const defaultViewportHeightPx = 900;
const minAdDistanceRatio = 0.85;
const minFirstAdRatio = 0.65;
const minFallbackRatio = 1.15;
const estimatedCharsPerViewport = 1450;

export type AdsenseInArticleBoundary = {
  estimatedContentLength: number;
  isFirstContentHeading?: boolean;
  measuredTopPx?: number;
};

export type AdsenseInArticlePlacementOptions = {
  viewportHeightPx?: number;
};

const getTargetDistancePx = (
  options: AdsenseInArticlePlacementOptions = {},
): number => Math.max(options.viewportHeightPx || defaultViewportHeightPx, 600);

export function estimateReadmeContentHeightPx(
  contentLength: number,
  options: AdsenseInArticlePlacementOptions = {},
): number {
  return (
    (contentLength / estimatedCharsPerViewport) * getTargetDistancePx(options)
  );
}

function getBoundaryPositionPx(
  boundary: AdsenseInArticleBoundary,
  options: AdsenseInArticlePlacementOptions,
): number {
  return Math.max(
    boundary.measuredTopPx || 0,
    estimateReadmeContentHeightPx(boundary.estimatedContentLength, options),
  );
}

export function selectAdsenseInArticleBoundaryIndexes(
  boundaries: AdsenseInArticleBoundary[],
  options: AdsenseInArticlePlacementOptions = {},
): number[] {
  const targetDistancePx = getTargetDistancePx(options);
  const minDistancePx = targetDistancePx * minAdDistanceRatio;
  const minFirstAdPositionPx = targetDistancePx * minFirstAdRatio;
  const placementIndexes: number[] = [];
  let lastAdPositionPx = 0;

  boundaries.forEach((boundary, index) => {
    const positionPx = getBoundaryPositionPx(boundary, options);
    if (boundary.isFirstContentHeading && positionPx < minFirstAdPositionPx)
      return;
    if (positionPx < minFirstAdPositionPx) return;
    if (positionPx - lastAdPositionPx < minDistancePx) return;

    placementIndexes.push(index);
    lastAdPositionPx = positionPx;
  });

  return placementIndexes;
}

export function shouldAppendAdsenseInArticleFallbackAd(
  totalContentLength: number,
  placementCount: number,
  boundaryCount: number,
  options: AdsenseInArticlePlacementOptions = {},
): boolean {
  if (placementCount > 0) return false;
  if (boundaryCount === 0) return totalContentLength > 0;
  return (
    estimateReadmeContentHeightPx(totalContentLength, options) >=
    getTargetDistancePx(options) * minFallbackRatio
  );
}

function removeAdsenseInArticleAds(containerElement: HTMLElement): void {
  containerElement
    .querySelectorAll(readmeInArticleAdSelector)
    .forEach((adElement) => adElement.remove());
}

function getEstimatedNodeContentLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE)
    return node.textContent?.trim().length || 0;
  if (!(node instanceof HTMLElement)) return 0;

  const tagName = node.tagName.toLowerCase();
  const textLength = node.textContent?.trim().length || 0;
  if (tagName === "pre") return textLength + 800;
  if (tagName === "table") return textLength + 650;
  if (tagName === "img") return textLength + 500;
  if (tagName === "iframe" || tagName === "video") return textLength + 900;
  if (tagName === "ul" || tagName === "ol") return textLength + 180;
  if (tagName === "blockquote") return textLength + 160;
  if (!node.childNodes.length) return textLength;
  return Array.from(node.childNodes).reduce(
    (contentLength, childNode) =>
      contentLength + getEstimatedNodeContentLength(childNode),
    0,
  );
}

function getEstimatedContentLengthBefore(
  containerElement: HTMLElement,
  boundaryElement: HTMLElement,
): number {
  let contentLength = 0;
  for (const childNode of Array.from(containerElement.childNodes)) {
    const result = getEstimatedContentLengthBeforeBoundary(
      childNode,
      boundaryElement,
    );
    contentLength += result.contentLength;
    if (result.foundBoundary) break;
  }

  return contentLength;
}

function getEstimatedContainerContentLength(
  containerElement: HTMLElement,
): number {
  return Array.from(containerElement.childNodes).reduce(
    (contentLength, childNode) =>
      contentLength + getEstimatedNodeContentLength(childNode),
    0,
  );
}

function getEstimatedContentLengthBeforeBoundary(
  node: Node,
  boundaryElement: HTMLElement,
): { contentLength: number; foundBoundary: boolean } {
  if (node === boundaryElement || boundaryElement.contains(node))
    return { contentLength: 0, foundBoundary: true };
  if (!(node instanceof HTMLElement) || !node.contains(boundaryElement)) {
    return {
      contentLength: getEstimatedNodeContentLength(node),
      foundBoundary: false,
    };
  }

  let contentLength = 0;
  for (const childNode of Array.from(node.childNodes)) {
    const result = getEstimatedContentLengthBeforeBoundary(
      childNode,
      boundaryElement,
    );
    contentLength += result.contentLength;
    if (result.foundBoundary) return { contentLength, foundBoundary: true };
  }

  return { contentLength, foundBoundary: false };
}

function getMeasuredTopPx(
  containerElement: HTMLElement,
  boundaryElement: HTMLElement,
): number {
  const containerRect = containerElement.getBoundingClientRect();
  const boundaryRect = boundaryElement.getBoundingClientRect();
  if (!containerRect.height && !boundaryRect.top) return 0;
  return Math.max(0, boundaryRect.top - containerRect.top);
}

function getViewportHeightPx(): number {
  return typeof window === "undefined"
    ? defaultViewportHeightPx
    : window.innerHeight;
}

function createAdsenseInArticleAd(): HTMLElement {
  const adElement = document.createElement("div");
  adElement.dataset.openupmReadmeAd = "in-article";
  adElement.className = "readme-in-article-ad";
  insertAdsenseScript(adElement);
  return adElement;
}

/**
 * Inserts Google Adsense in-article placeholders at README section boundaries.
 *
 * Ads are placed before headings when roughly one viewport of rendered or
 * estimated content has passed since the previous ad. A single end-of-content
 * fallback is used for headingless README files or long README files without
 * enough section headings.
 *
 * @param {HTMLElement} containerElement - The README container element.
 */
export function addAdsenseInArticleAds(containerElement: HTMLElement): void {
  removeAdsenseInArticleAds(containerElement);

  const boundaryElements = Array.from(
    containerElement.querySelectorAll<HTMLElement>("h2, h3, h4, h5"),
  );
  const totalContentLength =
    getEstimatedContainerContentLength(containerElement);
  const options = { viewportHeightPx: getViewportHeightPx() };
  const boundaries = boundaryElements.map((boundaryElement, index) => ({
    estimatedContentLength: getEstimatedContentLengthBefore(
      containerElement,
      boundaryElement,
    ),
    isFirstContentHeading: index === 0,
    measuredTopPx: getMeasuredTopPx(containerElement, boundaryElement),
  }));
  const placementIndexes = selectAdsenseInArticleBoundaryIndexes(
    boundaries,
    options,
  );

  placementIndexes.forEach((boundaryIndex) => {
    const boundaryElement = boundaryElements[boundaryIndex];
    boundaryElement.parentNode?.insertBefore(
      createAdsenseInArticleAd(),
      boundaryElement,
    );
  });

  if (
    shouldAppendAdsenseInArticleFallbackAd(
      totalContentLength,
      placementIndexes.length,
      boundaryElements.length,
      options,
    )
  ) {
    containerElement.appendChild(createAdsenseInArticleAd());
  }
}

/**
 * Inserts the Google Adsense script into the specified element.
 * @param adElement the element to insert the adsense script into
 */
function insertAdsenseScript(adElement: HTMLElement): void {
  // Create the ins element
  const insTag = document.createElement("ins");
  insTag.className = "adsbygoogle";
  insTag.style.cssText = "display: block; text-align: center;";
  insTag.dataset.adLayout = "in-article";
  insTag.dataset.adFormat = "fluid";
  insTag.dataset.adClient = "ca-pub-1509006252899759";
  insTag.dataset.adSlot = "7957381990";

  // Create the second script element
  const scriptTag = document.createElement("script");
  scriptTag.textContent = "(adsbygoogle = window.adsbygoogle || []).push({});";

  // Append the elements to the adElement
  adElement.appendChild(insTag);
  adElement.appendChild(scriptTag);
}
