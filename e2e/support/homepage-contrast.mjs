// Direct heading regression complements axe and catches inherited global-theme text colors.
// This page uses opaque solid backgrounds; read the actual nearest painted ancestor.
export async function homepageHeadingContrasts(page) {
  return page.locator('.hero h1,.hero h1 em,.discovery h2,.decision-detail h3,.sample h2,.trust h2,.business h2,.pricing h2').evaluateAll(headings => {
    const luminance = rgb => rgb.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const channels = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
    return headings.map(heading => {
      const style = getComputedStyle(heading);
      let ancestor = heading;
      while (ancestor.parentElement && getComputedStyle(ancestor).backgroundColor === 'rgba(0, 0, 0, 0)') ancestor = ancestor.parentElement;
      const background = getComputedStyle(ancestor).backgroundColor;
      const foregroundLuminance = luminance(channels(style.color));
      const backgroundLuminance = luminance(channels(background));
      return { text: heading.textContent, color: style.color, background, fontSize: parseFloat(style.fontSize), minimumRatio: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05) };
    });
  });
}
