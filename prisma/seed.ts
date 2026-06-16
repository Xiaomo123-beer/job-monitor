import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const templates = [
  {
    domain: "zhipin.com",
    name: "Boss直聘",
    selectors: JSON.stringify({
      listContainer: ".job-list-box .job-card-wrapper",
      title: ".job-name",
      company: ".company-name",
      salary: ".salary",
      location: ".job-area",
      experience: ".tag-list li:nth-child(1)",
      education: ".tag-list li:nth-child(2)",
      link: ".job-card-body a",
      nextPage: ".options-pages .next",
    }),
  },
  {
    domain: "liepin.com",
    name: "猎聘",
    selectors: JSON.stringify({
      listContainer: ".job-list-item",
      title: ".job-title",
      company: ".company-name",
      salary: ".job-salary",
      location: ".job-area",
      experience: ".job-qualifications span:nth-child(1)",
      education: ".job-qualifications span:nth-child(2)",
      link: ".job-title a",
      nextPage: ".pagination .next",
    }),
  },
  {
    domain: "lagou.com",
    name: "拉勾",
    selectors: JSON.stringify({
      listContainer: ".item__10RTO",
      title: ".p-top__1B7zG",
      company: ".company-name__2-SjF",
      salary: ".money__3LKGq",
      location: ".illegal__3bbbb",
      experience: ".li_b_r__16g9y:nth-child(1)",
      link: "a",
      nextPage: ".pager_next",
    }),
  },
  {
    domain: "zhaopin.com",
    name: "智联招聘",
    selectors: JSON.stringify({
      listContainer: ".joblist-box__item",
      title: ".jobinfo__top__title",
      company: ".jobinfo__top__company",
      salary: ".jobinfo__top__salary",
      location: ".jobinfo__other__info__item:nth-child(1)",
      experience: ".jobinfo__other__info__item:nth-child(2)",
      education: ".jobinfo__other__info__item:nth-child(3)",
      link: ".jobinfo__top__title a",
      nextPage: ".pagination .next",
    }),
  },
  {
    domain: "linkedin.com",
    name: "LinkedIn",
    selectors: JSON.stringify({
      listContainer: ".jobs-search__results-list li",
      title: ".base-search-card__title",
      company: ".base-search-card__subtitle",
      salary: ".job-search-card__salary-info",
      location: ".job-search-card__location",
      link: ".base-card__full-link",
      nextPage: ".artdeco-pagination__button--next",
    }),
  },
];

async function main() {
  console.log("Seeding crawl templates...");
  for (const t of templates) {
    await prisma.crawlTemplate.upsert({
      where: { domain: t.domain },
      update: t,
      create: t,
    });
  }

  console.log("Creating default user settings...");
  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
