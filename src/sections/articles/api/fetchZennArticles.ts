interface ZennArticlesResponse {
	articles: {
		id: number;
		post_type: string;
		title: string;
		slug: string;
		comments_count: number;
		liked_count: number;
		body_letters_count: number;
		article_type: string;
		emoji: string;
		is_suspending_private: boolean;
		published_at: string;
		body_updated_at: string;
		source_repo_updated_at: string;
		pinned: boolean;
		path: string;
		user: {
			id: number;
			username: string;
			name: string;
			avatar_small_url: string;
		};
	}[];
	next_page: number;
}

export async function fetchZennArticles() {
	const res = await fetch(
		"https://zenn.dev/api/articles?username=matty5791&order=latest&count=3",
	);
	const data = (await res.json()) as ZennArticlesResponse;
	return data.articles;
}
