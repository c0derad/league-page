import { getNews } from '$lib/utils/helper';

export async function load({ fetch, data }) {
    const articlesData = getNews(fetch);

    return {
        ...data,
        articlesData
    };
}
