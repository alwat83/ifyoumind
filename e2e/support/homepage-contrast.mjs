// Axe marks gradient-backed text as incomplete; verify these light sections explicitly.
export async function homepageHeadingContrasts(page) {
  return page.locator('.any-data h2,.life-preview h2,.business-intro h2').evaluateAll(headings => {
    const luminance = rgb => rgb.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    // Endpoints/base of the pale backgrounds behind these headings. Check the worst case.
    const backgrounds = [[238, 242, 255], [240, 253, 250], [247, 248, 250]];
    return headings.map(heading => {
      const style = getComputedStyle(heading);
      const foreground = luminance(style.color.match(/[\d.]+/g).slice(0, 3).map(Number));
      const ratios = backgrounds.map(rgb => {
        const background = luminance(rgb);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      return { text: heading.textContent, color: style.color, fontSize: parseFloat(style.fontSize), minimumRatio: Math.min(...ratios) };
    });
  });
}
