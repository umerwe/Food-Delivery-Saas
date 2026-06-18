import { getRequest, postRequest } from "@/services/http";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const getNumber = (value: unknown) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const getNullableNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const unwrapData = (value: unknown) => (isRecord(value) && isRecord(value.data) ? value.data : value);

export type AboutContent = {
  restaurantId: string;
  restaurantName: string;
  tenantId: string;
  tenantName: string;
  restaurantCoverImage: string | null;
  title: string;
  content: string | null;
  pageContent: AboutPageContent | null;
};

export type AboutHeroContent = {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  ctaLabel: string;
  ctaHref: string;
};

export type AboutStoryContent = {
  eyebrow: string;
  title: string;
  paragraphs: string;
  imageUrl: string | null;
  badge: string | null;
};

export type AboutTextCard = {
  title: string;
  description: string;
};

export type AboutStat = {
  value: string;
  label: string;
};

export type AboutTeamMember = {
  name: string;
  role: string;
  imageUrl: string | null;
};

export type AboutTestimonial = {
  name: string;
  role: string;
  imageUrl: string | null;
  quote: string;
  rating: number;
};

export type AboutCtaContent = {
  title: string;
  description: string;
  imageUrl: string | null;
  appStoreUrl: string | null;
  playStoreUrl: string | null;
  subscribeTitle: string;
  subscribeDescription: string;
};

export type AboutPageContent = {
  hero?: AboutHeroContent;
  story?: AboutStoryContent;
  missionVisionValues?: AboutTextCard[];
  whyChooseUs?: AboutTextCard[];
  stats?: AboutStat[];
  team?: AboutTeamMember[];
  testimonials?: AboutTestimonial[];
  cta?: AboutCtaContent;
};

export type BranchStats = {
  completedOrders: number;
  activeMenuItems: number;
  reviewCount: number;
  averageRating: number | null;
  fiveStarReviews: number;
};

export type CustomerReview = {
  id: string;
  restaurantId: string;
  branchId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  branch: {
    id: string;
    name: string;
  };
};

export type CustomerReviewsSummary = {
  reviewCount: number;
  averageRating: number | null;
};

export type CustomerReviewsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type CustomerReviewsResponse = {
  items: CustomerReview[];
  summary: CustomerReviewsSummary;
  meta: CustomerReviewsMeta;
};

export type CustomerReviewsParams = {
  restaurantId?: string | null;
  branchId?: string | null;
  page?: number;
  limit?: number;
  rating?: number | null;
};

export type HelpSupportContent = {
  restaurantId: string;
  restaurantCoverImage: string | null;
  branchId: string | null;
  title: string;
  content: string | null;
  contacts: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
  };
};

export type CustomerFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
};

export type CustomerFaqsResponse = {
  restaurantId: string;
  restaurantCoverImage: string | null;
  branchId: string | null;
  categories: string[];
  items: CustomerFaqItem[];
};

export type ContactFormPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const normalizeOptionalUrl = (value: unknown) => getString(value) ?? null;

const normalizeTextCard = (value: unknown): AboutTextCard | null => {
  const record = isRecord(value) ? value : {};
  const title = getString(record.title);
  const description = getString(record.description);

  if (!title && !description) {
    return null;
  }

  return {
    title: title ?? "",
    description: description ?? "",
  };
};

const normalizeTextCardList = (value: unknown) =>
  Array.isArray(value)
    ? value.map(normalizeTextCard).filter((item): item is AboutTextCard => Boolean(item))
    : [];

