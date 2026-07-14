import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ENDPOINT = "https://leetcode.cn/graphql/";
const PAGE_SIZE = 100;
const OUTPUT = path.resolve("src/data/catalog.json");

const query = `
  query problemsetQuestionListV2($limit: Int, $skip: Int) {
    problemsetQuestionListV2(limit: $limit, skip: $skip) {
      totalLength
      questions {
        acRate
        difficulty
        questionFrontendId
        titleSlug
        title
        translatedTitle
        paidOnly
        topicTags { name slug nameTranslated }
      }
    }
  }
`;

type RawTag = {
  name: string;
  slug: string;
  nameTranslated?: string;
};

type RawQuestion = {
  acRate: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionFrontendId: string;
  titleSlug: string;
  title: string;
  translatedTitle?: string;
  paidOnly: boolean;
  topicTags: RawTag[];
};

type Page = {
  data?: {
    problemsetQuestionListV2: {
      totalLength: number;
      questions: RawQuestion[];
    };
  };
  errors?: Array<{ message: string }>;
};

async function fetchPage(skip: number): Promise<Page> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: "https://leetcode.cn/problemset/",
      "user-agent": "AlgoNote catalog sync/1.0"
    },
    body: JSON.stringify({ query, variables: { limit: PAGE_SIZE, skip } })
  });

  if (!response.ok) {
    throw new Error(`LeetCode catalog request failed: ${response.status}`);
  }

  return (await response.json()) as Page;
}

async function main() {
  const first = await fetchPage(0);
  if (!first.data || first.errors?.length) {
    throw new Error(first.errors?.map((error) => error.message).join("; ") || "Empty catalog response");
  }

  const total = first.data.problemsetQuestionListV2.totalLength;
  const questions = [...first.data.problemsetQuestionListV2.questions];

  for (let skip = PAGE_SIZE; skip < total; skip += PAGE_SIZE) {
    const page = await fetchPage(skip);
    if (!page.data || page.errors?.length) {
      throw new Error(page.errors?.map((error) => error.message).join("; ") || `Empty page at ${skip}`);
    }
    questions.push(...page.data.problemsetQuestionListV2.questions);
    process.stdout.write(`\rSynced ${Math.min(skip + PAGE_SIZE, total)}/${total}`);
  }

  const normalized = questions.map((question) => ({
    id: question.questionFrontendId,
    title: question.title,
    titleCn: question.translatedTitle || question.title,
    slug: question.titleSlug,
    difficulty: question.difficulty.toLowerCase(),
    acceptance: Math.round(question.acRate * 1000) / 10,
    paidOnly: question.paidOnly,
    tags: question.topicTags.map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      nameCn: tag.nameTranslated || tag.name
    }))
  }));

  if (normalized.length !== total) {
    throw new Error(`Catalog is incomplete: expected ${total}, received ${normalized.length}`);
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(
    OUTPUT,
    `${JSON.stringify({ syncedAt: new Date().toISOString(), total: normalized.length, questions: normalized })}\n`,
    "utf8"
  );
  process.stdout.write(`\nWrote ${normalized.length} questions to ${OUTPUT}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
