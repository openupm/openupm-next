/**
 * Inserts a Google Adsense ad placeholder after every 5-8 paragraphs within the specified container.
 *
 * @param {HTMLElement} containerElement - The container element within which ads should be inserted.
 */
export function addAdsenseInArticleAds(containerElement: HTMLElement): void {
  // Select all paragraph elements within the container
  const paragraphs = containerElement.querySelectorAll("p, h1, h2, h3, h4, h5");
  // Track of how many paragraphs we've processed
  let paragraphCount = 0;
  // Calculate the position of the next ad
  let nextAdPosition = 7;

  // Iterate over the paragraphs
  paragraphs.forEach((paragraph, index) => {
    // Increment the paragraph count
    paragraphCount++;

    // Check if the current paragraph is at a position where we should insert an ad
    // We're choosing a random number between 5 and 8 to determine the position
    if (paragraphCount === nextAdPosition || index === paragraphs.length - 1) {
      // Create a new <div> element for the ad
      const adElement = document.createElement("div");
      insertAdsenseScript(adElement);
      // Insert the ad after the current paragraph
      paragraph.parentNode!.insertBefore(adElement, paragraph.nextSibling);

      // Reset the paragraph count and calculate the next ad position
      paragraphCount = 0;
      nextAdPosition = getRandomInt(15, 20);
    }
  });
}

/**
 * Generates a random integer between the specified minimum (inclusive) and maximum (exclusive) values.
 *
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (exclusive).
 * @returns {number} A random integer between the min and max values.
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
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