const normalizeAboutPageContent = (value: unknown): AboutPageContent | null => {
  const record = isRecord(value) ? value : null;

  if (!record) {
    return null;
  }

  const hero = isRecord(record.hero) ? record.hero : null;
  const story = isRecord(record.story) ? record.story : null;
  const cta = isRecord(record.cta) ? record.cta : null;
  const team = Array.isArray(record.team)
    ? record.team
      .filter(isRecord)
      .map((member) => ({
        name: getString(member.name) ?? "",
        role: getString(member.role) ?? "",
        imageUrl: normalizeOptionalUrl(member.imageUrl),
      }))
      .filter((member) => member.name || member.role)
    : [];
  const testimonials = Array.isArray(record.testimonials)
    ? record.testimonials
      .filter(isRecord)
      .map((testimonial) => ({
        name: getString(testimonial.name) ?? "",
        role: getString(testimonial.role) ?? "",
        imageUrl: normalizeOptionalUrl(testimonial.imageUrl),
        quote: getString(testimonial.quote) ?? "",
        rating: Math.round(Math.min(5, Math.max(0, getNumber(testimonial.rating)))),
      }))
      .filter((testimonial) => testimonial.name || testimonial.quote)
    : [];
  const stats = Array.isArray(record.stats)
    ? record.stats
      .filter(isRecord)
      .map((stat) => ({
        value: getString(stat.value) ?? "",
        label: getString(stat.label) ?? "",
      }))
      .filter((stat) => stat.value || stat.label)
    : [];

  return {
    hero: hero
      ? {
          title: getString(hero.title) ?? "",
          subtitle: getString(hero.subtitle) ?? "",
          imageUrl: normalizeOptionalUrl(hero.imageUrl),
          ctaLabel: getString(hero.ctaLabel) ?? "",
          ctaHref: getString(hero.ctaHref) ?? "",
        }
      : undefined,
    story: story
      ? {
          eyebrow: getString(story.eyebrow) ?? "",
          title: getString(story.title) ?? "",
          paragraphs: getString(story.paragraphs) ?? "",
          imageUrl: normalizeOptionalUrl(story.imageUrl),
          badge: getString(story.badge) ?? null,
        }
      : undefined,
    missionVisionValues: normalizeTextCardList(record.missionVisionValues),
    whyChooseUs: normalizeTextCardList(record.whyChooseUs),
    stats,
    team,
    testimonials,
    cta: cta
      ? {
          title: getString(cta.title) ?? "",
          description: getString(cta.description) ?? "",
          imageUrl: normalizeOptionalUrl(cta.imageUrl),
          appStoreUrl: normalizeOptionalUrl(cta.appStoreUrl),
          playStoreUrl: normalizeOptionalUrl(cta.playStoreUrl),
          subscribeTitle: getString(cta.subscribeTitle) ?? "",
          subscribeDescription: getString(cta.subscribeDescription) ?? "",
        }
      : undefined,
  };
};

export const parseAboutPageContent = (content?: string | null): AboutPageContent | null => {
  const match = content?.match(/<!--\s*deliveryway-about-page:([\s\S]*?)-->/i);
  const encodedContent = match?.[1]?.trim();

  if (!encodedContent) {
    return null;
  }

  try {
    return normalizeAboutPageContent(JSON.parse(decodeURIComponent(encodedContent)));
  } catch {
    return null;
  }
};

export const normalizeAboutContent = (value: unknown): AboutContent => {
  const record = isRecord(value) ? value : {};
  const content = getString(record.content) ?? null;

  return {
    restaurantId: getString(record.restaurantId) ?? "",
    restaurantName: getString(record.restaurantName) ?? "",
    tenantId: getString(record.tenantId) ?? "",
    tenantName: getString(record.tenantName) ?? "",
    restaurantCoverImage: getString(record.restaurantCoverImage) ?? null,
    title: getString(record.title) ?? "About Us",
    content,
    pageContent: parseAboutPageContent(content),
  };
};

export const normalizeBranchStats = (value: unknown): BranchStats => {
  const record = isRecord(value) ? value : {};

  return {
    completedOrders: getNumber(record.completedOrders),
    activeMenuItems: getNumber(record.activeMenuItems),
    reviewCount: getNumber(record.reviewCount),
    averageRating: getNullableNumber(record.averageRating),
    fiveStarReviews: getNumber(record.fiveStarReviews),
  };
};

const normalizeCustomerReview = (value: unknown): CustomerReview | null => {
  const record = isRecord(value) ? value : null;

  if (!record) {
    return null;
  }

  const customer = isRecord(record.customer) ? record.customer : {};
  const branch = isRecord(record.branch) ? record.branch : {};

  return {
    id: getString(record.id) ?? "",
    restaurantId: getString(record.restaurantId) ?? "",
    branchId: getString(record.branchId) ?? "",
    orderId: getString(record.orderId) ?? "",
    rating: getNumber(record.rating),
    comment: getString(record.comment) ?? null,
    createdAt: getString(record.createdAt) ?? "",
    customer: {
      id: getString(customer.id) ?? "",
      firstName: getString(customer.firstName) ?? null,
      lastName: getString(customer.lastName) ?? null,
      avatarUrl: getString(customer.avatarUrl) ?? null,
    },
    branch: {
      id: getString(branch.id) ?? "",
      name: getString(branch.name) ?? "",
    },
  };
};

