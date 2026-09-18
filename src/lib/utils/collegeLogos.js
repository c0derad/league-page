const NCAA_LOGO_BASE =
    'https://ncaa-api.henrygd.me/logo';

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
