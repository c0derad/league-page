const NCAA_LOGO_BASE =
    'https://ncaa-api.henrygd.me/logo';

const LOCAL_FALLBACKS = {
    'james-madison': '/college-logos/james-madison.png',
    'louisiana-tech': '/college-logos/louisiana-tech.png'
};

export const collegeLogo = (
    slug,
    dark = true
) => {
    if (!slug) return null;

    const safeSlug =
        String(slug)
            .trim()
            .toLowerCase();

    return `${NCAA_LOGO_BASE}/${safeSlug}.svg${
        dark ? '?dark=true' : ''
    }`;
};

export const collegeLogoFallback = (
    slug
) => {
    if (!slug) return null;

    return LOCAL_FALLBACKS[
        String(slug)
            .trim()
            .toLowerCase()
    ] || null;
};