export const normalizeCustomerReviewsResponse = (
  value: unknown,
  metaValue?: unknown
): CustomerReviewsResponse => {
  const root = isRecord(value) ? value : {};
  const data = unwrapData(value);
  const record = isRecord(data) ? data : {};
  const summary = isRecord(record.summary) ? record.summary : {};
  const meta = isRecord(metaValue) ? metaValue : isRecord(root.meta) ? root.meta : {};
  const items = Array.isArray(record.items)
    ? record.items.map(normalizeCustomerReview).filter((item): item is CustomerReview => Boolean(item))
    : [];

  return {
    items,
    summary: {
      reviewCount: getNumber(summary.reviewCount),
      averageRating: getNullableNumber(summary.averageRating),
    },
    meta: {
      page: getNumber(meta.page),
      limit: getNumber(meta.limit),
      total: getNumber(meta.total),
      totalPages: getNumber(meta.totalPages),
      hasNext: meta.hasNext === true,
      hasPrevious: meta.hasPrevious === true,
    },
  };
};

export const normalizeHelpSupportContent = (value: unknown): HelpSupportContent => {
  const record = isRecord(value) ? value : {};
  const contacts = isRecord(record.contacts) ? record.contacts : {};

  return {
    restaurantId: getString(record.restaurantId) ?? "",
    restaurantCoverImage: getString(record.restaurantCoverImage) ?? null,
    branchId: getString(record.branchId) ?? null,
    title: getString(record.title) ?? "Help & Support",
    content: getString(record.content) ?? null,
    contacts: {
      phone: getString(contacts.phone) ?? null,
      whatsapp: getString(contacts.whatsapp) ?? null,
      email: getString(contacts.email) ?? null,
    },
  };
};

const normalizeCustomerFaqItem = (value: unknown): CustomerFaqItem | null => {
  const record = isRecord(value) ? value : null;

  if (!record) {
    return null;
  }

  const question = getString(record.question);
  const answer = getString(record.answer);

  if (!question || !answer) {
    return null;
  }

  return {
    id: getString(record.id) ?? question,
    question,
    answer,
    category: getString(record.category) ?? null,
  };
};

export const normalizeCustomerFaqsResponse = (value: unknown): CustomerFaqsResponse => {
  const data = unwrapData(value);
  const record = isRecord(data) ? data : {};
  const categories = Array.isArray(record.categories)
    ? record.categories.map(getString).filter((item): item is string => Boolean(item))
    : [];
  const items = Array.isArray(record.items)
    ? record.items.map(normalizeCustomerFaqItem).filter((item): item is CustomerFaqItem => Boolean(item))
    : [];

  return {
    restaurantId: getString(record.restaurantId) ?? "",
    restaurantCoverImage: getString(record.restaurantCoverImage) ?? null,
    branchId: getString(record.branchId) ?? null,
    categories,
    items,
  };
};

export const fetchAboutContent = async (restaurantId: string) => {
  const response = await getRequest(
    `/v1/public-content/about-us?restaurantId=${encodeURIComponent(restaurantId)}`
  );

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load About content");
  }

  return normalizeAboutContent(response.data);
};

export const fetchBranchStats = async (restaurantId: string, branchId?: string | null) => {
  const params = new URLSearchParams({ restaurantId });

  if (branchId) {
    params.set("branchId", branchId);
  }

  const response = await getRequest(`/customer-app/branch-stats?${params.toString()}`);

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load branch stats");
  }

  return normalizeBranchStats(unwrapData(response.data));
};

export const fetchCustomerReviews = async ({
  restaurantId,
  branchId,
  page = 1,
  limit = 10,
  rating,
}: CustomerReviewsParams) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (restaurantId) {
    params.set("restaurantId", restaurantId);
  }

  if (branchId) {
    params.set("branchId", branchId);
  }

  if (rating) {
    params.set("rating", String(rating));
  }

  const response = await getRequest(`/customer-app/reviews?${params.toString()}`);

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load reviews");
  }

  return normalizeCustomerReviewsResponse(response.data, response.meta);
};

export const fetchHelpSupportContent = async (restaurantId: string, branchId?: string | null) => {
  const params = new URLSearchParams({ restaurantId });

  if (branchId) {
    params.set("branchId", branchId);
  }

  const response = await getRequest(`/v1/public-content/help-support?${params.toString()}`);

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load support content");
  }

  return normalizeHelpSupportContent(response.data);
};

export const fetchCustomerFaqs = async (restaurantId: string, branchId?: string | null) => {
  const params = new URLSearchParams({ restaurantId });

  if (branchId) {
    params.set("branchId", branchId);
  }

  const response = await getRequest(`/v1/public-content/faqs?${params.toString()}`);

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load FAQs");
  }

  return normalizeCustomerFaqsResponse(response.data);
};

export const submitContactForm = async (
  restaurantId: string,
  branchId: string | null | undefined,
  payload: ContactFormPayload
) => {
  const params = new URLSearchParams({ restaurantId });

  if (branchId) {
    params.set("branchId", branchId);
  }

  return postRequest(`/v1/public-content/contact-form?${params.toString()}`, payload);
};
